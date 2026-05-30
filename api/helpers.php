<?php

function log_error(string $context, string $msg, array $extra = []): void {
    $line = implode(' | ', array_filter([
        date('Y-m-d H:i:s'),
        $context,
        $msg,
        $extra ? json_encode($extra) : '',
    ]));
    @file_put_contents(LOG_FILE, $line . PHP_EOL, FILE_APPEND | LOCK_EX);
}

function get_config(): array {
    static $cfg = null;
    if ($cfg === null) $cfg = require __DIR__ . '/config.php';
    return $cfg;
}

function cors_headers(): void {
    $origin = get_config()['cors_origin'];
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

function require_post(): void {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        exit;
    }
}

function json_out(array $data, int $code = 200): never {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

function json_err(string $msg, int $code = 400): never {
    json_out(['error' => $msg], $code);
}

function valid_session_id(string $id): bool {
    return (bool) preg_match('/^satsdan_[a-f0-9]{12}$/', $id);
}

// ── Bot API helpers ───────────────────────────────────────────────────────────

function _sign(string $method, string $path, string $payload): array {
    $ts  = time();
    $msg = $method . $path . $ts . $payload;
    $sig = hash_hmac('sha256', $msg, get_config()['referral_api']['hmac_secret']);
    return ['ts' => $ts, 'sig' => $sig];
}

// Returns ['_status' => int, ...decoded json...]
// '_status' = 0 means connection failed entirely
function bot_get(string $path, string $query): array {
    $auth = _sign('GET', $path, '');
    $url  = get_config()['referral_api']['base_url'] . $path . ($query !== '' ? '?' . $query : '');
    $ctx  = stream_context_create(['http' => [
        'method'        => 'GET',
        'header'        => "X-Timestamp: {$auth['ts']}\r\nX-HMAC-Signature: {$auth['sig']}\r\n",
        'timeout'       => 10,
        'ignore_errors' => true,
    ]]);
    $resp = @file_get_contents($url, false, $ctx);
    if ($resp === false) return ['_status' => 0];
    $code = _http_code($http_response_header ?? []);
    return array_merge(json_decode($resp, true) ?? ['_raw' => trim($resp)], ['_status' => $code]);
}

function bot_post(string $path, array $body): array {
    $json = json_encode($body);
    $auth = _sign('POST', $path, $json);
    $url  = get_config()['referral_api']['base_url'] . $path;
    $ctx  = stream_context_create(['http' => [
        'method'        => 'POST',
        'header'        => "Content-Type: application/json\r\nX-Timestamp: {$auth['ts']}\r\nX-HMAC-Signature: {$auth['sig']}\r\n",
        'content'       => $json,
        'timeout'       => 15,
        'ignore_errors' => true,
    ]]);
    $resp = @file_get_contents($url, false, $ctx);
    if ($resp === false) return ['_status' => 0];
    $code = _http_code($http_response_header ?? []);
    return array_merge(json_decode($resp, true) ?? ['_raw' => trim($resp)], ['_status' => $code]);
}

function _http_code(array $headers): int {
    $code = 200;
    foreach ($headers as $h) {
        if (preg_match('#HTTP/\S+\s+(\d+)#', $h, $m)) $code = (int) $m[1];
    }
    return $code;
}

// ── Sats roller (mirrors frontend tables so backend is authoritative) ─────────

function roll_sats(string $generosity): array {
    $tables = [
        'stingy'   => [[0.78, 100, 999, 'Common'],  [0.95, 1000, 2499, 'Generous'], [0.992, 2500, 5999, 'Lucky'],  [1.0, 6000, 10000, 'Jackpot']],
        'balanced' => [[0.62, 100, 999, 'Common'],  [0.88, 1000, 2999, 'Generous'], [0.975, 3000, 6999, 'Lucky'],  [1.0, 7000, 10000, 'Jackpot']],
        'generous' => [[0.45, 100, 999, 'Common'],  [0.78, 1000, 3999, 'Generous'], [0.95,  4000, 7499, 'Lucky'],  [1.0, 7500, 10000, 'Jackpot']],
    ];
    $table = $tables[$generosity] ?? $tables['balanced'];
    $r = random_int(0, PHP_INT_MAX) / PHP_INT_MAX;
    foreach ($table as [$thr, $min, $max, $tier]) {
        if ($r <= $thr) return ['amt' => random_int($min, $max), 'tier' => $tier];
    }
    return ['amt' => 210, 'tier' => 'Common'];
}
