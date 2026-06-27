<?php

namespace App\Filters;

use App\Libraries\JwtService;
use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

class AuthFilter implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null): ResponseInterface|null
    {
        $header = $request->getHeaderLine('Authorization');

        if (!str_starts_with($header, 'Bearer ')) {
            return service('response')
                ->setStatusCode(401)
                ->setJSON(['error' => 'Token requerido.']);
        }

        $token   = substr($header, 7);
        $jwt     = new JwtService();
        $payload = $jwt->validateAccessToken($token);

        if (!$payload) {
            return service('response')
                ->setStatusCode(401)
                ->setJSON(['error' => 'Token inválido o expirado.']);
        }

        // Inyectar payload en la request para uso posterior en controllers/filtros
        $request->user = (array) $payload;

        return null;
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null): ResponseInterface|null
    {
        return null;
    }
}
