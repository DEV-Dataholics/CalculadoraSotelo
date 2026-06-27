<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Ejecutar el seeder de exclusiones en producción
$output = shell_exec('/opt/cpanel/ea-php83/root/usr/bin/php spark db:seed ExclusionSeeder 2>&1');
if (!$output) {
    $output = shell_exec('php spark db:seed ExclusionSeeder 2>&1');
}
echo "<pre>$output</pre>";
echo "Done";
?>
