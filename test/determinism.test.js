import { describe, it, expect } from 'vitest';
import Engine, { replay, MOVE_CHARS, MOVE_CODES, RULESET_VERSION } from '../public/source/engine.js';
import mulberry32 from '../public/source/rng.js';

// Plays a full game with a fixed, non-random move policy and returns the
// encoded log — a stand-in for what a browser would submit.
function playToEnd(seed, cap = 5000) {
    const engine = new Engine(seed);
    const cycle = ['up', 'right', 'down', 'left'];
    const moves = [];

    for (let i = 0; i < cap && !engine.over; i++) {
        const dir = cycle[i % cycle.length];
        engine.move(dir);
        moves.push(MOVE_CHARS[dir]);
    }

    return { engine, moves: moves.join('') };
}

describe('replay determinism', () => {
    it('produces an identical game from the same seed and log', () => {
        const a = replay(20260830, 'ULDRULDRRRUULLDD');
        const b = replay(20260830, 'ULDRULDRRRUULLDD');

        expect(a.score).toBe(b.score);
        expect(a.grid).toEqual(b.grid);
        expect(a.over).toBe(b.over);
    });

    it('matches a game played move by move', () => {
        const { engine, moves } = playToEnd(4242);
        const replayed = replay(4242, moves);

        expect(replayed.score).toBe(engine.score);
        expect(replayed.grid).toEqual(engine.grid);
        expect(replayed.over).toBe(engine.over);
    });

    it('reaches a real game-over that survives replay', () => {
        const { engine, moves } = playToEnd(31337);

        expect(engine.over).toBe(true);
        expect(engine.score).toBeGreaterThan(0);
        expect(replay(31337, moves).over).toBe(true);
    });

    it('diverges when the seed differs', () => {
        const moves = 'ULDRULDRULDRULDR';
        expect(replay(1, moves).grid).not.toEqual(replay(2, moves).grid);
    });

    it('diverges when the log is tampered with', () => {
        const { moves } = playToEnd(555);
        const tampered = 'D' + moves.slice(1);
        expect(replay(555, tampered).score).not.toBe(replay(555, moves).score);
    });

    it('rejects an unknown move code', () => {
        expect(() => replay(1, 'ULXR')).toThrow(/unknown move code/);
    });
});

describe('rng', () => {
    it('emits the same stream for the same seed', () => {
        const a = mulberry32(99);
        const b = mulberry32(99);
        for (let i = 0; i < 100; i++) expect(a()).toBe(b());
    });

    it('stays within [0, 1)', () => {
        const rand = mulberry32(7);
        for (let i = 0; i < 1000; i++) {
            const v = rand();
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThan(1);
        }
    });
});

describe('engine purity', () => {
    it('runs with no DOM present', () => {
        // The Worker has no document; if the engine ever imports DOM code
        // again, this file stops loading at all.
        expect(globalThis.document).toBeUndefined();
        expect(() => playToEnd(11)).not.toThrow();
    });

    it('encodes moves reversibly', () => {
        for (const [dir, char] of Object.entries(MOVE_CHARS)) {
            expect(MOVE_CODES[char]).toBe(dir);
        }
    });

    it('pins a ruleset version for stored replays', () => {
        // Bumped to 2 when the double-toro tile moved the cap from 2048 to
        // 4096. Any change to merge rules or RNG order must bump this, or the
        // Worker will replay old logs under rules they were not played under.
        expect(RULESET_VERSION).toBe(2);
    });
});
