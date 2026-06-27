<?php
$host = 'localhost';
$user = 'noodluis_DEV_SC';
$pass = 'h5%Rj_lj$=_w';
$db = 'noodluis_CalSotelo';

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    echo "Connection failed: " . $conn->connect_error;
} else {
    echo "Connection successful!";
}
$conn->close();
?>
