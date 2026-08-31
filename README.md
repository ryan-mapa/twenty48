# SUSHI48

A sushi-themed 2048 with a leaderboard you cannot cheat by editing a variable
in the console.

**▶ Play: https://sushi48-leaderboard.ryan-mapa.workers.dev**

Arrow keys on desktop, swipe on mobile. Art by
[Robyn Hwang](https://www.robynhwang.com/).

## Why the leaderboard is trustworthy

The obvious way to build this is to let the browser report a score. That is
worthless — anyone can open devtools and post whatever number they like.

Instead, **the server never accepts a score.** It derives one:

1. **A game starts.** The client asks for a session; the Worker generates a
   random seed, stores it, and returns it.
2. **The game is played.** Every random decision — where a tile spawns, and
   whether it is a 2 or a 4 — comes from a PRNG seeded with that value.
   `Math.random()` appears nowhere in engine code.
3. **Moves are recorded.** The client keeps a log of every direction it
   processed, with timings.
4. **The run is submitted.** The Worker loads the seed, replays the log
   through the same `engine.js` the browser ran, and writes the score *it*
   computed. Any score in the request body is ignored.

To post a fake score you would have to submit a move sequence that genuinely
earns it — which is just playing the game.

**This does not stop bots.** 2048 is easy to play well automatically, and a
decent bot would top this board honestly. Per-move timings are recorded so
behavioural analysis is possible later, but nothing detects it today.

## Rules

Canonical 2048 — a merge awards the combined value, and a tile merges at most
once per move — with one deviation.

The sushi art stops at nigiri-uni, so **2048 is the highest tile**. Rather than
letting the board clog with un-mergeable tiles, a matching pair at the cap
**vanishes**, clearing both cells and paying 4096. Play can continue
indefinitely.

Rules are pinned by `RULESET_VERSION` in `public/source/engine.js`. Changing
merge behaviour, the tile cap, or the order the PRNG is consumed invalidates
every stored replay — bump the version when that happens, or the leaderboard
becomes meaningless.

## Architecture

One Cloudflare Worker serves everything. Requests matching a file in `public/`
are served as static assets; everything else falls through to the API. One
origin means no CORS, and auth can use an HttpOnly cookie that page scripts
cannot read.

```
browser ──▶ Worker ──┬─ path matches public/* → static asset
                     └─ otherwise             → API ──▶ D1
                                                         users
       imports public/source/engine.js ───────┘          sessions
       (the same file the browser plays)                 scores
```

Sharing one rules file between client and server is the whole reason this runs
on Workers: the verifier and the game cannot drift apart.

There is no build step. `public/source/` is plain ES modules loaded directly by
the browser.

| Path | What it is |
|---|---|
| `public/` | Everything served to browsers. Nothing outside it is reachable. |
| `public/index.html` | The page |
| `public/2048.js` | Composition root; wires game, leaderboard and overlay together |
| `public/source/engine.js` | **Pure game rules.** No DOM, no clock. Runs in browser *and* Worker |
| `public/source/rng.js` | Seeded PRNG (mulberry32) — the only randomness in the system |
| `public/source/game.js` | Input handling, move recording, 250 ms debounce |
| `public/source/renderer.js` | Owns all board DOM and the merge/spawn animations |
| `public/source/api.js` | Same-origin API calls, pending-run buffer |
| `public/source/leaderboard.js` | Score table rendering |
| `public/source/overlay.js` | Game-over dialog |
| `worker/src/index.js` | Routing, validation, replay, D1, OAuth, cleanup cron |
| `worker/src/auth.js` | JWT sign/verify and salted IP hashing (Web Crypto, no deps) |
| `test/` | Engine rules, replay determinism, DOM rendering |

Full API reference and operational notes: [worker/README.md](worker/README.md).

## Development

```sh
npm install
npm --prefix worker install
npm --prefix worker run schema:local   # first time only
npm run dev                            # game + API on http://localhost:8787
```

`npm run dev` runs `wrangler dev`, serving `public/` and the API together
exactly as production does. Sign-in will not work locally without a real
GitHub OAuth app; everything else does.

```sh
npm test        # 46 tests
npm run watch   # re-run on change
```

The tests worth knowing about:

- `test/engine.test.js` — merge rules, including the `[2,2,4] → [4,4]`
  regression guarding against chain-merging, and the cap-vanish behaviour.
- `test/determinism.test.js` — the load-bearing one. A seed plus a move log
  must produce a byte-identical game every time, or replay verification is
  worthless.
- `test/render.test.js` — DOM rendering and input handling under happy-dom.

## Deploying

```sh
cd worker && npm run deploy
```

That uploads the Worker and everything in `public/` in one shot.

**Deploys are manual.** Cloudflare has no connection to this repository —
merging a PR does not ship anything, and the live site is whatever
`wrangler deploy` last uploaded. See [worker/README.md](worker/README.md) for
first-time setup, secrets, and the D1 schema.
