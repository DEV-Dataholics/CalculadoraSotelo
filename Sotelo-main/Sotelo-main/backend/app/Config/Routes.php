<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */
$routes->get('/', 'Home::index');

// CORS preflight — responde 204 para todas las rutas API
$routes->options('api/(:any)', static function () {
    return service('response')->setStatusCode(204);
});
$routes->options('api/v1/(:any)', static function () {
    return service('response')->setStatusCode(204);
});

// ─── API LEGADO /api/* ────────────────────────────────────────────────────────
// Sin autenticación durante la transición. Se migra al final de Fase 1.
$routes->group('api', static function (RouteCollection $routes): void {
    $routes->post('upload', 'UploadController::process');
    $routes->post('calculate', 'CalculateController::recalculate');

    $routes->get('catalogs/rendimientos', 'CatalogController::rendimientos');
    $routes->get('catalogs/rutas', 'CatalogController::rutas');
    $routes->get('catalogs/keywords', 'CatalogController::keywords');

    $routes->get('tabulador', 'TabuladorController::consultar');
    $routes->get('tabulador/versiones', 'TabuladorController::versiones');
    $routes->post('tabulador/upload', 'TabuladorController::upload');
    $routes->post('tabulador/activar', 'TabuladorController::activar');
    $routes->post('tabulador/desactivar', 'TabuladorController::desactivar');
    $routes->delete('tabulador/version/(:num)', 'TabuladorController::eliminarVersion/$1');

    $routes->group('admin', static function (RouteCollection $routes): void {
        $routes->get('unidades', 'Admin\\UnidadesController::index');
        $routes->get('unidades/(:num)', 'Admin\\UnidadesController::show/$1');
        $routes->post('unidades', 'Admin\\UnidadesController::create');
        $routes->put('unidades/(:num)', 'Admin\\UnidadesController::update/$1');
        $routes->delete('unidades/(:num)', 'Admin\\UnidadesController::delete/$1');

        $routes->get('rutas', 'Admin\\RutasController::index');
        $routes->get('rutas/(:num)', 'Admin\\RutasController::show/$1');
        $routes->post('rutas', 'Admin\\RutasController::create');
        $routes->put('rutas/(:num)', 'Admin\\RutasController::update/$1');
        $routes->delete('rutas/(:num)', 'Admin\\RutasController::delete/$1');

        $routes->get('keywords', 'Admin\\KeywordsController::index');
        $routes->get('keywords/(:num)', 'Admin\\KeywordsController::show/$1');
        $routes->post('keywords', 'Admin\\KeywordsController::create');
        $routes->put('keywords/(:num)', 'Admin\\KeywordsController::update/$1');
        $routes->delete('keywords/(:num)', 'Admin\\KeywordsController::delete/$1');

        $routes->get('tabulador', 'Admin\\TabuladorAdminController::index');
        $routes->get('tabulador/(:num)', 'Admin\\TabuladorAdminController::show/$1');
        $routes->post('tabulador', 'Admin\\TabuladorAdminController::create');
        $routes->put('tabulador/(:num)', 'Admin\\TabuladorAdminController::update/$1');
        $routes->delete('tabulador/(:num)', 'Admin\\TabuladorAdminController::delete/$1');

        $routes->get('audit-logs', 'Admin\\AuditController::index');
    });
});

// ─── API v1 /api/v1/* ────────────────────────────────────────────────────────
// Todo el grupo requiere auth. Rutas individuales agregan permission donde aplica.
$routes->group('api/v1', ['filter' => 'auth'], static function (RouteCollection $routes): void {

    // Auth — login no requiere auth previo; el grupo lo aplica, pero login es excepción.
    // Por eso auth/* se registran ANTES de aplicar el filtro global al resto.
    // (CI4 aplica el filtro del grupo a todas las rutas del grupo, incluido login —
    //  la solución es mover auth/* fuera del grupo protegido)
});

// Auth — sin filtro (son las rutas públicas de auth)
$routes->post('api/v1/auth/login',   'AuthController::login');
$routes->post('api/v1/auth/refresh', 'AuthController::refresh');
$routes->post('api/v1/auth/logout',  'AuthController::logout', ['filter' => 'auth']);
$routes->get('api/v1/auth/me',       'AuthController::me',     ['filter' => 'auth']);

// Nómina — requieren auth + permiso específico
$routes->post('api/v1/upload',
    'UploadController::process',
    ['filter' => ['auth', 'permission:liquidacion.upload']]);

$routes->post('api/v1/calculate',
    'CalculateController::recalculate',
    ['filter' => ['auth', 'permission:liquidacion.calculate']]);

// Catálogos — requieren auth + catalog.view
$routes->get('api/v1/catalogs/rendimientos',
    'CatalogController::rendimientos',
    ['filter' => ['auth', 'permission:catalog.view']]);

$routes->get('api/v1/catalogs/rutas',
    'CatalogController::rutas',
    ['filter' => ['auth', 'permission:catalog.view']]);

