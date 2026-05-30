# Deploying SparkyFitness on Railway — A Complete Beginner's Guide

This guide walks you through putting SparkyFitness on the internet using a service
called **Railway**. It is written for someone who has **never** done this before.
Every button click and every box you need to fill in is spelled out. You do not
need to install anything on your computer, and you do not need to type any
commands. Everything happens in your web browser.

Set aside about **45–60 minutes** the first time.

---

## Part 0 — Understanding what you are building (plain English)

SparkyFitness is made of **three separate programs** that work together. Think of
a restaurant:

| The piece | Restaurant analogy | What it does |
| --- | --- | --- |
| **Database** | The pantry/fridge | Stores all your data: food logs, weight, workouts. |
| **Backend (server)** | The kitchen | Does the actual work: calculations, saving data, talking to Fitbit/Garmin/etc. |
| **Frontend** | The dining room + waiter | The website you actually see and click on. It takes your requests to the kitchen. |

On Railway you will create **one "Project"** (think of it as one restaurant
building) and put all three pieces inside it. The three pieces talk to each other
privately inside the building. Only the **Frontend** (dining room) gets a public
door that you and your phone can walk through.

```
        Internet (you, your phone)
                 │
                 ▼
        ┌─────────────────┐   public web address (https://....up.railway.app)
        │    Frontend     │
        │  (the website)  │
        └────────┬────────┘
                 │  private, inside Railway only
                 ▼
        ┌─────────────────┐
        │    Backend      │
        │  (the server)   │
        └────────┬────────┘
                 │  private, inside Railway only
                 ▼
        ┌─────────────────┐
        │    Database     │
        │  (PostgreSQL)   │
        └─────────────────┘
```

You will **not** be building the programs from scratch. The SparkyFitness authors
have already built and published ready-to-run copies (called "images"). You just
tell Railway to download and run them. The two image names you will use are:

- Backend image: `codewithcj/sparkyfitness_server:latest`
- Frontend image: `codewithcj/sparkyfitness:latest`

> **A note on jargon:** A **"Docker image"** is just a frozen, ready-to-run copy of
> a program, packaged so it runs the same way anywhere. **"Deploy"** means "put it
> online and start it running." A **"service"** on Railway is one running program.
> A **"variable"** (or "environment variable") is a setting you type in — like a
> password or a web address — that the program reads when it starts.

---

## Part 1 — What it will cost

Railway charges based on how much computing power your programs actually use,
plus a small base fee.

- Railway's cheapest paid plan ("Hobby") starts at about **US $5/month**, which
  includes $5 of usage. A personal SparkyFitness instance used by one person
  typically lands in the **$5–$20/month** range all-in (the three programs plus
  the database).
- This app is a good fit for Railway because it is an "always-on" app. Its
  background tasks (a nightly backup, hourly syncing with Fitbit/Garmin/etc.)
  are tiny and run inside a program that is already running, so they do **not**
  cost extra in any meaningful way.
- Railway shows you a live usage/cost meter, and you can set a **spending limit**
  so you are never surprised (covered in Part 11).

---

## Part 2 — Gather what you'll need (have these ready before you start)

Open a plain text document (Notepad, TextEdit, or the Notes app) and copy these
in so you can paste them later. **Treat the three secret values like passwords —
do not share them or post them anywhere public.**

1. **Your email address** — the one you want to use to log in to SparkyFitness and
   be the administrator.

2. **Your timezone** — in "TZ" format. Find yours here:
   https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
   (look at the **"TZ identifier"** column). Examples: `America/New_York`,
   `America/Chicago`, `Europe/London`, `Australia/Sydney`. If unsure, use
   `Etc/UTC`.

3. **An encryption key** — a long secret used to scramble your stored data.
   Use this freshly generated value (or generate your own — see the box below):

   ```
   PASTE_YOUR_64_CHARACTER_ENCRYPTION_KEY_HERE
   ```

4. **An authentication secret** — used to keep you logged in securely.
   Use this freshly generated value:

   ```
   PASTE_YOUR_AUTH_SECRET_HERE
   ```

5. **An app database password** — a password the kitchen uses to open the pantry.
   Use this freshly generated value:

   ```
   PASTE_YOUR_APP_DB_PASSWORD_HERE
   ```

> **Where do the secret values come from?** Whoever set up this guide for you may
> have already generated values and given them to you in chat — paste those in
> above. If you need to make your own and you have a Mac or Linux computer, open
> the **Terminal** app and run `openssl rand -hex 32` for items 3 and 5, and
> `openssl rand -base64 32` for item 4. If none of that means anything to you,
> just ask whoever shared this guide to generate three values for you.

