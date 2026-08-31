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
| `POST` | `/session/:id/submit` | optional | Replay a move log and record the derived score. Anonymous posts supply a name; a session cookie overrides it. |
| `GET` | `/scores?limit=100` | none | Each player's personal best, highest first. |
| `GET` | `/auth/google/start` | none | Begin Google OAuth. |
| `GET` | `/auth/google/callback` | none | Finish OAuth, set the session cookie, redirect home. |
| `POST` | `/auth/logout` | none | Clear the session cookie. |

## Deployed at

<https://sushi48-leaderboard.ryan-mapa.workers.dev>

The D1 database and `JWT_SECRET` / `IP_SALT` are already provisioned, and the
database id is in `wrangler.toml`. Day to day you only need:

```sh
npm run deploy
```

## Google sign-in

Sign-in is optional. Without it players still post scores anonymously by
typing a name; signing in only makes that name owned and adds a verified tick.

**1. Create an OAuth client** at
<https://console.cloud.google.com/auth/clients> (Web application):

- Authorized redirect URI:
  `https://sushi48-leaderboard.ryan-mapa.workers.dev/auth/google/callback`

The redirect URI must match exactly — a trailing slash or `http` instead of
`https` fails with a redirect_uri mismatch.

**2. Set the two secrets.** They take effect immediately, no redeploy:

```sh
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
```

**3. Add test users** at <https://console.cloud.google.com/auth/audience>.

This project stays on Google's **Testing** publishing status, so only accounts
listed there can sign in — up to 100. Publishing to production requires an
authorized domain you can prove you own, and `workers.dev` belongs to
Cloudflare, so that is not possible without buying a domain. Anonymous posting
is unaffected, which is why sign-in was made optional.

Testing mode expires Google *refresh* tokens after 7 days. That does not
matter here: the code is exchanged once at sign-in and the session runs on
this Worker's own 30-day cookie thereafter.

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

**3. Create the Google OAuth client** as above, using that URL.

**4. Set all four secrets** (never put these in `wrangler.toml`):

```sh
openssl rand -base64 48 | npx wrangler secret put JWT_SECRET
openssl rand -base64 32 | npx wrangler secret put IP_SALT
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
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

OAuth will not complete locally without a Google OAuth client whose redirect
URI points at localhost. To exercise the submit path, mint an HS256 JWT with the same
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
- a name is present: either from the session cookie, or 1-20 characters
  supplied in the request body

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
