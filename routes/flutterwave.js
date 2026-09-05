// routes/flutterwave.js
//
// One endpoint the site's donate form calls, after Flutterwave's own
// inline widget (running in the browser, using only your PUBLIC key)
// reports that a charge succeeded:
//   GET /api/flutterwave/verify/:transactionId - confirms the charge
//   actually happened and actually matches what we expect, before the
//   donation is recorded as real.
//
// Unlike Paystack, Flutterwave's inline widget doesn't need a server
// "initialize" call first — it generates its own reference (tx_ref)
// client-side and opens the popup directly with the public key. This
// file only ever runs on your server — never in the browser, never in
// the HTML file, never committed to a public repo. Set
// FLUTTERWAVE_SECRET_KEY as an environment variable on your host
// instead.
//
// Requires Node 18+ (for the built-in fetch). If your server runs an
// older Node version, run `npm install node-fetch` and add
// `const fetch = require('node-fetch');` at the top.

const FLUTTERWAVE_BASE = 'https://api.flutterwave.com/v3';

module.exports = function flutterwaveRoutes(app) {
  app.get('/api/flutterwave/verify/:transactionId', async (req, res) => {
    const { transactionId } = req.params;
    try {
      const response = await fetch(`${FLUTTERWAVE_BASE}/transactions/${encodeURIComponent(transactionId)}/verify`, {
        headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` }
      });
      const data = await response.json();
      if (!data || data.status !== 'success' || !data.data) {
        return res.status(400).json({ status: 'failed' });
      }
      // data.data.status is 'successful', 'pending', or 'failed'.
      // Flutterwave's docs recommend also checking the currency and
      // amount charged actually match what you expected to charge,
      // since a spoofed client could otherwise pass a valid-but-wrong
      // transaction id for a much smaller real charge. Do that check
      // against your own campaign/amount records before trusting this
      // in production — this endpoint reports Flutterwave's own
      // verdict, but the amount match is on you to enforce.
      const ok = data.data.status === 'successful';
      res.json({
        status: ok ? 'success' : 'failed',
        amount: data.data.amount,
        currency: data.data.currency
      });
    } catch (err) {
      console.error('Flutterwave verify failed:', err);
      res.status(500).json({ status: 'failed' });
    }
  });
};
