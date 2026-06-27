<?php

namespace App\Controllers;

use App\Libraries\JwtService;
use App\Models\RefreshTokenModel;
use App\Models\UserModel;
use CodeIgniter\HTTP\ResponseInterface;

class AuthController extends BaseController
{
    private UserModel $users;
    private RefreshTokenModel $tokens;
    private JwtService $jwt;

    public function __construct()
    {
        $this->users  = new UserModel();
        $this->tokens = new RefreshTokenModel();
        $this->jwt    = new JwtService();
    }

    /**
     * POST /api/v1/auth/login
     * Body: { "email": "...", "password": "..." }
     */
    public function login(): ResponseInterface
    {
        $data = $this->request->getJSON(true);

        $email    = trim((string) ($data['email']    ?? ''));
        $password =       (string) ($data['password'] ?? '');

        if (!$email || !$password) {
            return $this->fail('Credenciales requeridas.', 422);
        }

        $user = $this->users->findByEmail($email);

        if (!$user || !$user['is_active'] || !password_verify($password, $user['password_hash'])) {
            return $this->fail('Credenciales inválidas.', 401);
        }

        $this->users->touchLastLogin((int) $user['id']);
        $full = $this->users->loadWithPermissions((int) $user['id']);

        $access  = $this->jwt->issueAccessToken($full, $full['permissions']);
        $refresh = $this->jwt->issueRefreshToken();

        $this->tokens->store(
            (int) $user['id'],
            $this->jwt->hashRefreshToken($refresh),
            $this->jwt->refreshExpiresAt()
        );

        return $this->respond([
            'access'  => $access,
            'refresh' => $refresh,
            'user'    => $full,
        ]);
    }

    /**
     * POST /api/v1/auth/refresh
     * Body: { "refresh": "..." }
     */
    public function refresh(): ResponseInterface
    {
        $data  = $this->request->getJSON(true);
        $token = (string) ($data['refresh'] ?? '');

        if (!$token) {
            return $this->fail('Refresh token requerido.', 422);
        }

        $record = $this->tokens->findValid($this->jwt->hashRefreshToken($token));
        if (!$record) {
            return $this->fail('Refresh token inválido o expirado.', 401);
        }

        // Rotar: revocar el actual, emitir uno nuevo
        $this->tokens->revoke($this->jwt->hashRefreshToken($token));

        $full     = $this->users->loadWithPermissions((int) $record['user_id']);
        $newAccess  = $this->jwt->issueAccessToken($full, $full['permissions']);
        $newRefresh = $this->jwt->issueRefreshToken();

        $this->tokens->store(
            (int) $record['user_id'],
            $this->jwt->hashRefreshToken($newRefresh),
            $this->jwt->refreshExpiresAt()
        );

        return $this->respond([
            'access'  => $newAccess,
            'refresh' => $newRefresh,
        ]);
    }

    /**
     * POST /api/v1/auth/logout
     * Header: Authorization: Bearer <access>
     * Body:   { "refresh": "..." }
     */
    public function logout(): ResponseInterface
    {
        $data  = $this->request->getJSON(true);
        $token = (string) ($data['refresh'] ?? '');

        if ($token) {
            $this->tokens->revoke($this->jwt->hashRefreshToken($token));
        }

        return $this->respond(null, 204);
    }

    /**
     * GET /api/v1/auth/me
     * Requiere AuthFilter — el usuario ya está en $request->user
     */
    public function me(): ResponseInterface
    {
        $userId = (int) ($this->request->user['sub'] ?? 0);
        if (!$userId) {
            return $this->fail('No autenticado.', 401);
        }

        $user = $this->users->loadWithPermissions($userId);
        if (!$user) {
            return $this->fail('Usuario no encontrado.', 404);
        }

        return $this->respond(['user' => $user]);
    }

    // ─── helpers ────────────────────────────────────────────────────────────

    private function fail(string $message, int $status): ResponseInterface
    {
        return $this->response
            ->setStatusCode($status)
            ->setJSON(['error' => $message]);
    }

    private function respond(mixed $data, int $status = 200): ResponseInterface
    {
        if ($data === null && $status === 204) {
            return $this->response->setStatusCode(204);
        }
        return $this->response->setStatusCode($status)->setJSON($data);
    }
}
