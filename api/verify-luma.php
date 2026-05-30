<?php
require __DIR__ . '/bootstrap.php';
// POST /api/verify-luma.php — save the subscriber email and mark luma_verified
require __DIR__ . '/helpers.php';
require __DIR__ . '/db.php';

cors_headers();
require_post();

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$sid   = trim($input['session_id'] ?? '');
$email = strtolower(trim($input['email'] ?? ''));

if (!valid_session_id($sid))                       json_err('Invalid session ID.');
if (!filter_var($email, FILTER_VALIDATE_EMAIL))    json_err('Enter the email you used to subscribe on Luma.');

$pdo = get_pdo();
$row = $pdo->prepare("SELECT status FROM claims WHERE session_id = ?");
$row->execute([$sid]);
$claim = $row->fetch();

if (!$claim)                           json_err('Session not found.', 404);
if ($claim['status'] === 'pending')    json_err('Please verify your Telegram bot first.');

// idempotent — already done
if (in_array($claim['status'], ['luma_verified', 'claimed', 'sent'], true)) {
    json_out(['verified' => true]);
}

if ($claim['status'] !== 'telegram_verified') {
    json_err('Unexpected session state.');
}

$pdo->prepare(
    "UPDATE claims
        SET email = ?, luma_verified_at = NOW(), status = 'luma_verified'
      WHERE session_id = ? AND status = 'telegram_verified'"
)->execute([$email, $sid]);

json_out(['verified' => true]);
