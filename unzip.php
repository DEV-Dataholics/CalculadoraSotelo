<?php
$zip = new ZipArchive;
$res = $zip->open('vendor2.zip');
if ($res === TRUE) {
    if (!is_dir('backend/vendor')) {
        mkdir('backend/vendor', 0755, true);
    }
    $zip->extractTo('backend/vendor/');
    $zip->close();
    echo 'vendor extracted successfully';
} else {
    echo 'vendor extraction failed';
}
?>
