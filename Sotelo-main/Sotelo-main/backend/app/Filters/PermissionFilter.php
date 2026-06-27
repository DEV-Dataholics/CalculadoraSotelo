<?php

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

class PermissionFilter implements FilterInterface
{
    /**
     * Se usa como: $routes->post('...', '...', ['filter' => 'permission:liquidacion.upload'])
     * $arguments contendrá ['liquidacion.upload']
     */
    public function before(RequestInterface $request, $arguments = null): ResponseInterface|null
    {
        $required = $arguments[0] ?? null;
        if (!$required) {
            return null;
        }

        $userPermissions = (array) ($request->user['permissions'] ?? []);

        if (!in_array($required, $userPermissions, true)) {
            return service('response')
                ->setStatusCode(403)
                ->setJSON(['error' => "Permiso requerido: {$required}"]);
        }

        return null;
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null): ResponseInterface|null
    {
        return null;
    }
}
