-- Sats Dansala — database schema
-- Run once: mysql -u root -p < api/schema.sql

CREATE DATABASE IF NOT EXISTS sats_dansala
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sats_dansala;

CREATE TABLE IF NOT EXISTS claims (
  id                   INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  session_id           VARCHAR(32)     NOT NULL UNIQUE COMMENT 'satsdan_<12hex>',
  ip                   VARCHAR(45)     NOT NULL DEFAULT '',
  user_agent           VARCHAR(512)    DEFAULT NULL,
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

  INDEX idx_ip_hour  (ip, created_at),
  INDEX idx_status   (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