> **VERY IMPORTANT about secret #4 (the authentication secret):** Once your app is
> live and people have turned on two-factor authentication, you must **never
> change** this value. Changing it locks everyone out of their accounts. Pick it
> once, save it safely, and leave it alone.

---

## Part 3 — Create your Railway account

1. In your web browser, go to **https://railway.com**.
2. Click **Login** (top right), then choose to sign up. Signing up with your
   **GitHub** account is easiest, but email works too. Follow the prompts.
3. Railway may ask you to verify your account and add a payment method before it
   will let you run apps publicly. Add a card when prompted — you will not be
   charged beyond actual usage, and we will set a spending limit later.

---

## Part 4 — Create your Project (the "building")

1. After logging in you land on your **Dashboard**. Click the **New Project**
   button (sometimes shown as **+ New** or **Create a New Project**).
2. From the menu that appears, choose **Empty Project**.
3. Railway opens a blank canvas. This canvas **is** your project. Each program
   you add will appear here as a box.
4. Give the project a friendly name: look at the top-left of the canvas, click the
   auto-generated name (something like "perceptive-mercy"), and rename it to
   **sparkyfitness**. Press Enter.

Keep this canvas tab open — you'll do everything else here.

---

## Part 5 — Add the Database (the "pantry")

1. On the project canvas, click **+ Create** (or right-click empty space and
   choose **Add a Service**, or press **Cmd/Ctrl + K**).
2. Choose **Database**.
3. Choose **Add PostgreSQL**.
4. A new box labeled **Postgres** appears on your canvas. That's your database —
   Railway sets it up automatically. **Leave its name as "Postgres"** (the exact
   spelling matters later).

That's it for the database. You don't need to open it or configure anything inside
it. The backend will create everything it needs the first time it runs.

> If you ever need the database's connection details, click the **Postgres** box
> and look at its **Variables** tab. You won't need to touch them by hand — the
> next steps reference them automatically.

---

## Part 6 — Add the Backend (the "kitchen")

### 6a. Create the service from the published image

1. Click **+ Create** on the canvas again.
2. Choose **Docker Image** (it may be listed under "Empty Service" → then set a
   source, depending on Railway's current menu; look for the option that lets you
   **deploy from a Docker image / image name**).
3. In the box that asks for the image, type **exactly**:
   ```
   codewithcj/sparkyfitness_server:latest
   ```
   and confirm. Railway creates a new box for this service.
4. Click the new box to open it. Click the service name at the top and **rename it
   to exactly**:
   ```
   sparkyfitness-server
   ```
   Press Enter. (The exact name matters — the frontend finds the backend by this
   name.)

### 6b. Tell the backend its settings (variables)

