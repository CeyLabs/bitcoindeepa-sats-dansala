<?php
require __DIR__ . '/bootstrap.php';
// POST /api/poll-claim.php
// Called every 10 s by the frontend while a claim is in pending_approval state.
// Polls GET /api/v1/send/status/{transaction_id} on the bot API.
require __DIR__ . '/helpers.php';
require __DIR__ . '/db.php';

cors_headers();
require_post();

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$sid   = trim($input['session_id'] ?? '');

if (!valid_session_id($sid)) json_err('Invalid session ID.');

$pdo = get_pdo();
$row = $pdo->prepare("SELECT status, pending_tx_id, amount, tier, tx_hash FROM claims WHERE session_id = ?");
$row->execute([$sid]);
$claim = $row->fetch();

if (!$claim) json_err('Session not found.', 404);

// already delivered — no bot call needed
if ($claim['status'] === 'sent') {
    json_out(['approved' => true, 'amount' => (int) $claim['amount'], 'tier' => $claim['tier'], 'tx_hash' => $claim['tx_hash']]);
}

if ($claim['status'] !== 'pending_approval') {
    json_err('Claim is not awaiting approval.');
}

if (empty($claim['pending_tx_id'])) {
    json_err('No transaction ID on record — cannot poll status.');
}

$tx_id = $claim['pending_tx_id'];
$path  = '/api/v1/send/status/' . $tx_id;
$data  = bot_get($path, '');

if ($data['_status'] === 0) {
    json_out(['approved' => false, 'waiting' => true, 'message' => 'Bot API unreachable — retrying…']);
}

if ($data['_status'] !== 200) {
    $err = $data['error'] ?? ($data['_raw'] ?? 'unknown');
    log_error('poll-claim', 'Status endpoint error', ['session' => $sid, 'tx_id' => $tx_id, 'status' => $data['_status'], 'error' => $err]);
    json_out(['approved' => false, 'waiting' => false, 'error' => $err]);
}

$txStatus = $data['status'] ?? 'pending';

switch ($txStatus) {
    case 'executed':
        $tx_hash = $data['transaction_hash'] ?? null;
        $pdo->prepare("UPDATE claims SET tx_hash = ?, status = 'sent', sent_at = NOW() WHERE session_id = ?")
            ->execute([$tx_hash, $sid]);
        json_out(['approved' => true, 'amount' => (int) $claim['amount'], 'tier' => $claim['tier'], 'tx_hash' => $tx_hash]);

    case 'rejected':
        json_out(['approved' => false, 'waiting' => false, 'terminal' => 'rejected']);

    case 'expired':
        json_out(['approved' => false, 'waiting' => false, 'terminal' => 'expired']);

    default: // pending | approved (still executing)
        json_out(['approved' => false, 'waiting' => true]);
}
