# twenty48

Sushi-themed 2048 with a replay-verified leaderboard, hosted entirely on
Cloudflare.

## How it works

One Cloudflare Worker serves both the game and the API. Static files live in
`public/` and are served first; anything matching no file falls through to the
API routes. There is no build step — `public/source/` is plain ES modules that
`index.html` loads directly.

Because it is all one origin, there is no CORS anywhere and auth uses an
HttpOnly cookie rather than a token in page-readable storage.

The interesting part is that **the server never accepts a score**:

1. When a game starts, the client asks for a session. The Worker generates a
   random seed, stores it, and returns it.
2. All randomness in the game — tile spawn position and value — comes from a
   PRNG seeded with that value. No `Math.random()` appears in engine code.
3. The client records every move it makes.
4. At game over, the client submits the move log. The Worker replays it
   against the stored seed using **the same `engine.js` the browser ran**, and
   writes the score it derived itself.

Posting a fake score therefore means submitting a move sequence that genuinely
earns it. The client's own score is never read.

This does not stop bots — 2048 is easy to play well automatically. Per-move
timings are recorded so behavioural analysis is possible later, but none ships
today.

## Rules

Canonical 2048 (a merge awards the combined value; a tile merges at most once
per move), with one deviation: the sushi art stops at nigiri-uni, so **2048 is
the highest tile**. A matching pair at the cap vanishes, clearing both cells
and paying 4096. That keeps the board from filling with un-mergeable tiles and
makes endless play possible.

Rules are pinned by `RULESET_VERSION` in `public/source/engine.js`. Changing
merge behaviour or the order the PRNG is consumed invalidates every stored
replay — bump the version when that happens.

## Layout

| Path | What it is |
|---|---|
| `public/` | Everything served to browsers. Nothing outside it is reachable. |
| `public/2048.js` | Entry point; wires game, leaderboard and overlay together |
| `public/source/engine.js` | Pure game rules. No DOM. Runs in both the browser and the Worker |
| `public/source/rng.js` | Seeded PRNG (mulberry32) |
| `public/source/renderer.js` | Owns all board DOM and the merge/spawn animations |
| `public/source/game.js` | Input handling, move recording, debounce |
| `public/source/api.js` | Same-origin API calls and the pending-run buffer |
| `worker/` | The Worker, D1 schema and deploy config ([setup](worker/README.md)) |
| `test/` | Engine, determinism and DOM tests |

## Development

```sh
npm install
npm test        # 46 tests: engine rules, replay determinism, DOM rendering
npm run dev     # game + API on http://localhost:8787
```

`npm run dev` runs `wrangler dev`, which serves `public/` and the API together,
exactly as production does. See [worker/README.md](worker/README.md) for local
database setup and the caveat about OAuth locally.

## Deploying

Everything ships in one `wrangler deploy` — see
[worker/README.md](worker/README.md).
