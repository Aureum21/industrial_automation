# AutomationHub: engineering handover

Live site: https://www.industrialautomation.website · Repository: https://github.com/Aureum21/industrial_automation · Author: alex_eng_aut

## What it is

A browser-based place to learn industrial control logic by building it:

- **Challenges** (`/challenges`): auto-graded exercises. The learner wires logic between fixed inputs and outputs, presses Check, and timed test scenarios report exactly what fails.
- **Logic Lab** (`/lab`): function-block editor with a deterministic scan-cycle simulator, HMI builder, logic analyzer, shareable links and Arduino export.
- **Masterclasses** (`/blogs`, `/post/[slug]`): long-form articles with embedded live labs. 11 built-in, plus community articles from the Studio (`/write`).

## Architecture

See the README for the directory map. The important boundaries:

| Layer | Where | Rules |
| --- | --- | --- |
| Simulator | `src/lib/LogicEngine.ts`, `src/lib/automation/` | Pure TypeScript, no React. Deterministic: same circuit + inputs = same outputs. Editing previews outputs but never changes block memory; only `tick()` does. |
| Arduino export | `src/lib/codegen/arduinoGenerator.ts` | Must behave scan-for-scan like the engine. Guarded by `tests/arduino_parity.test.ts`, which compiles sketches with g++ and compares every signal. Unsupported blocks emit `#error`. |
| Challenges | `src/lib/challenges/` | Content in `catalog.ts`, grader in `grader.ts`. Reference solutions live only in `tests/challenges.test.ts`. |
| Server | `src/server/` (server-only) | DB access, migrations, sessions, business rules. API routes in `src/app/api/` stay thin. |
| Shared | `src/shared/` | Types, permissions, zod validation, URL safety. Used by both sides; the server always re-checks. |
| Client API | `src/lib/api/client.ts` | The only place the browser calls the API. |

## Data and auth

- Neon Postgres via `@neondatabase/serverless`. Migrations in `src/server/db/migrations.ts` run on first request and are recorded in `schema_migrations`. Append only.
- Tables: `users` (with `is_owner`), `sessions` (SHA-256 of the cookie token), `articles` (document JSON in `content_json`, `author_id`), `article_views`.
- Session cookie `ah_session`: HttpOnly, SameSite=Lax, 30 days.
- Owner account: username `alex_eng_aut`. The owner may edit every article including the built-in masterclasses; everyone else edits only their own. Non-owners always publish under their username.
- Without `DATABASE_URL` the site runs read-only (simulator, built-in articles, challenges).

## Quality gates

```sh
npm test            # unit + parity + challenge tests (needs g++ for parity; skipped otherwise)
npm run typecheck
npm run lint        # must have 0 errors
npm run build
npm run smoke:api   # end-to-end API checks against a local DB (scripts/smoke-fixtures.sh)
```

## Known gaps and next steps

- Challenge progress is stored per browser; sync it to accounts.
- Ladder-diagram view of the same engine (most job ads ask for ladder).
- Web Serial "hardware in the loop" for the Arduino export.
- Not yet exportable to Arduino: RANDOM, stairway/multifunction switches, calendar timers, frequency trigger, message/softkey blocks, and simulation-only plant models (DC motor, servo, kinematics).
- No rate limiting on sign-in/sign-up yet; add before promoting the Studio widely.
- Several masterclasses present incident stories without sources; verify or label them as illustrative.
- `/journal` pages still use the old dark theme and are not linked from navigation.

## Overnight build (Nov 21, 2026)

Shipped to `main`, each with tests, typecheck, lint, build, the API smoke test (71 checks) and browser E2E:

- **Block guides** `/library/<block>`: 74 pages, each with an explanation, the pins, the settings, a live demo, Arduino support and related challenges. Also `sitemap.xml` and `robots.txt`.
- **Embeddable widget** `/embed#c=...`: the share dialog now gives iframe code. Every other page refuses framing.
- **Ladder view**: a Ladder tab in the lab, generated from the function blocks with live power flow.
- **Progress sync**: `challenge_progress` table (migration 006). Local progress is merged into the account on sign-in.
- **Community gallery** `/gallery`: publishing, open-a-copy (forks), and deletion by the author or the owner (migration 007).

Not verified: the live site after the last push. The production URL was unreachable from the build environment. Open `/api/health`, `/gallery` and `/library/ton` to confirm.

### Monetization (recommendation, nothing built)
1. Get traffic first. Submit the sitemap in Google Search Console. The block guides and challenges are the SEO entry points.
2. Run free for 1–2 months and measure. Add Vercel Analytics: in the Vercel dashboard turn on Analytics, then add `@vercel/analytics`.
3. Then a "Pro" tier (about $5–8/month or $49/year): unlimited private saved circuits, certificate of completion for the challenge track, advanced challenges, Arduino export of more blocks. Keep the lab, the basic challenges and the gallery free. Building this needs your Stripe account.
4. Later: B2B licences for schools and training centres (classroom progress dashboard), which pays more than individual subscriptions.
