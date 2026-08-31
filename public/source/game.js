import Engine, { MOVE_CHARS, RULESET_VERSION } from './engine.js';
import Renderer from './renderer.js';

// The server treats this as a hard floor when validating a submitted run
// (duration must be at least ~this much per move), so lowering it here
// without updating the Worker will start rejecting honest games.
const MOVE_INTERVAL = 250;

// How far a finger must travel before it counts as a swipe. The original
// code acted on the first touchmove event whatever its size, which made
// mis-swipes easy; this is half a tile on a 360px board.
const SWIPE_THRESHOLD = 40;

const KEY_DIRS = {
    ArrowLeft: 'left',
    ArrowUp: 'up',
    ArrowRight: 'right',
    ArrowDown: 'down'
};

function debounce(cb, interval) {
    let ready = true;
    return (...args) => {
        if (!ready) return;
        ready = false;
        cb(...args);
        setTimeout(() => (ready = true), interval);
    };
}

function randomSeed() {
    const buffer = new Uint32Array(1);
    crypto.getRandomValues(buffer);
    return buffer[0];
}

// Drives an Engine from user input and records what happened. Holds no game
// rules of its own — it is a recorder and a bridge to the Renderer.
export default class Game {
    constructor(rootEl, scoreEl, { seed = randomSeed(), onGameOver = null } = {}) {
        this.rootEl = rootEl;
        this.renderer = new Renderer(rootEl, scoreEl);
        this.onGameOver = onGameOver;
        this.handleMove = this.handleMove.bind(this);
        this.debouncedMove = debounce(this.handleMove, MOVE_INTERVAL);

        this.start(seed);
        this.addEventListeners();
    }

    start(seed) {
        this.seed = seed;
        this.engine = new Engine(seed);
        this.moves = [];
        this.timings = [];
        this.startedAt = Date.now();
        this.reported = false;
        this.renderer.render(this.engine.snapshot());
    }

    newGame(seed = randomSeed()) {
        this.start(seed);
    }

    handleMove(dir) {
        if (this.engine.over) return;

        const result = this.engine.move(dir);

        // Every direction the engine processed goes in the log, including
        // no-ops, so a replay is a pure function of (seed, moves).
        this.moves.push(MOVE_CHARS[dir]);
        this.timings.push(Date.now() - this.startedAt);

        // `result` carries the merge/vanish/spawn positions the renderer
        // animates.
        this.renderer.render(this.engine.snapshot(), result);

        if (result.gameOver && !this.reported) {
            this.reported = true;
            if (this.onGameOver) this.onGameOver(this.run());
        }
    }

    // The payload a leaderboard submission is built from. `score` is here for
    // display only; the server derives its own from seed + moves and ignores
    // anything the client claims.
    run() {
        const { score, maxTile } = this.engine.snapshot();
        return {
            rulesetVersion: RULESET_VERSION,
            seed: this.seed,
            moves: this.moves.join(''),
            timings: this.timings,
            durationMs: this.timings.length ? this.timings[this.timings.length - 1] : 0,
            moveCount: this.moves.length,
            score,
            maxTile
        };
    }

    addEventListeners() {
        document.addEventListener('keydown', e => {
            const dir = KEY_DIRS[e.key];
            if (!dir) return;
            e.preventDefault(); // arrows would otherwise scroll the page
            this.debouncedMove(dir);
        });

        let startX = null;
        let startY = null;
        let swiped = false;

        this.rootEl.addEventListener('touchstart', e => {
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            swiped = false;
        }, { passive: true });

        this.rootEl.addEventListener('touchmove', e => {
            e.preventDefault(); // stop the page panning under the finger
            if (startX === null || swiped) return;

            const dx = e.touches[0].clientX - startX;
            const dy = e.touches[0].clientY - startY;

            // Wait until the finger has committed to a distance before
            // deciding, so a small wobble does not fire a move.
            if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return;

            // One move per touch: the finger must lift before the next.
            swiped = true;

            if (Math.abs(dx) > Math.abs(dy)) {
                this.debouncedMove(dx > 0 ? 'right' : 'left');
            } else {
                this.debouncedMove(dy > 0 ? 'down' : 'up');
            }
        }, { passive: false });

        this.rootEl.addEventListener('touchend', () => {
            startX = null;
            startY = null;
            swiped = false;
        }, { passive: true });
    }
}
