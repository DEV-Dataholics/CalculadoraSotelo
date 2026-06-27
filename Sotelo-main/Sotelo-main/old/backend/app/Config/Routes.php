<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */
$routes->get('/', 'Home::index');

$routes->options('api/(:any)', static function () {
	return service('response')->setStatusCode(204);
});

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
