<?php
// ── Sats Dansala — central configuration ─────────────────────────────────────
// Copy this file to config.php and fill in real values.
return [

    // ── Database ──────────────────────────────────────────────────────────────
    'db' => [
        'host'    => 'localhost',
        'name'    => 'sats_dansala',
        'user'    => 'sats_dansala',
        'pass'    => 'YOUR_DB_PASSWORD',
        'charset' => 'utf8mb4',
    ],

    // ── Bitcoin Deepa Bot API (referral + send) ───────────────────────────────
    'referral_api' => [
        'base_url'    => 'https://bitcoindeepa.com',   // no trailing slash
        'hmac_secret' => 'YOUR_HMAC_SECRET',
        'wallet'      => 'YOUR_WALLET_NAME',           // whitelisted wallet name in bot config
    ],

    // ── CORS ──────────────────────────────────────────────────────────────────
    // Set to your frontend origin in production, e.g. 'https://satsdansala.lk'
    'cors_origin' => 'https://your-domain.com',

    // ── Rate limiting ─────────────────────────────────────────────────────────
    'rate_limit_hour' => 500,   // max new sessions per IP per hour

    // ── Payment memo ──────────────────────────────────────────────────────────
    // Memo sent with every bot payment (max 280 chars).
    'memo' => 'Your memo here.',

    // ── Sats roll tables ──────────────────────────────────────────────────────
    // max_amount must match (or be ≤) the bot's max_amount in config.yaml
    'max_amount'  => 100,
    'generosity'  => 'balanced',  // stingy | balanced | generous
    'budget_sats' => 250000,      // faucet stops accepting new claims above this total

    // Each tier: [cumulative_probability, min_sats, max_sats, label]
    // Probabilities must be ascending and the last entry must be exactly 1.0
    'tiers' => [
        'stingy' => [
            [0.78,  1,   49,  'Common'],
            [0.95,  50,  69,  'Generous'],
            [0.992, 70,  89,  'Lucky'],
            [1.0,   90,  100, 'Jackpot'],
        ],
        'balanced' => [
            [0.62,  1,   49,  'Common'],
            [0.88,  50,  69,  'Generous'],
            [0.975, 70,  89,  'Lucky'],
            [1.0,   90,  100, 'Jackpot'],
        ],
        'generous' => [
            [0.45,  1,   49,  'Common'],
            [0.78,  50,  69,  'Generous'],
            [0.95,  70,  89,  'Lucky'],
            [1.0,   90,  100, 'Jackpot'],
        ],
    ],

    // ── Maintenance / send-API outage ─────────────────────────────────────────
    // Set claims_paused to true to disable the claim button site-wide.
    // The message is shown to users in the UI.
    'claims_paused'     => false,
    'claims_paused_msg' => 'The faucet is resting — our lanterns are being refilled. Check back in a little while!',
];
