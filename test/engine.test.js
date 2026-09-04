import { describe, it, expect } from 'vitest';
import Engine, { slide, replay, SIZE, CAP, RULESETS, RULESET_VERSION } from '../public/source/engine.js';

// Builds an engine with a known grid and no tile spawning, so a move's
// effect on the board can be asserted exactly.
function staged(grid) {
    const engine = new Engine(1);
    engine.grid = grid.map(row => row.slice());
    engine.score = 0;
    engine.over = false;
    engine.spawn = () => null;
    return engine;
}

describe('slide', () => {
    it('does not let a tile merge twice in one move', () => {
        // The old engine chain-merged this into [8]: the two 2s became a 4,
        // then the existing 4 merged with that. Canonical 2048 gives [4,4].
        const { line, points } = slide([2, 2, 4, 0]);
        expect(line).toEqual([4, 4, 0, 0]);
        expect(points).toBe(4);
    });

    it('awards the post-merge value, not the absorbed tile', () => {
        expect(slide([2, 2, 0, 0]).points).toBe(4);
        expect(slide([64, 64, 0, 0]).points).toBe(128);
    });

    it('merges two independent pairs in one move', () => {
        const { line, points } = slide([2, 2, 2, 2]);
        expect(line).toEqual([4, 4, 0, 0]);
        expect(points).toBe(8);
    });

    it('merges across gaps', () => {
        expect(slide([2, 0, 0, 2]).line).toEqual([4, 0, 0, 0]);
    });

    it('compacts without merging when neighbours differ', () => {
        const { line, points, moved } = slide([0, 2, 0, 4]);
        expect(line).toEqual([2, 4, 0, 0]);
        expect(points).toBe(0);
        expect(moved).toBe(true);
    });

    it('reports no movement for an already-packed line', () => {
        expect(slide([2, 4, 2, 4]).moved).toBe(false);
        expect(slide([0, 0, 0, 0]).moved).toBe(false);
    });
});

describe('older rulesets', () => {
    // A game begun before a rules change is finished after it. The server has
    // to score it by the rules the player was actually playing, or an honest
    // run gets rejected — or worse, silently rescored.
    it('replays a run under the ruleset it was played under', () => {
        const seed = 20260904;
        const moves = 'LDRULDRULDRULDRU';

        const asPlayed = replay(seed, moves, 1);
        const asToday = replay(seed, moves, 2);

        expect(asPlayed.cap).toBe(2048);
        expect(asToday.cap).toBe(4096);
    });

    it('scores a capped pair by the old cap, not the new one', () => {
        // Under ruleset 1 a pair of 2048 vanished; under 2 it promotes. Both
        // pay 4096, but the board left behind differs, and everything after
        // it diverges.
        expect(slide([2048, 2048, 0, 0], RULESETS[1].cap).line).toEqual([0, 0, 0, 0]);
        expect(slide([2048, 2048, 0, 0], RULESETS[2].cap).line).toEqual([4096, 0, 0, 0]);
        expect(slide([1024, 1024, 0, 0], RULESETS[1].cap).line).toEqual([2048, 0, 0, 0]);
    });

    it('defaults to the current ruleset', () => {
        expect(new Engine(1).cap).toBe(RULESETS[RULESET_VERSION].cap);
        expect(replay(1, 'L').cap).toBe(CAP);
    });

    it('refuses a ruleset it has no rules for', () => {
        expect(() => replay(1, 'L', 99)).toThrow(/unknown ruleset/);
    });
});