$routes->get('api/v1/catalogs/keywords',
    'CatalogController::keywords',
    ['filter' => ['auth', 'permission:catalog.view']]);

$routes->get('api/v1/tabulador',
    'TabuladorController::consultar',
    ['filter' => ['auth', 'permission:catalog.view']]);

$routes->get('api/v1/tabulador/versiones',
    'TabuladorController::versiones',
    ['filter' => ['auth', 'permission:catalog.view']]);

// Tabulador admin — catalog.manage
$routes->post('api/v1/tabulador/upload',
    'TabuladorController::upload',
    ['filter' => ['auth', 'permission:catalog.manage']]);

$routes->post('api/v1/tabulador/activar',
    'TabuladorController::activar',
    ['filter' => ['auth', 'permission:catalog.manage']]);

$routes->post('api/v1/tabulador/desactivar',
    'TabuladorController::desactivar',
    ['filter' => ['auth', 'permission:catalog.manage']]);

$routes->delete('api/v1/tabulador/version/(:num)',
    'TabuladorController::eliminarVersion/$1',
    ['filter' => ['auth', 'permission:catalog.manage']]);

// Admin CRUD — catalog.manage
foreach (['unidades', 'rutas', 'keywords'] as $resource) {
    $routes->get("api/v1/admin/{$resource}",
        "Admin\\" . ucfirst($resource) . "Controller::index",
        ['filter' => ['auth', 'permission:catalog.view']]);

    $routes->get("api/v1/admin/{$resource}/(:num)",
        "Admin\\" . ucfirst($resource) . "Controller::show/$1",
        ['filter' => ['auth', 'permission:catalog.view']]);

    $routes->post("api/v1/admin/{$resource}",
        "Admin\\" . ucfirst($resource) . "Controller::create",
        ['filter' => ['auth', 'permission:catalog.manage']]);

    $routes->put("api/v1/admin/{$resource}/(:num)",
        "Admin\\" . ucfirst($resource) . "Controller::update/$1",
        ['filter' => ['auth', 'permission:catalog.manage']]);

    $routes->delete("api/v1/admin/{$resource}/(:num)",
        "Admin\\" . ucfirst($resource) . "Controller::delete/$1",
        ['filter' => ['auth', 'permission:catalog.manage']]);
}

// Tabulador admin CRUD
$routes->get('api/v1/admin/tabulador',
    'Admin\\TabuladorAdminController::index',
    ['filter' => ['auth', 'permission:catalog.view']]);

$routes->get('api/v1/admin/tabulador/(:num)',
    'Admin\\TabuladorAdminController::show/$1',
    ['filter' => ['auth', 'permission:catalog.view']]);

$routes->post('api/v1/admin/tabulador',
    'Admin\\TabuladorAdminController::create',
    ['filter' => ['auth', 'permission:catalog.manage']]);

$routes->put('api/v1/admin/tabulador/(:num)',
    'Admin\\TabuladorAdminController::update/$1',
    ['filter' => ['auth', 'permission:catalog.manage']]);

$routes->delete('api/v1/admin/tabulador/(:num)',
    'Admin\\TabuladorAdminController::delete/$1',
    ['filter' => ['auth', 'permission:catalog.manage']]);

// Auditoría
$routes->get('api/v1/admin/audit-logs',
    'Admin\\AuditController::index',
    ['filter' => ['auth', 'permission:audit.view']]);

// Exclusiones de pago base — catalog.manage
$routes->get('api/v1/admin/exclusiones',
    'Admin\\ExclusionesController::index',
    ['filter' => ['auth', 'permission:catalog.view']]);

$routes->post('api/v1/admin/exclusiones',
    'Admin\\ExclusionesController::create',
    ['filter' => ['auth', 'permission:catalog.manage']]);

$routes->put('api/v1/admin/exclusiones/(:num)',
    'Admin\\ExclusionesController::update/$1',
    ['filter' => ['auth', 'permission:catalog.manage']]);

$routes->delete('api/v1/admin/exclusiones/(:num)',
    'Admin\\ExclusionesController::delete/$1',
    ['filter' => ['auth', 'permission:catalog.manage']]);

// Gestión de usuarios — requieren user.manage
// /roles debe ir ANTES de /(:num) para que no lo intercepte
$routes->get('api/v1/users/roles',
    'UsersController::listRoles',
    ['filter' => ['auth', 'permission:user.manage']]);

$routes->get('api/v1/users',
    'UsersController::index',
    ['filter' => ['auth', 'permission:user.manage']]);

$routes->post('api/v1/users',
    'UsersController::create',
    ['filter' => ['auth', 'permission:user.manage']]);

$routes->put('api/v1/users/(:num)',
    'UsersController::update/$1',
    ['filter' => ['auth', 'permission:user.manage']]);

$routes->delete('api/v1/users/(:num)',
    'UsersController::delete/$1',
    ['filter' => ['auth', 'permission:user.manage']]);
