<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

try {
    require 'backend/public/index.php';
} catch (Throwable $e) {
    echo "Caught exception: " . $e->getMessage() . "<br>";
    echo nl2br($e->getTraceAsString());
}
?>
