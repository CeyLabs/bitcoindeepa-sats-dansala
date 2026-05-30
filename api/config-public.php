<?php
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/helpers.php';

// GET /api/config-public.php — exposes non-sensitive config to the frontend
header('Content-Type: application/json; charset=utf-8');
$origin = get_config()['cors_origin'];
header('Access-Control-Allow-Origin: ' . $origin);

$cfg = get_config();
echo json_encode(['tiers' => $cfg['tiers'], 'max_amount' => (int) $cfg['max_amount']]);
