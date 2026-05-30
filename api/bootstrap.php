<?php
// Must be the very first include in every API entry point.

define('LOG_FILE', __DIR__ . '/logs/error.log');

$logDir = __DIR__ . '/logs';
if (!is_dir($logDir)) @mkdir($logDir, 0750, true);

// Route ALL PHP errors to our log file
ini_set('log_errors',        '1');
ini_set('error_log',         LOG_FILE);
ini_set('display_errors',    '0');   // never show errors to the browser
ini_set('display_startup_errors', '0');
error_reporting(E_ALL);

// Catch fatal errors that error_reporting misses (E_ERROR, E_PARSE, etc.)
register_shutdown_function(function () {
    $e = error_get_last();
    if ($e && in_array($e['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
        $line = date('Y-m-d H:i:s') . ' | PHP FATAL | '
            . $e['message'] . ' in ' . $e['file'] . ':' . $e['line'];
        @file_put_contents(LOG_FILE, $line . PHP_EOL, FILE_APPEND | LOCK_EX);
    }
});

// Uncaught exception safety net
set_exception_handler(function (Throwable $ex) {
    $line = date('Y-m-d H:i:s') . ' | UNCAUGHT | '
        . get_class($ex) . ': ' . $ex->getMessage()
        . ' in ' . $ex->getFile() . ':' . $ex->getLine();
    @file_put_contents(LOG_FILE, $line . PHP_EOL, FILE_APPEND | LOCK_EX);
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Internal server error']);
});
