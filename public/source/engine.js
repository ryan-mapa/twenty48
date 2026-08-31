import mulberry32 from './rng.js';

// Pure 2048 rules: no DOM, no globals, no clock.
//
// This module is the single definition of the game. The browser runs it to
// play, and the leaderboard Worker runs this exact file to replay a submitted
// move log and derive the real score. Anything non-deterministic added here
// breaks verification, so keep it pure.

export const RULESET_VERSION = 1;
export const SIZE = 4;

// The sushi art stops at nigiri-uni, so 2048 is the highest tile that can
// exist. A matching pair at the cap is eaten instead of promoted: both cells
// clear and the merge still pays 2x the tile value. Freeing two cells at the
// top end is what makes endless play possible.
export const CAP = 2048;
export const DIRECTIONS = ['up', 'down', 'left', 'right'];

export const MOVE_CHARS = { up: 'U', down: 'D', left: 'L', right: 'R' };
export const MOVE_CODES = { U: 'up', D: 'down', L: 'left', R: 'right' };

// Maps a slot along a line to a grid coordinate. Slot 0 is always the end
// tiles slide toward, so one slide routine covers all four directions.
function coord(dir, line, slot) {
    switch (dir) {
        case 'left':  return [line, slot];
        case 'right': return [line, SIZE - 1 - slot];
        case 'up':    return [slot, line];
        case 'down':  return [SIZE - 1 - slot, line];
    }
}

// Canonical 2048: tiles compact toward slot 0, each tile merges at most once
// per move, and a merge awards the resulting value. The one deviation is the
// cap (see CAP above). Exported for tests.
export function slide(line) {
    const values = line.filter(v => v !== 0);
    const result = [];
    // Slots where something combined, so the renderer can animate it rather
    // than trying to infer merges by diffing two boards.
    const merges = [];
    const vanishes = [];
    let points = 0;

    for (let i = 0; i < values.length; i++) {
        if (values[i] === values[i + 1]) {
            const merged = values[i] * 2;
            points += merged;
            // Below the cap the pair becomes one tile; at the cap it vanishes.
            if (values[i] < CAP) {
                merges.push(result.length);
                result.push(merged);
            } else {
                vanishes.push(result.length);
            }
            i++; // consume the partner so it cannot merge again this move
        } else {
            result.push(values[i]);
        }
    }

    while (result.length < SIZE) result.push(0);

    return {
        line: result,
        points,
        moved: result.some((v, i) => v !== line[i]),
        merges,
        vanishes
    };
}

export default class Engine {
    constructor(seed) {
        this.rand = mulberry32(seed);
        this.grid = Array.from({ length: SIZE }, () => new Array(SIZE).fill(0));
        this.score = 0;
        this.over = false;

        this.spawn();
        this.spawn();
    }

    // Fixed RNG contract: position first, then value. Changing the order or
    // the number of draws invalidates every stored replay, so it is pinned by
    // RULESET_VERSION.
    spawn() {
        const empty = [];
        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                if (this.grid[r][c] === 0) empty.push([r, c]);
            }
        }
        if (empty.length === 0) return null;

        const [row, col] = empty[Math.floor(this.rand() * empty.length)];
        const value = this.rand() > 0.15 ? 2 : 4;
        this.grid[row][col] = value;

        return { pos: [row, col], value };
    }

    move(dir) {
        if (this.over) return { moved: false, points: 0, spawned: null, gameOver: true, merges: [], vanishes: [] };
        if (!DIRECTIONS.includes(dir)) throw new Error(`unknown direction: ${dir}`);

        let moved = false;
        let points = 0;
        const merges = [];
        const vanishes = [];

        for (let line = 0; line < SIZE; line++) {
            const before = [];
            for (let slot = 0; slot < SIZE; slot++) {
                const [r, c] = coord(dir, line, slot);
                before.push(this.grid[r][c]);
            }

            const after = slide(before);
            points += after.points;

            if (after.moved) {
                moved = true;
                for (let slot = 0; slot < SIZE; slot++) {
                    const [r, c] = coord(dir, line, slot);
                    this.grid[r][c] = after.line[slot];
                }
            }

            for (const slot of after.merges) merges.push(coord(dir, line, slot));
            for (const slot of after.vanishes) vanishes.push(coord(dir, line, slot));
        }

        this.score += points;
        const spawned = moved ? this.spawn() : null;
        this.over = this.isGameOver();

        return { moved, points, spawned, gameOver: this.over, merges, vanishes };
    }

    isGameOver() {
        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                if (this.grid[r][c] === 0) return false;
                if (c + 1 < SIZE && this.grid[r][c] === this.grid[r][c + 1]) return false;
                if (r + 1 < SIZE && this.grid[r][c] === this.grid[r + 1][c]) return false;
            }
        }
        return true;
    }

    snapshot() {
        let maxTile = 0;
        for (const row of this.grid) {
            for (const value of row) if (value > maxTile) maxTile = value;
        }
        return {
            grid: this.grid.map(row => row.slice()),
            score: this.score,
            maxTile,
            over: this.over
        };
    }
}

// Replays an encoded move log against a seed. The Worker's only entry point:
// whatever this returns is the truth about a submitted game.
export function replay(seed, moves) {
    const engine = new Engine(seed);

    for (const char of moves) {
        const dir = MOVE_CODES[char];
        if (!dir) throw new Error(`unknown move code: ${char}`);
        engine.move(dir);
    }

    return engine;
}