1. With the **sparkyfitness-server** service open, click the **Variables** tab.
2. You will add a list of settings. The fastest way: look for a **Raw Editor** (or
   "Raw" / "Edit as text") button on the Variables tab — it lets you paste all
   settings at once. Click it and paste the block below **exactly**, then save.

   ```
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

3. Now replace the four `PASTE_...` placeholders with your real values from Part 2
   (app DB password, encryption key, auth secret, your email), and set `TZ` to your
   timezone. Leave the `${{Postgres....}}` lines **exactly as written** — those are
   special references that automatically pull the database's address and password
   from the Postgres box you created. Leave `SPARKY_FITNESS_FRONTEND_URL` as the
   placeholder for now; you'll fix it in Part 8 once you know your web address.

4. Save the variables.

> **What these mean, briefly:** The `DB_*` lines tell the kitchen where the pantry
> is and how to open it. `APP_DB_USER`/`APP_DB_PASSWORD` is a limited-access pantry
> key the app creates and uses for day-to-day work. `ADMIN_EMAIL` makes the account
> you sign up with an administrator. `DISABLE_SIGNUP=false` lets you create your
> account; you'll switch it to `true` afterward so strangers can't register.

### 6c. Give the backend a storage drive for uploaded images

Uploaded files (profile pictures, exercise images) need a permanent place to live,
otherwise they vanish whenever the app restarts.

1. Still inside the **sparkyfitness-server** service, find **+ Create** within the
   service, or right-click the service box → **Attach Volume** (also reachable via
   the service's **Settings** or **Storage** area; look for **Volume**).
2. When asked for the **Mount Path**, type **exactly**:
   ```
   /app/SparkyFitnessServer/uploads
   ```
3. Confirm. This attaches a small permanent disk at that location. (You can leave
   the size at the default.)

> Optional: database backups are written nightly to
> `/app/SparkyFitnessServer/backup`. If you want those to survive restarts too,
> you can attach a second volume at that path. It's optional — your real safety net
> for the database is Railway's own Postgres, and Part 11 covers backups.

### 6d. Do NOT give the backend a public web address

The backend should stay private (only the frontend talks to it). So **skip**
generating a domain for this service. If you accidentally created one, open the
service's **Settings → Networking** and remove the public domain. Leaving it
private is both simpler and safer.

The backend will start, connect to the database, and set everything up
automatically. You can watch it in the **Deployments** tab (and **View Logs**). The
first start takes a minute or two. It's normal to see it restart once or twice
while the database finishes waking up.

---

## Part 7 — Add the Frontend (the "dining room")

### 7a. Create the service from the published image

1. Click **+ Create** on the canvas.
2. Choose **Docker Image** again.
3. Enter **exactly**:
   ```
   codewithcj/sparkyfitness:latest
   ```
   and confirm.
4. Open the new box and rename the service to something clear like
   **sparkyfitness-frontend** (this name is not referenced by anything, so it can
   be whatever you like — just keep it tidy).

### 7b. Tell the frontend its settings

1. Open the **Variables** tab for the frontend service.
2. Using the **Raw Editor**, paste this block and save:

   ```
   SPARKY_FITNESS_SERVER_HOST=sparkyfitness-server.railway.internal
   SPARKY_FITNESS_SERVER_PORT=3010
   NGINX_LISTEN_PORT=8080
   SPARKY_FITNESS_FRONTEND_URL=https://placeholder.invalid
   ```

   - `SPARKY_FITNESS_SERVER_HOST` is the private address of the kitchen. The form
     `sparkyfitness-server.railway.internal` only works because you named the
     backend service exactly `sparkyfitness-server` in Part 6. If you named it
     differently, use `your-backend-name.railway.internal`.
   - `NGINX_LISTEN_PORT=8080` tells the website which internal door to use. Keep
     this number — you'll match it in the next step.
   - Leave `SPARKY_FITNESS_FRONTEND_URL` as the placeholder for one more moment.

### 7c. Give the frontend a public web address

1. In the frontend service, open **Settings → Networking**.
2. Under **Public Networking**, click **Generate Domain**.
3. Railway asks which port to expose. Enter **8080** (matching `NGINX_LISTEN_PORT`
   from the previous step). Confirm.
4. Railway gives you a web address like
   `https://sparkyfitness-frontend-production-xxxx.up.railway.app`.
   **Copy this address** and paste it into your notes — this is your app's public
   URL.

---

## Part 8 — Connect the pieces together (the important final wiring)

Now that you know your public web address, you must tell **both** the backend and
the frontend what it is. This is required for login and security to work.

1. Open the **frontend** service → **Variables**. Change the
   `SPARKY_FITNESS_FRONTEND_URL` line so it equals your real public address from
   Part 7c, with **no slash at the end**. Example:
   ```
   SPARKY_FITNESS_FRONTEND_URL=https://sparkyfitness-frontend-production-xxxx.up.railway.app
   ```
   Save.

2. Open the **backend** (`sparkyfitness-server`) service → **Variables**. Change
   its `SPARKY_FITNESS_FRONTEND_URL` to the **exact same** address. Save.

