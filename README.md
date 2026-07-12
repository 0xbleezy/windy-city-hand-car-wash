# Windy City Hand Car Wash — website

A single-page site for Windy City Hand Car Wash (North Avenue & Fullerton, Chicago).
Plain static HTML/CSS with a little JavaScript — no build step, no dependencies.

```
index.html      # the whole page
styles.css      # all styling
images/         # real photos + logo
```

## Deploy to Vercel (via GitHub)

1. **Create a GitHub repo** at https://github.com/new (e.g. `windy-city-hand-car-wash`). Leave it empty (no README).

2. **Push this folder** (run these in the project folder):
   ```bash
   git remote add origin https://github.com/<your-username>/windy-city-hand-car-wash.git
   git branch -M main
   git push -u origin main
   ```

3. **Connect Vercel:** go to https://vercel.com → **Add New… → Project** → **Import** your GitHub repo → **Deploy**.
   - No settings to change — it's a static site (Framework Preset: *Other*).
   - You'll get a live URL like `windy-city-hand-car-wash.vercel.app`.

4. **Future edits:** change a file, `git commit`, `git push` — Vercel redeploys automatically.

## Online booking (Stripe)

Booking runs on **Stripe Payment Links** (no server needed). To turn it on:

1. Create a free account at https://stripe.com
2. In the Dashboard → **Payment Links**, create one link per service (each wash × vehicle size, plus each detailing service). Turn on phone collection / custom fields (e.g. "Preferred day/time", "Location") if you want them at checkout.
3. Paste each link URL into the `STRIPE_LINKS` block near the bottom of `index.html` (there's a step-by-step comment right above it).

Until links are added, the booking button shows a "call the shop" message.

## Things to confirm

- **Fullerton phone** — listed as (773) 252-2400; double-check.
- **Detailing / Ultimate prices** came from the way.com listing and may include booking markup — verify against your in-shop prices.
