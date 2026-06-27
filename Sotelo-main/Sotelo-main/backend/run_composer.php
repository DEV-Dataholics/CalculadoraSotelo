<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
putenv('COMPOSER_HOME=' . __DIR__ . '/.composer');
$output = shell_exec('/opt/cpanel/ea-php83/root/usr/bin/php composer.phar install --no-dev 2>&1');
if (!$output) {
    $output = shell_exec('php composer.phar install --no-dev 2>&1');
}
echo "<pre>$output</pre>";
echo "Done";
?>
