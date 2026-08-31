// All calls are same-origin: the Worker that serves this page also serves the
// API. Auth rides on an HttpOnly cookie, so there is no token here for a
// script — or an XSS — to steal.

const PENDING_KEY = 'sushi48.pending';
const NAME_KEY = 'sushi48.name';

// localStorage throws in private windows and when site data is blocked, so
// every access is guarded — a player with storage disabled should still be
// able to play, just without the retry buffer.
function read(key) {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

function write(key, value) {
    try {
        if (value === null) localStorage.removeItem(key);
        else localStorage.setItem(key, value);
    } catch {
        /* nothing we can do; the game still works */
    }
}

// A finished run waiting to be posted. Written before signing in, so the
// score survives the round trip to GitHub and back.
export function savePending(sessionId, run) {
    write(PENDING_KEY, JSON.stringify({ sessionId, run }));
}

export function loadPending() {
    const raw = read(PENDING_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        write(PENDING_KEY, null);
        return null;
    }
}

export function clearPending() {
    write(PENDING_KEY, null);
}

// The last name an anonymous player posted under, so they do not have to
// retype it every game.
export function rememberedName() {
    return read(NAME_KEY) || '';
}

export function rememberName(name) {
    write(NAME_KEY, name);
}

async function parse(response) {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `request failed (${response.status})`);
    return data;
}

export async function fetchMe() {
    try {
        return await parse(await fetch('/me', { credentials: 'same-origin' }));
    } catch {
        return { signedIn: false };
    }
}

export async function createSession() {
    return parse(await fetch('/session', { method: 'POST' }));
}

export async function fetchScores(limit = 100) {
    return parse(await fetch(`/scores?limit=${limit}`));
}

// `name` is ignored by the server when the request carries a valid session
// cookie — an account's name always wins over anything the page sends.
export async function submitRun(sessionId, run, name = null) {
    return parse(await fetch(`/session/${sessionId}/submit`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        // Only the move log, timings and a name. The server derives the score
        // itself; there is deliberately nothing here to inflate.
        body: JSON.stringify({ moves: run.moves, timings: run.timings, name })
    }));
}

// A full-page redirect rather than a popup: nothing for a popup blocker to
// stop, and the run is already buffered before we leave.
export function signIn() {
    location.assign('/auth/google/start');
}

export async function signOut() {
    await fetch('/auth/logout', { method: 'POST', credentials: 'same-origin' });
    location.assign('/');
}
