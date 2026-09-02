// routes/notify-manual-withdrawal.js
//
// Drop this into your existing server (the one API_BASE in the site
// points at). Wires up:
//
//   POST /api/notify-manual-withdrawal
//
// which the withdrawal form calls every time an organizer requests a
// withdrawal. This sends YOUR team an email with the payout details —
// PayPal email + tag(s) — so a human can send the money and follow up.
// It does not talk to PayPal or move any money itself.

const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = function notifyManualWithdrawal(app) {
  app.post('/api/notify-manual-withdrawal', async (req, res) => {
    const { campaignId, campaignTitle, amount, organizerId, paypalEmail, tags } = req.body || {};

    if (!paypalEmail || !amount) {
      return res.status(400).json({ error: 'Missing paypalEmail or amount.' });
    }

    try {
      await resend.emails.send({
        from: process.env.NOTIFY_EMAIL_FROM,
        to: (process.env.NOTIFY_EMAIL_TO || '').split(',').map(s => s.trim()).filter(Boolean),
        subject: `Withdrawal request: $${amount} — ${campaignTitle || campaignId}`,
        text: [
          'A withdrawal was requested and needs to be sent manually.',
          '',
          `Campaign: ${campaignTitle || '(untitled)'} (${campaignId})`,
          `Organizer ID: ${organizerId || 'unknown'}`,
          `Amount: $${amount}`,
          `PayPal email: ${paypalEmail}`,
          `Tag(s): ${tags || '(none provided)'}`,
        ].join('\n')
      });
      res.json({ ok: true });
    } catch (err) {
      console.error('Failed to send withdrawal notification email:', err);
      res.status(500).json({ error: 'Could not send notification email.' });
    }
  });
};
