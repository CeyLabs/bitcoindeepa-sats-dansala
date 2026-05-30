<?php
require __DIR__ . '/bootstrap.php';
// GET /api/health.php — checks DB connection and bot API reachability
// Delete or restrict this file after debugging.

require __DIR__ . '/helpers.php';

header('Content-Type: application/json; charset=utf-8');

$cfg    = get_config();
$report = [];

// ── 1. Database ───────────────────────────────────────────────────────────────
try {
    require __DIR__ . '/db.php';
    $pdo = get_pdo();
    $pdo->query("SELECT 1");
    $count = (int) $pdo->query("SELECT COUNT(*) FROM claims")->fetchColumn();
    $report['db'] = ['ok' => true, 'claims_rows' => $count];
} catch (Throwable $e) {
    $report['db'] = ['ok' => false, 'error' => $e->getMessage()];
}

// ── 2. Bot API — referral lookup (unauthenticated ping style) ─────────────────
// We sign a real request for a dummy code so we get a real auth response,
// not a network error. A 400 "missing code" or 401 still means the host is up.
$path  = '/api/v1/referral/lookup';
$query = 'code=health_check';
$ts    = time();
$msg   = 'GET' . $path . $ts;
$sig   = hash_hmac('sha256', $msg, $cfg['referral_api']['hmac_secret']);
$url   = $cfg['referral_api']['base_url'] . $path . '?' . $query;

$ctx = stream_context_create(['http' => [
    'method'        => 'GET',
    'header'        => "X-Timestamp: $ts\r\nX-HMAC-Signature: $sig\r\n",
    'timeout'       => 8,
    'ignore_errors' => true,
]]);

$t0   = microtime(true);
$body = @file_get_contents($url, false, $ctx);
$ms   = (int) ((microtime(true) - $t0) * 1000);

if ($body === false) {
    $report['bot_api'] = [
        'ok'      => false,
        'url'     => $url,
        'error'   => 'Could not connect — check base_url and firewall/network.',
        'ms'      => $ms,
    ];
} else {
    $http_code = 0;
    foreach ($http_response_header as $h) {
        if (preg_match('#HTTP/\S+\s+(\d+)#', $h, $m)) $http_code = (int) $m[1];
    }
    $decoded = json_decode($body, true);
    // 200 or 400 (bad code param) both mean the host is reachable and auth is working
    $report['bot_api'] = [
        'ok'        => in_array($http_code, [200, 400], true),
        'url'       => $cfg['referral_api']['base_url'],
        'http_code' => $http_code,
        'ms'        => $ms,
        'response'  => $decoded ?? $body,
    ];
}

// ── 3. Config summary (no secrets) ───────────────────────────────────────────
$report['config'] = [
    'bot_base_url'   => $cfg['referral_api']['base_url'],
    'wallet'         => $cfg['referral_api']['wallet'],
    'hmac_secret_set'=> $cfg['referral_api']['hmac_secret'] !== 'REPLACE_WITH_OPENSSL_RAND_HEX_32',
    'db_host'        => $cfg['db']['host'],
    'db_name'        => $cfg['db']['name'],
    'cors_origin'    => $cfg['cors_origin'],
];

$report['overall'] = $report['db']['ok'] && $report['bot_api']['ok'];

http_response_code($report['overall'] ? 200 : 503);
echo json_encode($report, JSON_PRETTY_PRINT);
