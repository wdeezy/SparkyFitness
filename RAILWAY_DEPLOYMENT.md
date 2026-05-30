# Deploying *Your* SparkyFitness on Railway — A Complete Beginner's Guide

This guide puts **your own version** of SparkyFitness on the internet using a
service called **Railway** — including your custom features (peptide / injection
tracking with half-life decay estimation, and anything else on your branch).

It does this by having Railway **build the app directly from your GitHub code**,
so whatever you've written is what runs. It does **not** use the original authors'
prebuilt copies (those would not contain your changes).

This is written for someone who has never done this before. Every button click and
every box to fill in is spelled out. You do not need to install anything or type
any commands on your own computer — everything happens in your web browser.

Set aside about **60–75 minutes** the first time (the build steps take a few
minutes each).

---

## Part 0 — Understanding what you are building (plain English)

SparkyFitness is made of **three separate programs** that work together. Think of
a restaurant:

| The piece | Restaurant analogy | What it does |
| --- | --- | --- |
| **Database** | The pantry/fridge | Stores all your data: food logs, weight, workouts, **and your peptide log**. |
| **Backend (server)** | The kitchen | Does the work: calculations, saving data, **the half-life decay math**, talking to Fitbit/Garmin/etc. |
| **Frontend** | The dining room + waiter | The website you see and click on, **including your Peptides page**. |

On Railway you create **one "Project"** (one restaurant building) and put all three
pieces inside it. They talk to each other privately. Only the **Frontend** gets a
public door that you and your phone walk through.

```
        Internet (you, your phone)
                 │
                 ▼
        ┌─────────────────┐   public web address (https://....up.railway.app)
        │    Frontend     │   built from YOUR code (docker/Dockerfile.frontend)
        │  (the website)  │
        └────────┬────────┘
                 │  private, inside Railway only
                 ▼
        ┌─────────────────┐
        │    Backend      │   built from YOUR code (docker/Dockerfile.backend)
        │  (the server)   │
        └────────┬────────┘
                 │  private, inside Railway only
                 ▼
        ┌─────────────────┐
        │    Database     │   Railway's managed PostgreSQL
        │  (PostgreSQL)   │
        └─────────────────┘
```

### Why "build from your code" matters

Your custom work lives on the **`main` branch** of your GitHub repository
**`wdeezy/SparkyFitness`**. (A "branch" is just a named version of your code;
`main` is the standard name for the primary, live one.) `main` already contains,
among other things:

- `SparkyFitnessServer/services/peptideService.ts`,
  `models/peptideRepository.ts`, `routes/peptideRoutes.ts`,
  `utils/halfLifeEngine.ts` — the peptide backend.
- `SparkyFitnessServer/db/migrations/20260530120000_add_peptide_tracking.sql` —
  the database change that **creates the peptide tables automatically** the first
  time the backend starts. You do **not** have to run it by hand.
- `SparkyFitnessFrontend/src/pages/Peptides/Peptides.tsx` and friends — the
  Peptides web page.

Railway will read your `main` branch, **compile it into runnable programs**, and
start them. That compiling step is called a **"build."** Better still: once this is
set up, **anything you later merge into `main` deploys automatically** — you never
have to touch Railway's settings again (see Part 10).

