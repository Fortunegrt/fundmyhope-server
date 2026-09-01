// FundMyHope payment server
// Holds the Stripe SECRET key and creates PaymentIntents on behalf of
// the frontend. The frontend never sees this key — only its own
// PUBLISHABLE key, which is safe to expose in browser code.

const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');

const PORT = process.env.PORT || 3000;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
// Comma-separated list of origins allowed to call this server, e.g.
// "https://yoursite.com,http://localhost:5500". Leave unset to allow
// any origin (fine for early testing, tighten before going live).
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(function (s) { return s.trim(); })
  : null;

if (!STRIPE_SECRET_KEY) {
  console.error('Missing STRIPE_SECRET_KEY environment variable. Set it in Render → Environment.');
  process.exit(1);
}

const stripe = Stripe(STRIPE_SECRET_KEY);
const app = express();

app.use(express.json());
app.use(cors({
  origin: ALLOWED_ORIGINS || true,
}));

app.get('/', function (req, res) {
  res.send('FundMyHope payment server is running.');
});

// Creates a PaymentIntent for a donation. The frontend calls this first,
// then uses the returned client_secret to confirm the card payment
// itself via Stripe.js — this server never sees raw card details.
app.post('/api/create-payment-intent', async function (req, res) {
  try {
    const amount = Number(req.body.amount);
    const campaignId = req.body.campaignId;

    if (!campaignId || typeof campaignId !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid campaignId.' });
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Invalid donation amount.' });
    }
    // Stripe expects the smallest currency unit (cents for USD).
    const amountInCents = Math.round(amount * 100);
    if (amountInCents < 50) {
      return res.status(400).json({ error: 'Donation amount is too small to process.' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      metadata: { campaignId: campaignId },
      automatic_payment_methods: { enabled: true },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('create-payment-intent error:', err.message);
    res.status(500).json({ error: 'Could not start payment. Please try again.' });
  }
});

app.listen(PORT, function () {
  console.log('FundMyHope payment server listening on port ' + PORT);
});
