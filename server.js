// FundMyHope payment server
//
// Uses Flutterwave for donations (server holds the Flutterwave SECRET
// key; the frontend only ever sees the PUBLIC key, embedded in the
// HTML). Withdrawals are manual — this server just emails the team via
// Resend when an organizer requests one; no money moves automatically.

const express = require('express');
const cors = require('cors');

const PORT = process.env.PORT || 3000;

// Comma-separated list of origins allowed to call this server, e.g.
// "https://yoursite.com,http://localhost:5500". Leave unset to allow
// any origin (fine for early testing, tighten before going live).
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(function (s) { return s.trim(); })
  : null;

if (!process.env.FLUTTERWAVE_SECRET_KEY) {
  console.error('Missing FLUTTERWAVE_SECRET_KEY environment variable. Set it in Render → Environment.');
  process.exit(1);
}

const app = express();

app.use(express.json());
app.use(cors({
  origin: ALLOWED_ORIGINS || true,
}));

app.get('/', function (req, res) {
  res.send('FundMyHope payment server is running.');
});

// Wire in the route modules — these register their own endpoints on `app`.
require('./routes/flutterwave')(app);
require('./routes/notify-manual-withdrawal')(app);

app.listen(PORT, function () {
  console.log('FundMyHope payment server listening on port ' + PORT);
});
