<?php
// Run once to create the database and table:
//   php api/init-db.php
// or open in browser if your server allows it (protect/delete after use).

$cfg = require __DIR__ . '/config.php';

try {
    // connect without a database selected so we can CREATE it
    $pdo = new PDO(
        sprintf('mysql:host=%s;charset=%s', $cfg['db']['host'], $cfg['db']['charset']),
        $cfg['db']['user'],
        $cfg['db']['pass'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $db = $cfg['db']['name'];

    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "✓ Database `$db` ready\n";

    $pdo->exec("USE `$db`");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS claims (
          id                   INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
          session_id           VARCHAR(32)     NOT NULL UNIQUE COMMENT 'satsdan_<12hex>',
          ip                   VARCHAR(45)     NOT NULL DEFAULT '',
          telegram_id          BIGINT          DEFAULT NULL,
          telegram_username    VARCHAR(64)     DEFAULT NULL,
          email                VARCHAR(255)    DEFAULT NULL,
          amount               INT UNSIGNED    DEFAULT NULL,
          tier                 VARCHAR(32)     DEFAULT NULL,
          tx_hash              VARCHAR(255)    DEFAULT NULL,
          status               ENUM(
                                 'pending',
                                 'telegram_verified',
                                 'luma_verified',
                                 'claimed',
                                 'sent'
                               ) NOT NULL DEFAULT 'pending',
          created_at           DATETIME        NOT NULL,
          telegram_verified_at DATETIME        DEFAULT NULL,
          luma_verified_at     DATETIME        DEFAULT NULL,
          claimed_at           DATETIME        DEFAULT NULL,
          sent_at              DATETIME        DEFAULT NULL,
          INDEX idx_ip_hour    (ip, created_at),
          INDEX idx_status     (status),
          INDEX idx_tg_id      (telegram_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "✓ Table `claims` ready\n";
    echo "\nDone. Delete or protect init-db.php now.\n";

} catch (PDOException $e) {
    http_response_code(500);
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
