# Running SparkyFitness locally

A guide to getting this branch (`claude/happy-goodall-5V3L9`, which adds the
Peptide Tracking feature) up and running on your machine.

> **Port note:** the project defaults the web frontend to **8080**, but that
> port is already used locally by **Sabnzbd**. These instructions use **8088**
> for the frontend instead. Backend stays on `3010` and Postgres on `5432` —
> change those too if they collide with anything on your box.

## 1. Get the branch

```bash
git clone https://github.com/wdeezy/SparkyFitness.git
cd SparkyFitness
git checkout claude/happy-goodall-5V3L9
# In an existing clone instead:
#   git fetch origin claude/happy-goodall-5V3L9 && git checkout claude/happy-goodall-5V3L9
```

## 2. Create the `.env` (both paths need it)

The server reads `.env` at the **repo root**. Start from the tracked template:

```bash
cp docker/.env.example .env
```

Then edit at minimum these (the placeholder values will not boot):

```bash
SPARKY_FITNESS_API_ENCRYPTION_KEY=<64 hex chars>   # openssl rand -hex 32
JWT_SECRET=<64 hex chars>                           # openssl rand -hex 32
BETTER_AUTH_SECRET=<strong secret>                  # openssl rand -base64 32

# Point this at where YOU open the app. We use 8088 because 8080 = Sabnzbd.
SPARKY_FITNESS_FRONTEND_URL=http://localhost:8088
```

Leave the `SPARKY_FITNESS_DB_*` values as-is if you use the Docker path below —
they match the compose defaults.

---

## Option A — Docker (simplest, recommended)

Brings up Postgres + backend + frontend together with live reload.

### Remap the frontend port off 8080

Edit `docker/docker-compose.dev.yml` and change the frontend port mapping so the
**host** side is 8088 (leave the container side at 8080):

```yaml
  sparkyfitness-frontend:
    ...
    ports:
      - "8088:8080" # host 8088 -> vite 8080 (8080 is taken by Sabnzbd)
```

The format is `HOST:CONTAINER` — only the left number changes; Vite keeps
listening on 8080 inside the container.

### Start it

```bash
./docker/docker-helper.sh dev up
```

Open **http://localhost:8088**. Backend is on `:3010`, Postgres on `:5432`.

Useful follow-ups:

```bash
./docker/docker-helper.sh dev logs    # tail logs
./docker/docker-helper.sh dev down    # stop
./docker/docker-helper.sh dev build   # rebuild after dependency changes
```

---

## Option B — Run on host (DB in Docker, app via pnpm)

Good for fast HMR / attaching a debugger. Requires **Node 22** and **pnpm 10**
(`corepack enable`).

```bash
# 1. Postgres only
docker compose -f docker/docker-compose.db_dev.yml up -d

# 2. Install workspace deps (from repo root)
pnpm install

# 3. Backend (terminal 1)
cd SparkyFitnessServer && pnpm start        # http://localhost:3010

# 4. Frontend (terminal 2) — override Vite's default 8080 to 8088
cd SparkyFitnessFrontend && pnpm dev -- --port 8088
```

Open **http://localhost:8088**. The Vite dev server proxies `/api`,
`/health-data`, and `/uploads` to the backend on `:3010`, so you only ever hit
the frontend URL.

> The `db_dev` compose uses DB creds `sparkyfitness_db` / `sparky` / `password`.
> Make sure your root `.env` `SPARKY_FITNESS_DB_*` values match (or adjust one
> side).
>
> If you'd rather not pass `--port` every time, you can instead set
> `port: 8088` in `SparkyFitnessFrontend/vite.config.ts` (under `server:`) — but
> that's a tracked file, so the CLI flag keeps the change local to you.

---

## 3. The peptide tables create themselves

No manual migration step. On server startup the migration
`20260530120000_add_peptide_tracking.sql` is scanned from `db/migrations`,
applied, and recorded in `system.schema_migrations`, then RLS policies are
reapplied. Watch the server logs on first boot for the migration line.

## 4. Verify the Peptide feature

- Sign up / log in, then look for the **Peptides** tab (syringe icon) in the nav.
- The page should load; `GET /api/peptides` returns `[]` for a fresh user.
- Add a peptide -> log an injection -> the half-life decay chart renders.

## Troubleshooting

- **Port already in use** (`:8088`, `:3010`, or `:5432`): stop the conflicting
  process or pick another free port and update the mapping / `.env` to match.
- **Changed `SPARKY_FITNESS_FRONTEND_URL`?** Restart the backend so CORS and
  auth redirects pick up the new origin.
- **Auth/login redirects to the wrong place:** confirm
  `SPARKY_FITNESS_FRONTEND_URL` matches the URL you actually open (8088).
