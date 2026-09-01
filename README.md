# FundMyHope payment server

A tiny server whose only job is to hold your Stripe **secret** key and
create PaymentIntents. Your frontend (`fundmyhope.html`) never sees
this key — it only talks to this server, and to Stripe.js using your
**publishable** key.

## 1. Get your Stripe keys

1. Log in at https://dashboard.stripe.com
2. Make sure **Test mode** is on (toggle, top right) while you're testing
3. Go to **Developers → API keys**
4. Copy the **Publishable key** (`pk_test_...`) and **Secret key** (`sk_test_...`)

## 2. Put this code on GitHub

Render deploys from a Git repository, so:

1. Create a new repository on https://github.com/new (e.g. `fundmyhope-server`)
2. Upload these three files to it: `server.js`, `package.json`, this `README.md`
   (easiest: on the new repo's page, use "uploading an existing file" and
   drag them in, then commit)

## 3. Deploy to Render

1. Go to https://render.com and sign in (GitHub sign-in is easiest)
2. **New → Web Service**
3. Connect the GitHub repo you just created
4. Settings:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
5. Under **Environment**, add:
   - `STRIPE_SECRET_KEY` = your `sk_test_...` key
   - (optional) `ALLOWED_ORIGINS` = the URL(s) your fundmyhope.html is served from
6. Click **Create Web Service** and wait for it to deploy
7. Once live, Render gives you a URL like `https://fundmyhope-server.onrender.com`
   — copy this, you'll need it for the frontend

Note: Render's free tier spins down after inactivity, so the first
donation after a quiet period may take ~30–60 seconds to respond while
it wakes back up. That's normal on the free tier.

## 4. Wire it into the frontend

In `fundmyhope.html`, find these two lines near the top of the `<script>`
block:

```js
var API_BASE = null;
var STRIPE_PUBLISHABLE_KEY = null;
```

Replace them with your actual values:

```js
var API_BASE = 'https://fundmyhope-server.onrender.com/api';
var STRIPE_PUBLISHABLE_KEY = 'pk_test_...'; // your publishable key
```

Save, reload the page, and donations will now go through Stripe in
test mode. Use card number `4242 4242 4242 4242`, any future expiry,
any CVC, and any ZIP to test a successful charge.

## Going live later

When you're ready to accept real cards: switch Test mode off in
Stripe, grab your **live** keys, update `STRIPE_SECRET_KEY` in Render
and `STRIPE_PUBLISHABLE_KEY` in the frontend, and set `ALLOWED_ORIGINS`
to your real site's URL so only your site can call this server.
