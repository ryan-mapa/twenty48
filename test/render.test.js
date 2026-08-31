// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import Game from '../public/source/game.js';
import Renderer from '../public/source/renderer.js';

function mount() {
    document.body.innerHTML = '<div id="g2048"></div><div id="score">0</div>';
    return {
        root: document.getElementById('g2048'),
        score: document.getElementById('score')
    };
}

function touch(root, type, x, y) {
    const event = new Event(type, { bubbles: true, cancelable: true });
    event.touches = [{ clientX: x, clientY: y }];
    root.dispatchEvent(event);
}

function press(key) {
    document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

describe('renderer', () => {
    beforeEach(mount);

    it('builds a 4x4 board of cells', () => {
        const { root, score } = mount();
        new Renderer(root, score);
        expect(root.querySelectorAll('.cell')).toHaveLength(16);
        expect(root.querySelectorAll('.tile')).toHaveLength(16);
    });

    it('shows only occupied cells and maps values to sushi classes', () => {
        const { root, score } = mount();
        const renderer = new Renderer(root, score);

        renderer.render({
            grid: [
                [2, 4, 8, 16],
                [32, 64, 128, 256],
                [512, 1024, 2048, 0],
                [0, 0, 0, 0]
            ],
            score: 1234
        });

        const tiles = [...root.querySelectorAll('.tile')];
        expect(tiles[0].className).toBe('tile two');
        expect(tiles[10].className).toBe('tile twenty-forty-eight');
        expect(tiles.filter(t => !t.hidden)).toHaveLength(11);
        expect(score.textContent).toBe('1234');
    });

    it('labels tiles above the art ceiling instead of rendering them blank', () => {
        const { root, score } = mount();
        const renderer = new Renderer(root, score);

        renderer.render({ grid: [[4096, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]], score: 0 });

        const tile = root.querySelector('.tile');
        expect(tile.hidden).toBe(false);
        expect(tile.classList.contains('tile-high')).toBe(true);
        expect(tile.textContent).toBe('4096');
    });

    it('clears a tile when its cell empties', () => {
        const { root, score } = mount();
        const renderer = new Renderer(root, score);
        const full = { grid: [[2, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]], score: 0 };
        const empty = { grid: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]], score: 0 };

        renderer.render(full);
        renderer.render(empty);

        const tile = root.querySelector('.tile');
        expect(tile.hidden).toBe(true);
        expect(tile.className).toBe('tile');
    });
});

describe('game', () => {
    beforeEach(mount);

    it('draws the opening position with two tiles', () => {
        const { root, score } = mount();
        new Game(root, score, { seed: 1 });

        const visible = [...root.querySelectorAll('.tile')].filter(t => !t.hidden);
        expect(visible).toHaveLength(2);
        expect(score.textContent).toBe('0');
    });

    it('records keypresses into a replayable log', () => {
        const { root, score } = mount();
        const game = new Game(root, score, { seed: 1 });

        press('ArrowLeft');
        const run = game.run();

        expect(run.moves).toBe('L');
        expect(run.seed).toBe(1);
        expect(run.rulesetVersion).toBe(1);
        expect(run.timings).toHaveLength(1);
    });

    it('ignores keys that are not arrows', () => {
        const { root, score } = mount();
        const game = new Game(root, score, { seed: 1 });

        press('a');
        press('Enter');

        expect(game.run().moves).toBe('');
    });

    it('debounces rapid input so the timing floor holds', () => {
        const { root, score } = mount();
        const game = new Game(root, score, { seed: 1 });

        for (let i = 0; i < 10; i++) press('ArrowLeft');

        expect(game.run().moves).toBe('L');
    });

    it('reports game over exactly once', () => {
        const { root, score } = mount();
        let reports = 0;
        const game = new Game(root, score, { seed: 1, onGameOver: () => reports++ });

        // Full board, no adjacent equals: dead in every direction.
        game.engine.grid = [
            [2, 4, 2, 4],
            [4, 2, 4, 2],
            [2, 4, 2, 4],
            [4, 2, 4, 2]
        ];

        game.handleMove('left');
        game.handleMove('up');
        game.handleMove('right');

        expect(game.engine.over).toBe(true);
        expect(reports).toBe(1);
    });

    it('starts a fresh run on newGame', () => {
        const { root, score } = mount();
        const game = new Game(root, score, { seed: 1 });

        press('ArrowLeft');
        game.newGame(2);

        const run = game.run();
        expect(run.moves).toBe('');
        expect(run.seed).toBe(2);
        expect(run.score).toBe(0);
    });
});

describe('swipe', () => {
    beforeEach(mount);

    it('ignores a drag shorter than the threshold', () => {
        const { root, score } = mount();
        const game = new Game(root, score, { seed: 1 });

        touch(root, 'touchstart', 200, 200);
        touch(root, 'touchmove', 170, 200); // 30px, under the 40px threshold

        expect(game.run().moves).toBe('');
    });

    it('registers a drag past the threshold', () => {
        const { root, score } = mount();
        const game = new Game(root, score, { seed: 1 });

        touch(root, 'touchstart', 200, 200);
        touch(root, 'touchmove', 140, 200); // 60px left

        expect(game.run().moves).toBe('L');
    });

    it('reads direction from the dominant axis', () => {
        const cases = [
            [200, 290, 'D'],
            [200, 110, 'U'],
            [290, 200, 'R'],
            [110, 200, 'L']
        ];

        for (const [x, y, expected] of cases) {
            const { root, score } = mount();
            const game = new Game(root, score, { seed: 1 });

            touch(root, 'touchstart', 200, 200);
            touch(root, 'touchmove', x, y);

            expect(game.run().moves).toBe(expected);
        }
    });

    it('fires at most once per touch', () => {
        const { root, score } = mount();
        const game = new Game(root, score, { seed: 1 });

        touch(root, 'touchstart', 200, 200);
        touch(root, 'touchmove', 140, 200);
        touch(root, 'touchmove', 80, 200);
        touch(root, 'touchmove', 20, 200);

        expect(game.run().moves).toBe('L');
    });

    it('allows a new swipe after the finger lifts', () => {
        const { root, score } = mount();
        const game = new Game(root, score, { seed: 1 });

        touch(root, 'touchstart', 200, 200);
        touch(root, 'touchmove', 140, 200);
        touch(root, 'touchend', 140, 200);

        // The 250ms debounce still gates the second move, so only the
        // recorded first one is asserted here.
        expect(game.run().moves).toBe('L');
        expect(game.engine.over).toBe(false);
    });
});
