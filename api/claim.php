<?php
require __DIR__ . '/bootstrap.php';
// POST /api/claim.php — roll sats server-side, persist amount, send via bot API
require __DIR__ . '/helpers.php';
require __DIR__ . '/db.php';

cors_headers();
require_post();

$input      = json_decode(file_get_contents('php://input'), true) ?? [];
$sid        = trim($input['session_id'] ?? '');
$generosity = $input['generosity'] ?? 'balanced';

if (!valid_session_id($sid)) json_err('Invalid session ID.');
if (!in_array($generosity, ['stingy', 'balanced', 'generous'], true)) $generosity = 'balanced';

$pdo = get_pdo();
$row = $pdo->prepare("SELECT status, telegram_id, telegram_username, email, amount, tier, tx_hash FROM claims WHERE session_id = ?");
$row->execute([$sid]);
$claim = $row->fetch();

if (!$claim) json_err('Session not found.', 404);

// idempotent — return what was already sent
if (in_array($claim['status'], ['claimed', 'sent'], true)) {
    json_out([
        'amount'          => (int) $claim['amount'],
        'tier'            => $claim['tier'],
        'tx_hash'         => $claim['tx_hash'],
        'already_claimed' => true,
    ]);
}

if ($claim['status'] !== 'luma_verified') {
    json_err('Complete all steps before claiming.');
}

if (empty($claim['telegram_username'])) {
    json_err('No Telegram username on record — cannot send sats.');
}

// one claim per Telegram user — check for any prior completed claim on this telegram_id
if (!empty($claim['telegram_id'])) {
    $dup = $pdo->prepare(
        "SELECT id FROM claims
          WHERE telegram_id = ? AND status IN ('claimed','sent') AND session_id <> ?
          LIMIT 1"
    );
    $dup->execute([$claim['telegram_id'], $sid]);
    if ($dup->fetch()) {
        json_err('This Telegram account has already claimed sats from this faucet.', 409);
    }
}

// roll the amount server-side (frontend drives the animation but trusts this result)
$result = roll_sats($generosity);
$amount = $result['amt'];
$tier   = $result['tier'];

// mark as claimed first to prevent race-condition double-claim
// the DB UNIQUE KEY on telegram_id is the hard safety net
$upd = $pdo->prepare(
    "UPDATE claims
        SET amount = ?, tier = ?, claimed_at = NOW(), status = 'claimed'
      WHERE session_id = ? AND status = 'luma_verified'"
);
$upd->execute([$amount, $tier, $sid]);

if ($upd->rowCount() === 0) {
    // lost the race — fetch what the winner stored
    $row->execute([$sid]);
    $claim = $row->fetch();
    json_out([
        'amount'          => (int) $claim['amount'],
        'tier'            => $claim['tier'],
        'tx_hash'         => $claim['tx_hash'],
        'already_claimed' => true,
    ]);
}

// send sats — use session_id as memo (idempotency key for the bot)
$send = bot_post('/api/v1/send', [
    'to'     => $claim['telegram_username'],
    'amount' => $amount,
    'memo'   => $sid,
]);

$tx_hash = $send['transaction_hash'] ?? null;
$sent    = ($send['_status'] === 200) && !empty($send['success']);

if (!$sent) {
    $raw = $send['_raw'] ?? ($send['error'] ?? ($send['message'] ?? 'unknown'));
    log_error('claim', 'Bot send failed', ['session' => $sid, 'status' => $send['_status'], 'response' => $raw, 'amount' => $amount]);
}

if ($sent) {
    $pdo->prepare("UPDATE claims SET tx_hash = ?, status = 'sent', sent_at = NOW() WHERE session_id = ?")
        ->execute([$tx_hash, $sid]);
}

json_out([
    'amount'  => $amount,
    'tier'    => $tier,
    'tx_hash' => $tx_hash,
    'sent'    => $sent,
]);
