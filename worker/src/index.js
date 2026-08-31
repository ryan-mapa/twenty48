import { replay, RULESET_VERSION } from '../../public/source/engine.js';
import { signJwt, verifyJwt, hashIp } from './auth.js';

// This Worker serves both the game (static assets from ../public) and the
// leaderboard API, so everything is same-origin: no CORS, and auth can use an
// HttpOnly cookie that page scripts cannot read.

const SESSION_TTL_MS = 6 * 60 * 60 * 1000;  // a run must be submitted within 6h
const MAX_MOVES = 20000;
const MIN_MS_PER_MOVE = 200;                // client debounce is 250ms; 200 allows clock slack
const MINTS_PER_IP_PER_HOUR = 60;
const MAX_NAME = 20;
const SESSION_COOKIE = 'sushi48_session';
const COOKIE_TTL_SECONDS = 30 * 24 * 60 * 60;

function json(data, status = 200, extraHeaders = {}) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json', ...extraHeaders }
    });
}

function fail(message, status = 400) {
    return json({ error: message }, status);
}

function readCookie(request, name) {
    const header = request.headers.get('Cookie') || '';
    for (const part of header.split(';')) {
        const [key, ...rest] = part.trim().split('=');
        if (key === name) return rest.join('=');
    }
    return null;
}

