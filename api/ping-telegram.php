<?php
require __DIR__ . '/bootstrap.php';
// POST /api/ping-telegram.php
// Lightweight poll endpoint — called every 5 s by the frontend after the user opens the Telegram bot.
// Calls the referral/lookup API to check whether the satsdan_ code was captured by the bot.
require __DIR__ . '/helpers.php';
require __DIR__ . '/db.php';

cors_headers();
require_post();

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$sid   = trim($input['session_id'] ?? '');

if (!valid_session_id($sid)) json_err('Invalid session ID.');

$pdo = get_pdo();
$row = $pdo->prepare("SELECT status, telegram_username FROM claims WHERE session_id = ?");
$row->execute([$sid]);
$claim = $row->fetch();
if (!$claim) json_err('Session not found.', 404);

// already verified — return cached result immediately (no bot API call)
if ($claim['status'] !== 'pending') {
    json_out(['verified' => true, 'username' => $claim['telegram_username']]);
}

// call the referral lookup API
$query = 'code=' . urlencode($sid);
$data  = bot_get('/api/v1/referral/lookup', $query);

if ($data['_status'] === 0) {
    log_error('ping-telegram', 'Bot API unreachable', ['session' => $sid]);
    json_out(['verified' => false, 'message' => 'Bot API unreachable — retrying…']);
}
if ($data['_status'] === 401) {
    log_error('ping-telegram', 'HMAC 401 — wrong secret', ['session' => $sid, 'status' => 401]);
    json_out(['verified' => false, 'message' => 'Bot API: invalid HMAC signature — check hmac_secret in config.php']);
}
if ($data['_status'] !== 200) {
    $raw = $data['_raw'] ?? ($data['error'] ?? 'unknown error');
    log_error('ping-telegram', 'Bot API error', ['session' => $sid, 'status' => $data['_status'], 'response' => $raw]);
    json_out(['verified' => false, 'message' => "Bot API error {$data['_status']}: $raw"]);
}

if (empty($data['users'])) {
    json_out(['verified' => false, 'message' => 'Not started yet — open the bot and tap Start.']);
}

// user found — check if this telegram_id has already claimed before saving
$user        = $data['users'][0];
$telegram_id = (int) ($user['telegram_id'] ?? 0);
$username    = $user['username'] ?? '';

$already = $pdo->prepare(
    "SELECT id FROM claims WHERE telegram_id = ? AND status IN ('claimed','sent') LIMIT 1"
);
$already->execute([$telegram_id]);
if ($already->fetch()) {
    json_out(['verified' => false, 'already_claimed' => true, 'message' => 'This Telegram account has already claimed sats from this faucet.']);
}

$pdo->prepare(
    "UPDATE claims
        SET telegram_id = ?, telegram_username = ?, telegram_verified_at = NOW(), status = 'telegram_verified'
      WHERE session_id = ? AND status = 'pending'"
)->execute([$telegram_id, $username, $sid]);

json_out(['verified' => true, 'username' => $username]);