3. Both services will automatically redeploy when you save (or click **Deploy** /
   the **Deploy** button at the top of the canvas if Railway shows "Apply
   changes"). Wait for both to show a green/"Active" status.

> **Why both?** The backend uses this address as a security guard — it only accepts
> requests coming from your real website and rejects everything else. If this
> address is wrong or missing, you'll be able to load the page but logging in will
> fail.

---

## Part 9 — First login and locking it down

1. Open your public web address (from Part 7c) in your browser. You should see the
   SparkyFitness login/welcome screen.
2. Click to **create an account** and register with the **same email** you put in
   `SPARKY_FITNESS_ADMIN_EMAIL`. Because of that setting, your account becomes the
   administrator automatically.
3. Log in and confirm everything works (try adding a food or a weight entry).
4. **Close registration to the public:** go back to the **backend** service →
   **Variables**, change:
   ```
   SPARKY_FITNESS_DISABLE_SIGNUP=true
   ```
   Save and let it redeploy. Now no stranger can create an account, but you (and
   anyone you deliberately invite) can still log in.

You're live. 🎉

---

## Part 10 — Using your own web address (optional)

By default your app lives at a long `...up.railway.app` address. You can point your
own domain at it instead.

**Recommended: use a sub-address (subdomain), like `fitness.yourname.com`.** This
works with **zero code changes**. (Putting the app under a path like
`yourname.com/fitness` is **not** supported without modifying the app's code, so
avoid that.)

1. Buy a domain from any registrar (Namecheap, Cloudflare, Google Domains, etc.) if
   you don't already own one.
2. In Railway: open the **frontend** service → **Settings → Networking → Custom
   Domain** → **+ Custom Domain**. Type the sub-address you want, e.g.
   `fitness.yourname.com`. Confirm.
3. Railway shows you a **CNAME** record — two pieces of text: a **name/host** and a
   **value/target**. (A "CNAME" is just a forwarding instruction in your domain's
   settings.)
4. Go to your domain registrar's website, find the **DNS settings** for your
   domain, and **add a new CNAME record** using exactly the name and value Railway
   showed you.
5. Save at the registrar, then return to Railway. Within a few minutes (sometimes
   up to an hour) Railway will verify it and automatically set up a secure
   certificate (the padlock). The status turns green when ready.
6. **Update the address everywhere:** change `SPARKY_FITNESS_FRONTEND_URL` to your
   new `https://fitness.yourname.com` in **both** the frontend and backend
   services (same as Part 8), and save. From now on, use your custom address to
   reach the app.

---

## Part 11 — Keeping it healthy (maintenance & cost control)

**Set a spending limit so you're never surprised:**
1. Click your account avatar (top right) → **Account Settings** (or **Workspace
   Settings**) → **Usage** / **Billing**.
2. Find **Usage Limits** and set a monthly hard cap (for example, $20). Railway can
   email you as you approach it.

**Watch your cost:** the same Usage/Billing area shows a live estimate for the
month, broken down by service.

**Updating to a newer version of SparkyFitness:** the images you used end in
`:latest`. To pull the newest published version, open a service → **Deployments** →
**Redeploy** (or the **⋮** menu → **Redeploy**). Do the backend first, then the
frontend. Your data in the database and the uploads volume is preserved across
redeploys.

**Backups:** Railway's Postgres can be backed up from the **Postgres** service
(look for a **Backups** option in its settings). The app also makes its own nightly
database backup inside the backend (kept for 7 days). For real safety, occasionally
download a backup and keep a copy somewhere off Railway.

**Restarting something:** if a service misbehaves, open it → **Deployments** → use
the **⋮** menu → **Restart** or **Redeploy**.

---

## Part 12 — If something goes wrong (troubleshooting)

Open the misbehaving service → **Deployments** → **View Logs** to see messages.
Common situations:

- **The website loads, but logging in fails / "network error" / CORS error.**
  `SPARKY_FITNESS_FRONTEND_URL` is wrong or mismatched. Make sure it is the **exact**
  public address (starts with `https://`, **no** trailing slash) and is **identical**
  in both the frontend and backend services. Redeploy both after fixing.

- **The website shows "502 Bad Gateway" or a blank/error page.**
  The frontend can't reach the backend. Check that:
  (a) the backend service is **Active/green** (it must be fully started first), and
  (b) the frontend's `SPARKY_FITNESS_SERVER_HOST` exactly matches the backend's
  service name followed by `.railway.internal`, and `SPARKY_FITNESS_SERVER_PORT`
  is `3010`. After the backend is healthy, **Redeploy the frontend** so it
  reconnects.

- **The public address won't open at all.**
  Make sure you generated a domain for the **frontend** and set its port to **8080**
  (matching `NGINX_LISTEN_PORT=8080`). Re-check **Settings → Networking**.

- **The backend keeps restarting / "Missing required environment variables".**
  A required setting is missing or blank. Double-check the backend Variables block
  from Part 6b — especially that the `${{Postgres....}}` lines are typed exactly
  and the Postgres service is still named **Postgres**.

- **Database connection errors right after first deploy.**
  The database may still be starting. Wait two minutes and **Redeploy** the backend.
  It's normal to see one or two restarts on the very first launch.

- **Uploaded pictures disappear after a redeploy.**
  The uploads volume isn't attached, or is at the wrong path. Confirm a volume is
  attached to the backend at exactly `/app/SparkyFitnessServer/uploads` (Part 6c).

---

## Quick reference — what goes where

**Postgres service:** no configuration needed; keep its name as `Postgres`.

**Backend service** — name it exactly `sparkyfitness-server`. Variables:

| Variable | Value |
| --- | --- |
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

- Volume mounted at `/app/SparkyFitnessServer/uploads`
- **No** public domain

**Frontend service** — public-facing. Variables:

| Variable | Value |
| --- | --- |
| `SPARKY_FITNESS_SERVER_HOST` | `sparkyfitness-server.railway.internal` |
| `SPARKY_FITNESS_SERVER_PORT` | `3010` |
| `NGINX_LISTEN_PORT` | `8080` |
| `SPARKY_FITNESS_FRONTEND_URL` | your public address (set in Part 8) |

- Public domain generated, exposed on port **8080**