describe('the cap', () => {
    it('makes a matching pair at the cap vanish', () => {
        const { line, points, moved } = slide([CAP, CAP, 0, 0]);
        expect(line).toEqual([0, 0, 0, 0]);
        expect(points).toBe(CAP * 2);
        expect(moved).toBe(true);
    });

    it('still promotes a pair just below the cap', () => {
        const below = CAP / 2;
        expect(slide([below, below, 0, 0]).line).toEqual([CAP, 0, 0, 0]);
        expect(slide([below, below, 0, 0]).points).toBe(CAP);
    });

    // The rungs the double-toro tile added. Under ruleset 1 a pair of 2048
    // vanished; now it promotes, and the vanish happens one rung higher.
    it('promotes the full sushi chain up to the cap', () => {
        expect(slide([1024, 1024, 0, 0]).line).toEqual([2048, 0, 0, 0]);
        expect(slide([2048, 2048, 0, 0]).line).toEqual([4096, 0, 0, 0]);
        expect(slide([2048, 2048, 0, 0]).points).toBe(4096);
    });

    it('pays 8192 for a vanishing pair of uni', () => {
        expect(slide([4096, 4096, 0, 0]).line).toEqual([0, 0, 0, 0]);
        expect(slide([4096, 4096, 0, 0]).points).toBe(8192);
    });

    it('lets surviving tiles compact into the freed space', () => {
        const { line, points } = slide([CAP, CAP, 2, 0]);
        expect(line).toEqual([2, 0, 0, 0]);
        expect(points).toBe(CAP * 2);
    });

    it('clears a whole line of capped tiles at once', () => {
        const { line, points } = slide([CAP, CAP, CAP, CAP]);
        expect(line).toEqual([0, 0, 0, 0]);
        expect(points).toBe(CAP * 4);
    });

    it('frees board space so play can continue', () => {
        const engine = staged([
            [CAP, CAP, 4, 8],
            [2, 4, 8, 16],
            [4, 8, 16, 32],
            [8, 16, 32, 64]
        ]);
        engine.move('left');

        const empties = engine.grid.flat().filter(v => v === 0).length;
        expect(empties).toBe(2);
        expect(engine.score).toBe(CAP * 2);
        expect(engine.over).toBe(false);
    });

    it('reports where a merge happened so it can be animated', () => {
        const engine = staged([
            [2, 2, 4, 4],
            [CAP, CAP, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ]);
        const result = engine.move('left');

        expect(result.merges).toEqual([[0, 0], [0, 1]]);
        expect(result.vanishes).toEqual([[1, 0]]);
        expect(result.points).toBe(4 + 8 + CAP * 2);
    });

    it('never produces a tile above the cap', () => {
        const engine = staged([
            [CAP, CAP, CAP, CAP],
            [CAP, CAP, CAP, CAP],
            [CAP, CAP, CAP, CAP],
            [CAP, CAP, CAP, CAP]
        ]);
        engine.move('left');
        expect(Math.max(...engine.grid.flat())).toBeLessThanOrEqual(CAP);
        expect(engine.snapshot().maxTile).toBe(0);
    });
});

describe('directions', () => {
    it('slides left toward column 0', () => {
        const engine = staged([
            [0, 0, 2, 2],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ]);
        engine.move('left');
        expect(engine.grid[0]).toEqual([4, 0, 0, 0]);
    });

    it('slides right toward the last column', () => {
        const engine = staged([
            [2, 2, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ]);
        engine.move('right');
        expect(engine.grid[0]).toEqual([0, 0, 0, 4]);
    });

    it('slides up toward row 0', () => {
        const engine = staged([
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [2, 0, 0, 0],
            [2, 0, 0, 0]
        ]);
        engine.move('up');
        expect(engine.grid.map(r => r[0])).toEqual([4, 0, 0, 0]);
    });

    it('slides down toward the last row', () => {
        const engine = staged([
            [2, 0, 0, 0],
            [2, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ]);
        engine.move('down');
        expect(engine.grid.map(r => r[0])).toEqual([0, 0, 0, 4]);
    });
});

describe('move', () => {
    it('spawns a tile only when something moved', () => {
        const engine = new Engine(7);
        const blocked = [
            [2, 4, 2, 4],
            [4, 2, 4, 2],
            [2, 4, 2, 4],
            [4, 2, 4, 2]
        ];
        engine.grid = blocked.map(r => r.slice());
        const result = engine.move('left');
        expect(result.moved).toBe(false);
        expect(result.spawned).toBe(null);
        expect(engine.grid).toEqual(blocked);
    });

    it('rejects an unknown direction', () => {
        expect(() => new Engine(1).move('sideways')).toThrow();
    });

    it('ignores moves once the game is over', () => {
        const engine = staged([
            [2, 4, 2, 4],
            [4, 2, 4, 2],
            [2, 4, 2, 4],
            [4, 2, 4, 2]
        ]);
        engine.move('left');
        expect(engine.over).toBe(true);

        const after = engine.move('up');
        expect(after.moved).toBe(false);
        expect(after.gameOver).toBe(true);
    });
});

describe('isGameOver', () => {
    it('is false while an empty cell remains', () => {
        expect(new Engine(3).isGameOver()).toBe(false);
    });

    it('is false on a full board that still has a merge', () => {
        const engine = staged([
            [2, 2, 4, 8],
            [4, 8, 16, 32],
            [8, 16, 32, 64],
            [16, 32, 64, 128]
        ]);
        expect(engine.isGameOver()).toBe(false);
    });

    it('is true on a full board with no adjacent equals', () => {
        const engine = staged([
            [2, 4, 2, 4],
            [4, 2, 4, 2],
            [2, 4, 2, 4],
            [4, 2, 4, 2]
        ]);
        expect(engine.isGameOver()).toBe(true);
    });
});

describe('starting position', () => {
    it('opens with exactly two tiles, each a 2 or a 4', () => {
        for (const seed of [1, 99, 12345, 2 ** 31]) {
            const values = new Engine(seed).grid.flat().filter(v => v !== 0);
            expect(values).toHaveLength(2);
            for (const v of values) expect([2, 4]).toContain(v);
        }
    });
});

describe('snapshot', () => {
    it('reports the largest tile and copies the grid defensively', () => {
        const engine = staged([
            [1024, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ]);
        const snap = engine.snapshot();
        expect(snap.maxTile).toBe(1024);

        snap.grid[0][0] = 99999;
        expect(engine.grid[0][0]).toBe(1024);
    });
});
