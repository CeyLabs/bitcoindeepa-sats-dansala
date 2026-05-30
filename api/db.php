<?php
function get_pdo(): PDO {
    static $pdo = null;
    if ($pdo !== null) return $pdo;
    $c = get_config();
    $dsn = sprintf('mysql:host=%s;dbname=%s;charset=%s', $c['db']['host'], $c['db']['name'], $c['db']['charset']);
    $pdo = new PDO($dsn, $c['db']['user'], $c['db']['pass'], [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
    return $pdo;
}
