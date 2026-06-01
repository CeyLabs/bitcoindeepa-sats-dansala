<?php
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/helpers.php';

// GET /api/config-public.php — exposes non-sensitive config to the frontend
header('Content-Type: application/json; charset=utf-8');
$origin = get_config()['cors_origin'];
header('Access-Control-Allow-Origin: ' . $origin);

$cfg = get_config();
echo json_encode([
    'tiers'          => $cfg['tiers'],
    'max_amount'     => (int) $cfg['max_amount'],
    'generosity'     => $cfg['generosity'] ?? 'balanced',
    'claims_paused'  => (bool) ($cfg['claims_paused'] ?? false),
    'claims_paused_msg' => $cfg['claims_paused_msg'] ?? 'The faucet is resting — our lanterns are being refilled. Check back in a little while!',
]);