> **Jargon, defined once:**
> - **Deploy** = put it online and start it running.
> - **Service** = one running program on Railway (you'll have three).
> - **Build** = turn your source code into a runnable program.
> - **Dockerfile** = a recipe file that tells the builder how to assemble one
>   program. Yours are `docker/Dockerfile.backend` and `docker/Dockerfile.frontend`.
> - **Variable** (or "environment variable") = a setting you type in, like a
>   password or web address, that a program reads when it starts.
> - **Repo / repository** = your project's code storage on GitHub.

---

## Part 1 — What it will cost

Railway charges for the computing power your programs actually use, plus a small
base fee.

- Railway's cheapest paid plan ("Hobby") starts around **US $5/month** and includes
  $5 of usage. A personal SparkyFitness used by one person typically runs
  **$5–$20/month** all-in (three programs + database).
- This app suits Railway well: it is "always-on," and its background tasks (a
  nightly backup, hourly device syncing, your peptide calculations on demand) are
  tiny and run inside an already-running program, so they don't add meaningful cost.
- **One extra cost vs. using prebuilt images:** building from source uses some
  build minutes each time you deploy. For a personal app this is negligible, but
  it's why builds take a few minutes.
- Railway shows a live cost meter, and you can set a hard **spending limit**
  (Part 12) so you're never surprised.

---

## Part 2 — Gather what you'll need (have these ready before you start)

Open a plain text note (Notepad / TextEdit / Notes app) and copy these in so you
can paste them later. **Treat the three secret values like passwords — never share
them or post them publicly.**

1. **Your email address** — the one you'll log in with and that becomes the admin.

2. **Your timezone** in "TZ" format. Find yours here:
   https://en.wikipedia.org/wiki/List_of_tz_database_time_zones (the **"TZ
   identifier"** column), e.g. `America/New_York`, `Europe/London`. If unsure, use
   `Etc/UTC`.

3. **An encryption key** (scrambles your stored data):
   ```
   PASTE_YOUR_64_CHARACTER_ENCRYPTION_KEY_HERE
   ```

4. **An authentication secret** (keeps logins secure):
   ```
   PASTE_YOUR_AUTH_SECRET_HERE
   ```

5. **An app database password** (the limited key the app uses for daily work):
   ```
   PASTE_YOUR_APP_DB_PASSWORD_HERE
   ```

> **Where do the secret values come from?** Whoever prepared this guide may have
> already generated three values for you in chat — paste those above. To make your
> own on a Mac/Linux computer, open the **Terminal** app and run
> `openssl rand -hex 32` for items 3 and 5, and `openssl rand -base64 32` for item
> 4.

> **VERY IMPORTANT about secret #4:** Once your app is live and anyone has turned on
> two-factor authentication, **never change** this value — doing so locks everyone
> out. Set it once, save it, leave it alone.

---

## Part 3 — Connect Railway to your GitHub account

Because Railway will build from your code, it needs permission to read your repo.

1. In your browser go to **https://railway.com** and click **Login** (top right).
2. **Sign up / log in with GitHub** — this is the easiest path since your code is
   on GitHub. Use the GitHub account that owns **`wdeezy/SparkyFitness`**.
3. When GitHub asks, **authorize Railway**. If it offers a choice, you can grant
   access to **only the `SparkyFitness` repository** rather than all repos — that's
   fine and more private.
4. Railway may ask you to verify your account and add a payment method before
   running apps publicly. Add a card when prompted; you'll set a spending cap in
   Part 12.

> If you later find Railway can't see your repo, go to GitHub →
> **Settings → Applications → Railway → Configure** and make sure `SparkyFitness`
> is in the list of repositories Railway may access.

---

## Part 4 — Create your Project (the "building")

1. On your Railway **Dashboard**, click **New Project** (or **+ New**).
2. Choose **Empty Project**.
3. A blank canvas opens — this canvas **is** your project.
4. Rename it: top-left, click the auto-generated name and change it to
   **sparkyfitness**. Press Enter.

Keep this tab open — everything happens here.

---

## Part 5 — Add the Database (the "pantry")

1. On the canvas, click **+ Create** (or press **Cmd/Ctrl + K**).
2. Choose **Database** → **Add PostgreSQL**.
3. A box named **Postgres** appears. **Leave its name as exactly `Postgres`** — the
   spelling matters in later steps.

Nothing else to configure. Your backend will create everything it needs (including
the peptide tables) the first time it runs.

---

## Part 6 — Add the Backend (the "kitchen"), built from your code

### 6a. Create the service from your GitHub repo

1. Click **+ Create** on the canvas.
2. Choose **GitHub Repo** (also shown as **Deploy from GitHub repo**).
3. Pick **`wdeezy/SparkyFitness`** from the list.
4. Railway adds a box and may immediately try to build. That's fine — the first
   attempt may fail because we haven't told it which recipe or branch to use yet.
   We'll fix that now.
5. Open the new box and **rename the service to exactly**:
   ```
   sparkyfitness-server
   ```
   Press Enter. (The exact name matters — the frontend finds the backend by it.)

### 6b. Point it at the right branch and the right build recipe

1. With **sparkyfitness-server** open, click the **Settings** tab.
2. Under the **Source** / **Service Source** area, set the **Branch** to:
   ```
   main
   ```
   This is your live code (your peptide tracking is already merged into `main`).
   From now on, every time you merge new work into `main`, Railway rebuilds this
   service automatically.
3. Still in **Settings**, find the **Build** section. Leave **Root Directory**
   **empty/blank** — your Dockerfiles expect the whole repository as their starting
   point. (Do **not** set Root Directory to a subfolder; the build will break if you
   do.)
4. Now tell Railway which recipe to use. The most reliable way that works on every
   version of Railway is to add a special **variable**. Open the **Variables** tab
   and add this one line first (you'll add the rest in 6c):
   ```
   RAILWAY_DOCKERFILE_PATH=docker/Dockerfile.backend
   ```
   (If your Settings → Build page shows a **"Dockerfile Path"** text box instead,
   you may type `docker/Dockerfile.backend` there — either method works; you only
   need one.)

### 6c. Add the backend's settings (variables)

1. Still on the **Variables** tab of **sparkyfitness-server**, find the **Raw
   Editor** (or "Raw" / "Edit as text") button so you can paste everything at once.
2. Paste this block (it includes the Dockerfile line from 6b), then save:

   ```
   RAILWAY_DOCKERFILE_PATH=docker/Dockerfile.backend
   SPARKY_FITNESS_DB_HOST=${{Postgres.PGHOST}}
   SPARKY_FITNESS_DB_PORT=${{Postgres.PGPORT}}
   SPARKY_FITNESS_DB_NAME=${{Postgres.PGDATABASE}}
   SPARKY_FITNESS_DB_USER=${{Postgres.PGUSER}}
   SPARKY_FITNESS_DB_PASSWORD=${{Postgres.PGPASSWORD}}
   SPARKY_FITNESS_APP_DB_USER=sparky_app
   SPARKY_FITNESS_APP_DB_PASSWORD=PASTE_YOUR_APP_DB_PASSWORD_HERE
   SPARKY_FITNESS_API_ENCRYPTION_KEY=PASTE_YOUR_64_CHARACTER_ENCRYPTION_KEY_HERE
   BETTER_AUTH_SECRET=PASTE_YOUR_AUTH_SECRET_HERE
   NODE_ENV=production
   SPARKY_FITNESS_LOG_LEVEL=ERROR
   SPARKY_FITNESS_DISABLE_SIGNUP=false
   SPARKY_FITNESS_ADMIN_EMAIL=PASTE_YOUR_EMAIL_HERE
   TZ=PASTE_YOUR_TIMEZONE_HERE
   SPARKY_FITNESS_FRONTEND_URL=https://placeholder.invalid
   ```

3. Replace each `PASTE_...` with your real values from Part 2, and set `TZ`. Leave
   every `${{Postgres....}}` line **exactly as written** — those automatically pull
   the database's address and password from the Postgres box. Leave
   `SPARKY_FITNESS_FRONTEND_URL` as the placeholder for now (fixed in Part 8). Save.

> **What these mean:** the `DB_*` lines tell the kitchen where the pantry is and how
> to open it (the `${{Postgres...}}` references are filled in by Railway). The app
> uses the powerful database account only to set itself up, then **automatically
> creates a limited account** named `sparky_app` (with the password you supplied)
> for everyday work. `ADMIN_EMAIL` makes your account the administrator.
> `DISABLE_SIGNUP=false` lets you register; you'll flip it to `true` afterward.

### 6d. Give the backend a permanent drive for uploaded images

Uploaded files (profile pictures, exercise images) need permanent storage or they
vanish on restart.

1. In **sparkyfitness-server**, attach a **Volume** (right-click the service box →
   **Attach Volume**, or find **Volume** under the service's **Settings**).
2. Set the **Mount Path** to exactly:
   ```
   /app/SparkyFitnessServer/uploads
   ```
3. Confirm (default size is fine).

> Optional: nightly database backups are written to
> `/app/SparkyFitnessServer/backup`. To keep those across restarts, attach a second
> volume at that path. Optional — Part 12 covers backups.

### 6e. Keep the backend private

The backend should not have its own public web address — only the frontend talks to
it. So **do not** generate a domain here. If you accidentally made one, open
**Settings → Networking** and remove it.

### 6f. Build and watch

1. Trigger a build: click **Deploy** (top of canvas) if Railway shows pending
   changes, or open the service → **Deployments** → **⋮ → Redeploy**.
2. Open **Deployments → View Logs / Build Logs** to watch. The first build runs your
   Dockerfile: installing dependencies and assembling the server. **This takes a few
   minutes** — that's normal.
3. After it builds, it starts up, connects to the database, and **runs your peptide
   migration automatically** (you'll see migration messages in the logs). It's
   normal to see one or two restarts on the very first launch while the database
   finishes waking up.

---

## Part 7 — Add the Frontend (the "dining room"), built from your code

### 7a. Create a second service from the same repo

1. Click **+ Create** → **GitHub Repo** → pick **`wdeezy/SparkyFitness`** again.
   (Yes, the same repo a second time — Railway happily runs two programs from one
   repository.)
2. Open the new box and rename it to something tidy like **sparkyfitness-frontend**
   (this name isn't referenced elsewhere, so it can be anything).

### 7b. Point it at the right branch and recipe

1. **Settings → Source:** set **Branch** to `main` (the same branch as the
   backend).
2. **Settings → Build:** leave **Root Directory** **empty/blank**.
3. Add the recipe variable (next step includes it).

### 7c. Add the frontend's settings

1. Open the frontend's **Variables** tab → **Raw Editor**, paste, and save:

   ```
   RAILWAY_DOCKERFILE_PATH=docker/Dockerfile.frontend
   SPARKY_FITNESS_SERVER_HOST=sparkyfitness-server.railway.internal
   SPARKY_FITNESS_SERVER_PORT=3010
   NGINX_LISTEN_PORT=8080
   SPARKY_FITNESS_FRONTEND_URL=https://placeholder.invalid
   ```

   - `SPARKY_FITNESS_SERVER_HOST` is the backend's private address. The form
     `sparkyfitness-server.railway.internal` works **only because** you named the
     backend service exactly `sparkyfitness-server`. If you named it differently,
     use `your-backend-name.railway.internal`.
   - `NGINX_LISTEN_PORT=8080` sets the internal door the website listens on — match
     it in the next step.
   - Leave `SPARKY_FITNESS_FRONTEND_URL` as the placeholder one more moment.

### 7d. Give the frontend a public web address

1. Open the frontend service → **Settings → Networking**.
2. Under **Public Networking**, click **Generate Domain**.
3. When asked which port to expose, enter **8080** (matching `NGINX_LISTEN_PORT`).
   Confirm.
4. Railway gives you an address like
   `https://sparkyfitness-frontend-production-xxxx.up.railway.app`. **Copy it** into
   your notes — this is your app's public URL.

### 7e. Build it

Trigger the build (it will start automatically after saving settings, or use
**Deployments → ⋮ → Redeploy**). This build compiles your React app — **a few
minutes** — then serves it with a small web server (Nginx). Watch **Build Logs** if
you like.

---

## Part 8 — Connect the pieces together (the crucial final wiring)

Now that you know your public address, tell **both** programs what it is. This is
required for login and security.

1. **Frontend** service → **Variables**: set `SPARKY_FITNESS_FRONTEND_URL` to your
   real public address from Part 7d, with **no slash at the end**, e.g.
   ```
   SPARKY_FITNESS_FRONTEND_URL=https://sparkyfitness-frontend-production-xxxx.up.railway.app
   ```
   Save.

2. **Backend** (`sparkyfitness-server`) → **Variables**: set its
   `SPARKY_FITNESS_FRONTEND_URL` to the **exact same** address. Save.

3. Both services redeploy when you save (or click **Deploy**). Wait for both to show
   **Active / green**.

> **Why both?** The backend uses this address as a security guard — it only accepts
> requests from your real website. If it's wrong or missing, the page loads but
> login fails.

---

## Part 9 — First login, then lock it down

1. Open your public address in your browser. You should see the SparkyFitness
   welcome/login screen.
2. **Create an account** using the **same email** you put in
   `SPARKY_FITNESS_ADMIN_EMAIL`. That makes your account the administrator.
3. Log in. Confirm it works, then **find your Peptides page** (from your custom
   build) and add a peptide to confirm your feature is live and the half-life math
   runs.
4. **Close public registration:** backend service → **Variables**, set:
   ```
   SPARKY_FITNESS_DISABLE_SIGNUP=true
   ```
   Save and let it redeploy. Now strangers can't register, but you still log in
   normally.

You're live with your own code. 🎉

---

## Part 10 — Automatic updates when you change your code

This is the part you specifically wanted: because both services are connected to
**`main`**, Railway **rebuilds and redeploys automatically every time `main`
changes** — you never have to reconfigure Railway again.

- It's on by default. To confirm: each service → **Settings → Source** (or **Deploy
  Triggers**) → ensure "deploy on push to `main`" is enabled.
- So your workflow is simply: do your work on a side branch → **merge it into
  `main`** (e.g. via a pull request on GitHub) → Railway notices, rebuilds **both**
  services from the new `main`, and your update goes live in a few minutes. No
  Railway changes needed, ever.
- Your data (database + uploads volume) is preserved across rebuilds.
- Any new database migration files you add will run automatically on the next
  backend start — just like your peptide migration did the first time.

> You can keep developing on feature branches and only merge to `main` when you're
> happy. `main` is your "live" version; merging into it is your "publish" button.

---

## Part 11 — Using your own web address (optional)

By default your app is at a long `...up.railway.app` address. You can use your own.

**Recommended: a sub-address (subdomain) like `fitness.yourname.com`** — works with
**zero code changes**. (A path like `yourname.com/fitness` is **not** supported
without modifying the app, so avoid that.)

1. Own a domain (Namecheap, Cloudflare, etc.).
2. Railway: **frontend** service → **Settings → Networking → Custom Domain →
   + Custom Domain**. Enter e.g. `fitness.yourname.com`. Confirm.
3. Railway shows a **CNAME** record (a **name/host** and a **value/target**). A
   "CNAME" is just a forwarding instruction for your domain.
4. At your domain registrar, open the domain's **DNS settings** and **add a new
   CNAME record** with exactly the name and value Railway gave you. Save.
5. Back in Railway, within minutes (sometimes up to an hour) it verifies and sets up
   the secure padlock automatically; the status turns green.
6. **Update the address everywhere:** set `SPARKY_FITNESS_FRONTEND_URL` to
   `https://fitness.yourname.com` in **both** the frontend and backend services
   (as in Part 8). From then on, use your custom address.

---

## Part 12 — Maintenance & cost control

**Set a spending cap:** account avatar (top right) → **Account/Workspace Settings**
→ **Usage / Billing** → **Usage Limits** → set a monthly hard cap (e.g. $20).
Railway can email you as you approach it.

**Watch your cost:** the same Usage/Billing area shows a live monthly estimate per
service.

**Update the app:** push new commits to your branch (Part 10), or manually
**Deployments → ⋮ → Redeploy** a service. Do the backend first, then the frontend.

**Backups:** Railway's Postgres has its own backup option in the **Postgres**
service settings. Your app also writes a nightly database backup (kept 7 days)
inside the backend. For real safety, occasionally download a backup and store a
copy off Railway.

**Restart something:** service → **Deployments → ⋮ → Restart** or **Redeploy**.

---

## Part 13 — If something goes wrong (troubleshooting)

Open the misbehaving service → **Deployments → View Logs** (use **Build Logs** for
build problems, **Deploy Logs** for run-time problems).

- **A build fails.**
  Check the **Build Logs**. Most common causes:
  (a) Wrong recipe path — confirm `RAILWAY_DOCKERFILE_PATH` is exactly
  `docker/Dockerfile.backend` (backend) or `docker/Dockerfile.frontend` (frontend).
  (b) **Root Directory** was set to a subfolder — it must be **empty/blank** so the
  whole repo is the build context.
  (c) Wrong branch selected — confirm the **Branch** is the one with your code.
  (d) A "frozen-lockfile" error means your `pnpm-lock.yaml` is out of sync with a
  `package.json` change; run `pnpm install` locally, commit the updated lockfile,
  and push.

- **Website loads but login fails / "network error" / CORS error.**
  `SPARKY_FITNESS_FRONTEND_URL` is wrong or mismatched. It must be your exact public
  address (`https://`, **no** trailing slash) and **identical** in both services.
  Redeploy both after fixing.

- **"502 Bad Gateway" or blank/error page.**
  The frontend can't reach the backend. Confirm (a) the backend is **Active/green**,
  and (b) the frontend's `SPARKY_FITNESS_SERVER_HOST` equals the backend's service
  name + `.railway.internal`, with `SPARKY_FITNESS_SERVER_PORT=3010`. After the
  backend is healthy, **Redeploy the frontend**.

  If the backend logs show it started fine (`listening on ::3010`) but every
  `/api/...` request still hangs ~60 seconds before returning 502, the backend is
  listening on the wrong network stack. Railway's private network
  (`*.railway.internal`) is **IPv6-only**, so the backend must listen on `::`.
  The server now does this by default — make sure the backend is built from
  up-to-date code and **Redeploy** it. (On the rare host with IPv6 disabled, set
  `SPARKY_FITNESS_SERVER_BIND_HOST=0.0.0.0` on the backend instead.)

- **Public address won't open at all.**
  Make sure you generated the domain on the **frontend** and set its port to
  **8080** (matching `NGINX_LISTEN_PORT=8080`). Re-check **Settings → Networking**.

- **Backend keeps restarting / "Missing required environment variables."**
  A required setting is blank. Re-check the backend Variables from Part 6c —
  especially that the `${{Postgres....}}` lines are exact and the database service
  is still named **Postgres**.

- **Peptide page is missing or empty.**
  This almost always means Railway built an **old commit** or the wrong branch.
  Confirm both services' **Branch** is `main` and **Redeploy**. In the backend's
  logs on first run you should see your peptide migration
  (`20260530120000_add_peptide_tracking.sql`) being applied.

- **Database errors right after first deploy.**
  The database may still be starting. Wait two minutes and **Redeploy** the backend.

- **Uploaded pictures disappear after a redeploy.**
  The uploads volume isn't attached or is at the wrong path. Confirm a volume is on
  the backend at exactly `/app/SparkyFitnessServer/uploads` (Part 6d).

---

## Quick reference — what goes where

**Source for BOTH app services:** GitHub repo `wdeezy/SparkyFitness`, branch
`main`, **Root Directory blank**. (Both services auto-redeploy on every push/merge
to `main`.)

**Postgres service:** no configuration; keep its name exactly `Postgres`.

**Backend service** — name it exactly `sparkyfitness-server`. Variables:

| Variable | Value |
| --- | --- |
| `RAILWAY_DOCKERFILE_PATH` | `docker/Dockerfile.backend` |
| `SPARKY_FITNESS_DB_HOST` | `${{Postgres.PGHOST}}` |
| `SPARKY_FITNESS_DB_PORT` | `${{Postgres.PGPORT}}` |
| `SPARKY_FITNESS_DB_NAME` | `${{Postgres.PGDATABASE}}` |
| `SPARKY_FITNESS_DB_USER` | `${{Postgres.PGUSER}}` |
| `SPARKY_FITNESS_DB_PASSWORD` | `${{Postgres.PGPASSWORD}}` |
| `SPARKY_FITNESS_APP_DB_USER` | `sparky_app` |
| `SPARKY_FITNESS_APP_DB_PASSWORD` | your generated app DB password |
| `SPARKY_FITNESS_API_ENCRYPTION_KEY` | your 64-char encryption key |
| `BETTER_AUTH_SECRET` | your auth secret (never change after go-live) |
| `NODE_ENV` | `production` |
| `SPARKY_FITNESS_LOG_LEVEL` | `ERROR` |
| `SPARKY_FITNESS_DISABLE_SIGNUP` | `false` first, then `true` after you register |
| `SPARKY_FITNESS_ADMIN_EMAIL` | your email |
| `TZ` | your timezone, e.g. `America/New_York` |
| `SPARKY_FITNESS_FRONTEND_URL` | your public address (set in Part 8) |

- Volume at `/app/SparkyFitnessServer/uploads`
- **No** public domain

**Frontend service** — public-facing. Variables:

| Variable | Value |
| --- | --- |
| `RAILWAY_DOCKERFILE_PATH` | `docker/Dockerfile.frontend` |
| `SPARKY_FITNESS_SERVER_HOST` | `sparkyfitness-server.railway.internal` |
| `SPARKY_FITNESS_SERVER_PORT` | `3010` |
| `NGINX_LISTEN_PORT` | `8080` |
| `SPARKY_FITNESS_FRONTEND_URL` | your public address (set in Part 8) |

- Public domain generated, exposed on port **8080**
