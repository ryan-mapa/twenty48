import Game from './source/game.js';
import Leaderboard from './source/leaderboard.js';
import Overlay from './source/overlay.js';
import createGoogleButton from './source/google-button.js';
import {
    createSession, submitRun, fetchMe, signIn, signOut,
    savePending, loadPending, clearPending,
    rememberedName, rememberName
} from './source/api.js';

document.addEventListener('DOMContentLoaded', async () => {
    const rootEl = document.getElementById('g2048');
    const scoreEl = document.getElementById('score');
    const authEl = document.getElementById('auth');

    const leaderboard = new Leaderboard(
        document.getElementById('leaderboard-list'),
        document.getElementById('leaderboard-status')
    );

    // The id of the server-issued session the current game belongs to. Null
    // means we could not reach the API, so this run is playable but not
    // postable — there is no seed on record to verify it against.
    let sessionId = null;
    let finishedRun = null;
    let me = { signedIn: false };
    // Assigned once the first session is minted. Declared here so the auth
    // control, which renders before that, can safely test it.
    let game = null;

    // The overlay's sign-in control is the same branded button as the header.
    const overlaySignIn = createGoogleButton(null);
    document.getElementById('overlay-signin').appendChild(overlaySignIn);

    const overlay = new Overlay({
        root: document.getElementById('gameover'),
        score: document.getElementById('final-score'),
        status: document.getElementById('overlay-status'),
        post: document.getElementById('post-score'),
        playAgain: document.getElementById('play-again'),
        nameField: document.getElementById('name-field'),
        nameInput: document.getElementById('player-name'),
        signInLink: overlaySignIn
    }, { onPost: postScore, onPlayAgain: playAgain, onSignIn: startSignIn });

    // Shown from page load rather than only at game over, so signing in is
    // discoverable before a score is on the line.
    function renderAuth() {
        authEl.replaceChildren();

        if (!me.signedIn) {
            authEl.appendChild(createGoogleButton(() => startSignIn(), { compact: true }));
            return;
        }

        const name = document.createElement('span');
        name.className = 'auth-name';
        name.textContent = me.name;

        const link = document.createElement('a');
        link.href = '#';
        link.className = 'auth-signout';
        link.textContent = 'sign out';
        link.addEventListener('click', event => {
            event.preventDefault();
            signOut();
        });

        authEl.append(name, link);
    }

    // Signing in navigates away, which loses an unfinished board. Only worth
    // interrupting for if there is actually something to lose.
    function gameInProgress() {
        return game && !game.engine.over && game.run().moveCount > 0;
    }

    async function newSession() {
        try {
            const session = await createSession();
            sessionId = session.sessionId;
            return session.seed;
        } catch {
            sessionId = null;
            return undefined; // Game falls back to a local random seed
        }
    }

    function onGameOver(run) {
        finishedRun = run;
        if (sessionId) savePending(sessionId, run);

        overlay.show(run.score);
        overlay.setIdentity({ signedIn: me.signedIn, rememberedName: rememberedName() });

        if (!sessionId) {
            overlay.setPost('', false);
            overlay.setStatus('Offline — this run cannot be posted.');
        } else if (me.signedIn) {
            overlay.setPost('POST TO LEADERBOARD', true);
            overlay.setStatus(`Posting as ${me.name}.`);
        } else {
            overlay.setPost('POST TO LEADERBOARD', true);
            overlay.setStatus('');
        }
    }

    // Buffer any finished run first so it survives the round trip to Google
    // and posts automatically on return.
    function startSignIn() {
        if (finishedRun && sessionId) {
            savePending(sessionId, finishedRun);
        } else if (gameInProgress() && !confirm(
            'Signing in now will start a new game.\n\n' +
            'You do not have to sign in first — finish this game and you can ' +
            'sign in when you post your score, without losing your progress.\n\n' +
            'Sign in now anyway?')) {
            return;
        }
        signIn();
    }

    async function playAgain() {
        overlay.hide();
        finishedRun = null;
        game.newGame(await newSession());
    }

    async function postScore() {
        if (!finishedRun || !sessionId) return;

        // Anonymous players post under a name they type. No account needed.
        const name = me.signedIn ? null : overlay.name;
        if (!me.signedIn && !name) {
            overlay.setStatus('Enter a name first.');
            return;
        }

        overlay.setPost('POSTING…', false);

        try {
            const result = await submitRun(sessionId, finishedRun, name);
            clearPending();
            if (name) rememberName(name);

            overlay.setPost('', false);
            overlay.setStatus(`Posted as ${result.displayName} — rank #${result.rank}.`);
            await leaderboard.refresh(result.displayName);
        } catch (error) {
            overlay.setPost('TRY AGAIN', true);
            overlay.setStatus(error.message);
        }
    }

    // A run buffered before signing in, or one a previous visit never managed
    // to send.
    async function flushPending() {
        const pending = loadPending();
        if (!pending || !me.signedIn) return null;

        try {
            const result = await submitRun(pending.sessionId, pending.run);
            clearPending();
            return result;
        } catch {
            // Leave it buffered; the session may simply have expired, in
            // which case the next successful post will overwrite it.
            return null;
        }
    }

    document.getElementById('restart').addEventListener('click', playAgain);

    me = await fetchMe();
    renderAuth();

    game = new Game(rootEl, scoreEl, { seed: await newSession(), onGameOver });

    // ?auth=ok means we just came back from GitHub, so there is very likely a
    // buffered run waiting to go out.
    const authResult = new URLSearchParams(location.search).get('auth');
    if (authResult) history.replaceState(null, '', location.pathname);

    const posted = await flushPending();
    await leaderboard.refresh(posted ? posted.displayName : me.name);

    if (posted) {
        overlay.show(posted.score);
        overlay.setIdentity({ signedIn: true });
        overlay.setPost('', false);
        overlay.setStatus(`Posted as ${posted.displayName} — rank #${posted.rank}.`);
    } else if (authResult === 'failed') {
        overlay.setStatus('');
        leaderboard.statusEl.textContent = 'Sign-in failed. Try again.';
    }
});
