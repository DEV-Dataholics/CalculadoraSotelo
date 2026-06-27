<?php
// Router para el servidor embebido de PHP.
// Uso (desde la raíz del proyecto, con el frontend ya compilado):
//   cd frontend && npm run build && cd ..
//   php -S localhost:8080 -t frontend/dist router.php

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

// Rutas /api/* → backend CodeIgniter 4
if (strpos($uri, '/api/') === 0) {
    $_SERVER['SCRIPT_NAME'] = '/index.php';
    require __DIR__ . '/backend/public/index.php';
    exit;
}

// Archivos estáticos del build del frontend
if ($uri !== '/' && file_exists(__DIR__ . '/frontend/dist' . $uri)) {
    return false;
}

// SPA fallback: servir index.html del build para el resto de rutas
require __DIR__ . '/frontend/dist/index.html';
