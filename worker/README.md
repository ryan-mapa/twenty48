# Leaderboard Worker

Cloudflare Worker + D1. Serves the game itself from `../public` **and** runs
the leaderboard API, so the whole app is one deploy on one origin.

It imports `../public/source/engine.js`, so the rules it enforces when
verifying a run are byte-identical to the ones the browser played under.

## Endpoints

Any request matching a file in `../public` is served as a static asset. These
routes handle everything else:

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/me` | cookie | Whether this browser is signed in, and as whom. |
| `POST` | `/session` | none | Mint a seed. Rate limited per IP. |
| `POST` | `/session/:id/submit` | cookie | Replay a move log and record the derived score. |
| `GET` | `/scores?limit=100` | none | Each player's personal best, highest first. |
| `GET` | `/auth/github/start` | none | Begin GitHub OAuth. |
| `GET` | `/auth/github/callback` | none | Finish OAuth, set the session cookie, redirect home. |
| `POST` | `/auth/logout` | none | Clear the session cookie. |

## Deployed at

<https://sushi48-leaderboard.ryan-mapa.workers.dev>

The D1 database and `JWT_SECRET` / `IP_SALT` are already provisioned, and the
database id is in `wrangler.toml`. Day to day you only need:

```sh
npm run deploy
```

## Setting up GitHub sign-in

Until this is done the game is fully playable but nobody can post a score.

**1. Register an OAuth app** at <https://github.com/settings/developers>:

- Homepage URL: `https://sushi48-leaderboard.ryan-mapa.workers.dev`
- Callback URL: `https://sushi48-leaderboard.ryan-mapa.workers.dev/auth/github/callback`

The callback must match exactly — a trailing slash or `http` instead of
`https` will fail.

**2. Set the two secrets.** They take effect immediately, no redeploy:

```sh
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
```

## Provisioning from scratch

Only needed to rebuild this in a different Cloudflare account.

**1. Create the database** and paste the id it prints into `wrangler.toml`:

```sh
npx wrangler d1 create sushi48
npm run schema:remote
```

**2. Deploy once** to find out the Worker's URL:

```sh
npm run deploy
```

**3. Register the GitHub OAuth app** as above, using that URL.

**4. Set all four secrets** (never put these in `wrangler.toml`):

```sh
openssl rand -base64 48 | npx wrangler secret put JWT_SECRET
openssl rand -base64 32 | npx wrangler secret put IP_SALT
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
```

That is the whole deployment. There is no separate static host and no URL to
configure in the client — the game calls its own origin.

## Local development

`.dev.vars` holds local values for the four secrets and is gitignored.
**wrangler only reads it at startup**, so restart after editing it.

```sh
npm run schema:local
npm run dev          # game + API on http://localhost:8787
```

OAuth will not complete locally without a real GitHub app pointed at
localhost. To exercise the submit path, mint an HS256 JWT with the same
`JWT_SECRET` (payload `{ sub, name }`), insert a matching row into `users`,
and send it as a `sushi48_session` cookie.

The local and remote databases are entirely separate — `schema:local` and
`schema:remote` touch different stores, and local scores never leave your
machine.

## What a submission must satisfy

Rejected unless all of these hold:

- the session exists, has not been submitted, and is under 6h old
- it was minted under the current `RULESET_VERSION`
- `timings` is non-decreasing and the same length as `moves`
- the run took at least 200ms per move (the client debounce is 250ms)
- the move log replays cleanly and ends in a real game-over
- the caller presents a valid session cookie

The score written is always the one this Worker computed. Any `score` field in
the request body is ignored.

## Operational notes

- Deploys are manual. Nothing in this repository triggers one; the live site
  is whatever `wrangler deploy` last uploaded.
- An hourly cron sweeps sessions that were minted but never submitted. Most
  sessions are abandoned, so without it the table grows without bound.
- Sessions are minted anonymously (players sign in only to post), so the only
  thing limiting bulk minting is the per-IP hourly cap in `src/index.js`.
- The session cookie is `HttpOnly; Secure; SameSite=Lax`. Lax rather than
  Strict because the browser arrives back from GitHub via a top-level
  redirect, which Strict would withhold the cookie on.
- Attaching a custom domain later needs no code change — the client only ever
  calls its own origin.