function sessionCookie(value, maxAge) {
    // Lax rather than Strict: the browser arrives here via a top-level
    // redirect from GitHub, and Strict would withhold the cookie on that hop.
    return `${SESSION_COOKIE}=${value}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

// Strips control characters and collapses whitespace, so a name cannot be
// padded out with invisible characters. Rendering uses textContent, so this
// is about length and legibility rather than injection.
export function normaliseName(raw) {
    if (typeof raw !== 'string') return '';
    return raw
        .replace(/[\u0000-\u001F\u007F]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

// A name the player typed: they control the length, so an over-long one is a
// mistake worth reporting rather than silently changing.
export function cleanName(raw) {
    const name = normaliseName(raw);
    return name.length >= 1 && name.length <= MAX_NAME ? name : null;
}

// A name that came from an OAuth profile: the player did not choose its
// length, so truncate rather than reject. Rejecting would drop someone whose
// account name runs long onto the 'Player' fallback.
export function accountName(raw) {
    const name = normaliseName(raw);
    if (!name) return null;
    if (name.length <= MAX_NAME) return name;
    return name.slice(0, MAX_NAME - 1).trimEnd() + '\u2026';
}

async function currentUser(request, env) {
    const token = readCookie(request, SESSION_COOKIE);
    if (!token) return null;
    return verifyJwt(token, env.JWT_SECRET);
}

// GET /me — lets the page know whether it can post without exposing the token.
async function whoAmI(request, env) {
    const user = await currentUser(request, env);
    if (!user) return json({ signedIn: false });
    return json({ signedIn: true, name: user.name });
}

// POST /session — hand out a seed and remember it. No auth: players are
// anonymous until they choose to post a score.
async function createSession(request, env) {
    const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';
    const ipHash = await hashIp(ip, env.IP_SALT);
    const now = Date.now();

    const { count } = await env.DB.prepare(
        'SELECT COUNT(*) AS count FROM sessions WHERE ip_hash = ? AND created_at > ?'
    ).bind(ipHash, now - 60 * 60 * 1000).first();

    if (count >= MINTS_PER_IP_PER_HOUR) {
        return fail('too many games started; try again later', 429);
    }

    const id = crypto.randomUUID();
    const seed = crypto.getRandomValues(new Uint32Array(1))[0];

    await env.DB.prepare(
        'INSERT INTO sessions (id, seed, ruleset_version, created_at, ip_hash) VALUES (?, ?, ?, ?, ?)'
    ).bind(id, seed, RULESET_VERSION, now, ipHash).run();

    return json({ sessionId: id, seed, rulesetVersion: RULESET_VERSION });
}

// POST /session/:id/submit — the only path that writes a score, and the only
// place the game rules are trusted. The client's own score is never read.
async function submitSession(request, env, sessionId) {
    const user = await currentUser(request, env);

    let body;
    try {
        body = await request.json();
    } catch {
        return fail('malformed body');
    }

    const { moves, timings } = body;
    if (typeof moves !== 'string' || !Array.isArray(timings)) {
        return fail('moves and timings are required');
    }

    // Signed in: the account owns the name. Otherwise the player supplies one
    // and it is marked unverified.
    const displayName = user ? user.name : cleanName(body.name);
    if (!displayName) return fail('choose a name of 1 to 20 characters');
    if (moves.length === 0) return fail('empty run');
    if (moves.length > MAX_MOVES) return fail('run too long');
    if (timings.length !== moves.length) return fail('timings do not match moves');

    const session = await env.DB.prepare('SELECT * FROM sessions WHERE id = ?').bind(sessionId).first();
    if (!session) return fail('unknown session', 404);
    if (session.submitted_at) return fail('session already submitted', 409);
    if (Date.now() - session.created_at > SESSION_TTL_MS) return fail('session expired', 410);
    if (session.ruleset_version !== RULESET_VERSION) {
        return fail('session was created under an older ruleset', 409);
    }

    // Timings must be non-decreasing, and the run cannot be faster than the
    // client's own 250ms move debounce allows.
    for (let i = 1; i < timings.length; i++) {
        if (!Number.isFinite(timings[i]) || timings[i] < timings[i - 1]) {
            return fail('invalid timings');
        }
    }
    const durationMs = timings[timings.length - 1];
    if (durationMs < MIN_MS_PER_MOVE * moves.length) {
        return fail('run is faster than humanly possible', 422);
    }

    let engine;
    try {
        engine = replay(session.seed, moves);
    } catch {
        return fail('move log could not be replayed', 422);
    }
    if (!engine.over) return fail('run did not end in a finished game', 422);

    // A session cookie lives for 30 days and outlives its users row if that
    // row is ever removed. Without this the insert below fails on the foreign
    // key and surfaces as a 500 rather than something actionable.
    if (user) {
        const known = await env.DB.prepare('SELECT 1 AS ok FROM users WHERE id = ?')
            .bind(user.sub).first();
        if (!known) return fail('your sign-in is no longer valid; sign in again', 401);
    }

    const { score, maxTile } = engine.snapshot();
    const now = Date.now();

    await env.DB.batch([
        env.DB.prepare('UPDATE sessions SET submitted_at = ? WHERE id = ?').bind(now, sessionId),
        env.DB.prepare(
            `INSERT INTO scores
                (session_id, user_id, display_name, verified,
                 score, max_tile, move_count, duration_ms, ruleset_version, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
            sessionId, user ? user.sub : null, displayName, user ? 1 : 0,
            score, maxTile, moves.length, durationMs, RULESET_VERSION, now
        )
    ]);

    // Rank is simply how many runs beat this one.
    const { rank } = await env.DB.prepare(
        'SELECT COUNT(*) + 1 AS rank FROM scores WHERE ruleset_version = ? AND score > ?'
    ).bind(RULESET_VERSION, score).first();

    return json({ score, maxTile, rank, displayName, verified: Boolean(user) });
}

// GET /scores — each player's personal best, highest first.
async function listScores(request, env) {
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10) || 100, 100);

    // Every run stands on its own: no collapsing to a personal best, so a
    // player's earlier scores stay on the board. Matches idx_scores_rank
    // exactly, so this is an index scan rather than a sort of the table.
    const { results } = await env.DB.prepare(
        `SELECT display_name, score, max_tile, verified, created_at
         FROM scores
         WHERE ruleset_version = ?
         ORDER BY score DESC
         LIMIT ?`
    ).bind(RULESET_VERSION, limit).all();

    return json({ scores: results }, 200, { 'Cache-Control': 'public, max-age=10' });
}

