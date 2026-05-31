<?php
require __DIR__ . '/bootstrap.php';
// POST /api/session.php — generate a unique satsdan_ referral ID and create the DB record
require __DIR__ . '/helpers.php';
require __DIR__ . '/db.php';

cors_headers();
require_post();

$ip  = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$ua  = substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 512);
$cfg = get_config();
$pdo = get_pdo();

// rate limit: max N new sessions per IP per hour
$rate = $pdo->prepare("SELECT COUNT(*) FROM claims WHERE ip = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)");
$rate->execute([$ip]);
if ((int) $rate->fetchColumn() >= $cfg['rate_limit_hour']) {
    json_err('Too many requests — please try again later.', 429);
}

// generate a collision-free satsdan_ ID
$attempts = 0;
do {
    if (++$attempts > 10) json_err('Could not generate session. Please retry.', 503);
    $sid = 'satsdan_' . bin2hex(random_bytes(6));
    $chk = $pdo->prepare("SELECT id FROM claims WHERE session_id = ?");
    $chk->execute([$sid]);
} while ($chk->rowCount() > 0);

$pdo->prepare("INSERT INTO claims (session_id, ip, user_agent, created_at) VALUES (?, ?, ?, NOW())")
    ->execute([$sid, $ip, $ua]);

json_out(['session_id' => $sid]);
