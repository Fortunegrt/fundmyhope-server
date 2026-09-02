// routes/paystack.js
//
// Two endpoints the site's donate form calls:
//   POST /api/paystack/initialize        - opens a transaction, returns a reference
//   GET  /api/paystack/verify/:reference - confirms the charge actually succeeded
//
// Uses your Paystack SECRET key. This file must only ever run on your
// server — never in the browser, never in the HTML file, never
// committed to a public repo. Set PAYSTACK_SECRET_KEY as an
// environment variable on your host instead.
//
// Requires Node 18+ (for the built-in fetch). If your server runs an
// older Node version, run `npm install node-fetch` and add
// `const fetch = require('node-fetch');` at the top.

const PAYSTACK_BASE = 'https://api.paystack.co';

module.exports = function paystackRoutes(app) {
  app.post('/api/paystack/initialize', async (req, res) => {
    const { campaignId, amount, email } = req.body || {};
    if (!campaignId || !amount || !email) {
      return res.status(400).json({ error: 'Missing campaignId, amount, or email.' });
    }
    try {
      const response = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          amount: Math.round(amount * 100), // Paystack wants the smallest currency unit (kobo/cents)
          currency: 'USD',                  // must be a currency enabled on your Paystack account — see step 8
          metadata: { campaignId }
        })
      });
      const data = await response.json();
      if (!data.status) {
        return res.status(400).json({ error: data.message || 'Could not start payment.' });
      }
      res.json({ reference: data.data.reference });
    } catch (err) {
      console.error('Paystack initialize failed:', err);
      res.status(500).json({ error: 'Could not start payment.' });
    }
  });

  app.get('/api/paystack/verify/:reference', async (req, res) => {
    const { reference } = req.params;
    try {
      const response = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
      });
      const data = await response.json();
      if (!data.status || !data.data) {
        return res.status(400).json({ status: 'failed' });
      }
      // data.data.status is 'success', 'abandoned', or 'failed'
      res.json({ status: data.data.status, amount: data.data.amount / 100 });
    } catch (err) {
      console.error('Paystack verify failed:', err);
      res.status(500).json({ status: 'failed' });
    }
  });
};