// GET /auth/google/start — the OAuth `state` is a short-lived signed token
// rather than a stored nonce, so this stays stateless.
//
// Signing in is optional: it exists so a player can own their leaderboard
// name, not to gate play or even posting.
async function authStart(request, env) {
    const state = await signJwt({ purpose: 'oauth' }, env.JWT_SECRET, 600);

    const target = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    target.searchParams.set('client_id', env.GOOGLE_CLIENT_ID);
    target.searchParams.set('redirect_uri', new URL('/auth/google/callback', request.url).toString());
    target.searchParams.set('response_type', 'code');
    target.searchParams.set('scope', 'openid profile');
    target.searchParams.set('state', state);

    return Response.redirect(target.toString(), 302);
}

// Same-origin means a plain redirect works; no popup, nothing for a popup
// blocker to stop, and the token never touches page-readable storage.
function backToGame(request, message, cookie = null) {
    const target = new URL('/', request.url);
    if (message) target.searchParams.set('auth', message);

    const headers = { Location: target.toString() };
    if (cookie) headers['Set-Cookie'] = cookie;

    return new Response(null, { status: 302, headers });
}

async function authCallback(request, env) {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (!code || !(await verifyJwt(state, env.JWT_SECRET))) {
        return backToGame(request, 'failed');
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: env.GOOGLE_CLIENT_ID,
            client_secret: env.GOOGLE_CLIENT_SECRET,
            code,
            grant_type: 'authorization_code',
            redirect_uri: new URL('/auth/google/callback', request.url).toString()
        })
    });
    const { access_token: accessToken } = await tokenResponse.json();
    if (!accessToken) return backToGame(request, 'failed');

    const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    const profile = await profileResponse.json();
    if (!profile.sub) return backToGame(request, 'failed');

    // Only `openid profile` is requested, so no email is read or stored. The
    // leaderboard name is the given name, truncated to fit rather than
    // rejected if it runs long.
    const displayName = accountName(profile.given_name || profile.name) || 'Player';
    const userId = `google:${profile.sub}`;

    await env.DB.prepare(
        `INSERT INTO users (id, provider, provider_id, display_name, created_at)
         VALUES (?, 'google', ?, ?, ?)
         ON CONFLICT (provider, provider_id) DO UPDATE SET display_name = excluded.display_name`
    ).bind(userId, profile.sub, displayName, Date.now()).run();

    const token = await signJwt({ sub: userId, name: displayName }, env.JWT_SECRET, COOKIE_TTL_SECONDS);
    return backToGame(request, 'ok', sessionCookie(token, COOKIE_TTL_SECONDS));
}

function signOut(request) {
    return json({ signedIn: false }, 200, { 'Set-Cookie': sessionCookie('', 0) });
}

export default {
    async fetch(request, env) {
        const path = new URL(request.url).pathname;
        const method = request.method;

        if (method === 'GET' && path === '/me') return whoAmI(request, env);
        if (method === 'POST' && path === '/session') return createSession(request, env);

        const submit = path.match(/^\/session\/([\w-]+)\/submit$/);
        if (method === 'POST' && submit) return submitSession(request, env, submit[1]);

        if (method === 'GET' && path === '/scores') return listScores(request, env);
        if (method === 'GET' && path === '/auth/google/start') return authStart(request, env);
        if (method === 'GET' && path === '/auth/google/callback') return authCallback(request, env);
        if (method === 'POST' && path === '/auth/logout') return signOut(request);

        // Anything else is a static asset request that found no file.
        return fail('not found', 404);
    },

    // Sweeps sessions nobody ever submitted. Most minted sessions are
    // abandoned, so without this the table grows without bound.
    async scheduled(event, env) {
        await env.DB.prepare(
            'DELETE FROM sessions WHERE submitted_at IS NULL AND created_at < ?'
        ).bind(Date.now() - SESSION_TTL_MS).run();
    }
};
