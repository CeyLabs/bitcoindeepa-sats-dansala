<?php
require __DIR__ . '/bootstrap.php';
// POST /api/claim.php — roll sats server-side, persist amount, send via bot API
require __DIR__ . '/helpers.php';
require __DIR__ . '/db.php';

cors_headers();
require_post();

$input      = json_decode(file_get_contents('php://input'), true) ?? [];
$sid        = trim($input['session_id'] ?? '');
$generosity = get_config()['generosity'] ?? 'balanced';

if (!valid_session_id($sid)) json_err('Invalid session ID.');

$pdo = get_pdo();
$row = $pdo->prepare("SELECT status, telegram_id, telegram_username, email, amount, tier, tx_hash, send_error FROM claims WHERE session_id = ?");
$row->execute([$sid]);
$claim = $row->fetch();

if (!$claim) json_err('Session not found.', 404);

// Already fully sent — return cached success
if ($claim['status'] === 'sent') {
    json_out(['amount' => (int) $claim['amount'], 'tier' => $claim['tier'], 'tx_hash' => $claim['tx_hash'], 'already_claimed' => true]);
}

// Pending admin approval — poll endpoint handles this
if ($claim['status'] === 'pending_approval') {
    json_err('A payment is already pending admin approval for this session.', 409);
}

// Previous send failed (status=claimed, no tx_hash) — retry with the same rolled amount
$is_retry = ($claim['status'] === 'claimed');

if ($is_retry) {
    $amount = (int) $claim['amount'];
    $tier   = $claim['tier'];
} else {
    // Fresh claim — must be luma_verified
    if ($claim['status'] !== 'luma_verified') json_err('Complete all steps before claiming.');
    if (empty($claim['telegram_username']))    json_err('No Telegram username on record — cannot send sats.');

    // One claim per Telegram user
    if (!empty($claim['telegram_id'])) {
        $dup = $pdo->prepare(
            "SELECT id FROM claims
              WHERE telegram_id = ? AND status IN ('claimed','sent') AND session_id <> ?
              LIMIT 1"
        );
        $dup->execute([$claim['telegram_id'], $sid]);
        if ($dup->fetch()) json_err('This Telegram account has already claimed sats from this faucet.', 409);
    }

    // Roll amount server-side
    $result = roll_sats($generosity);
    $amount = $result['amt'];
    $tier   = $result['tier'];

    // Mark as claimed to prevent race-condition double-roll
    $upd = $pdo->prepare(
        "UPDATE claims SET amount = ?, tier = ?, claimed_at = NOW(), status = 'claimed', send_error = NULL
          WHERE session_id = ? AND status = 'luma_verified'"
    );
    $upd->execute([$amount, $tier, $sid]);

    if ($upd->rowCount() === 0) {
        // Lost the race — re-fetch and check winner's result
        $row->execute([$sid]);
        $claim = $row->fetch();
        if ($claim['status'] === 'sent') {
            json_out(['amount' => (int) $claim['amount'], 'tier' => $claim['tier'], 'tx_hash' => $claim['tx_hash'], 'already_claimed' => true]);
        }
        json_err('Claim already in progress — please wait a moment then try again.');
    }
}

$send = bot_post('/api/v1/send', [
    'to'     => $claim['telegram_username'],
    'amount' => $amount,
    'memo'   => get_config()['memo'],
]);

$tx_hash = $send['transaction_hash'] ?? null;
$sent    = ($send['_status'] === 200) && !empty($send['success']);

if ($send['_status'] === 202) {
    $msg   = $send['message'] ?? '';
    $tx_id = null;
    if (preg_match('/Transaction ID:\s*(\S+)/i', $msg, $m)) $tx_id = rtrim($m[1], '.,');
    $pdo->prepare("UPDATE claims SET status = 'pending_approval', pending_tx_id = ?, send_error = NULL WHERE session_id = ?")
        ->execute([$tx_id, $sid]);
    json_out([
        'success'    => false,
        'message'    => $msg,
        'amount'     => $amount,
        'amount_lkr' => $send['amount_lkr'] ?? null,
        'from_user'  => $send['from_user'] ?? null,
        'to_user'    => $send['to_user'] ?? null,
        'memo'       => $sid,
    ], 202);
}

if ($sent) {
    $pdo->prepare("UPDATE claims SET tx_hash = ?, status = 'sent', sent_at = NOW(), send_error = NULL WHERE session_id = ?")
        ->execute([$tx_hash, $sid]);
    json_out(['amount' => $amount, 'tier' => $tier, 'tx_hash' => $tx_hash]);
}

// Bot rejected the send — save error, stay as 'claimed' so user can retry
$raw = $send['_raw'] ?? ($send['error'] ?? ($send['message'] ?? 'unknown'));
log_error('claim', 'Bot send failed', ['session' => $sid, 'status' => $send['_status'], 'response' => $raw, 'amount' => $amount]);
$pdo->prepare("UPDATE claims SET send_error = ? WHERE session_id = ?")
    ->execute([substr($raw, 0, 500), $sid]);
json_err($raw, 400);
