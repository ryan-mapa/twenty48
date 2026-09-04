import { SIZE } from './engine.js';

// Sushi art tops out at nigiri-uni (4096), and the engine caps tiles there —
// a matching pair at the cap vanishes rather than promoting. The tile-high
// fallback below is therefore unreachable in normal play; it exists so that
// raising the cap can never silently render blank plates.
const TILE_CLASSES = {
    2: 'two',
    4: 'four',
    8: 'eight',
    16: 'sixteen',
    32: 'thirty-two',
    64: 'sixty-four',
    128: 'one-twenty-eight',
    256: 'two-fifty-six',
    512: 'five-twelve',
    1024: 'ten-twenty-four',
    2048: 'twenty-forty-eight',
    4096: 'forty-ninety-six'
};

const TOP_CLASS = TILE_CLASSES[4096];

// Owns every DOM node for the board. Takes an Engine snapshot and makes the
// screen match it; holds no game state of its own.
export default class Renderer {
    constructor(rootEl, scoreEl) {
        this.scoreEl = scoreEl;
        this.tiles = [];

        const container = document.createElement('div');
        container.classList.add('game-container');

        for (let r = 0; r < SIZE; r++) {
            const row = [];
            for (let c = 0; c < SIZE; c++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.setAttribute('data-pos', `${r},${c}`);

                const tile = document.createElement('div');
                tile.classList.add('tile');
                tile.hidden = true;

                cell.appendChild(tile);
                container.appendChild(cell);
                row.push(tile);
            }
            this.tiles.push(row);
        }

        rootEl.appendChild(container);
        this.el = container;
        this.canAnimate = typeof this.tiles[0][0].animate === 'function';
    }

    render({ grid, score }, effects = {}) {
        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                const value = grid[r][c];
                const tile = this.tiles[r][c];

                if (value === 0) {
                    tile.hidden = true;
                    tile.className = 'tile';
                    tile.textContent = '';
                    continue;
                }

                const named = TILE_CLASSES[value];
                tile.hidden = false;
                tile.className = named ? `tile ${named}` : `tile ${TOP_CLASS} tile-high`;
                tile.textContent = named ? '' : String(value);
            }
        }

        this.scoreEl.textContent = String(score);
        this.animate(effects);
    }

    // Motion is driven by what the engine reported, not by diffing boards.
    // Guarded because the Web Animations API is absent in test DOMs, and a
    // missing animation must never stop the board from updating.
    animate({ merges = [], vanishes = [], spawned = null }) {
        if (!this.canAnimate) return;

        for (const [r, c] of merges) {
            this.tiles[r][c].animate(
                [{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(1)' }],
                { duration: 180, easing: 'ease-out' }
            );
        }

        if (spawned) {
            const [r, c] = spawned.pos;
            this.tiles[r][c].animate(
                [{ transform: 'scale(0.4)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }],
                { duration: 160, easing: 'ease-out' }
            );
        }

        // A capped pair leaves no tile behind, so the puff of smoke is a
        // throwaway element layered over whatever slid into its place.
        for (const [r, c] of vanishes) {
            const puff = document.createElement('div');
            puff.className = `tile ${TOP_CLASS} poof`;
            this.tiles[r][c].parentElement.appendChild(puff);

            const animation = puff.animate(
                [
                    { transform: 'scale(1)', opacity: 0.95 },
                    { transform: 'scale(1.7)', opacity: 0 }
                ],
                { duration: 340, easing: 'ease-out' }
            );
            animation.finished.then(() => puff.remove(), () => puff.remove());
        }
    }
}
