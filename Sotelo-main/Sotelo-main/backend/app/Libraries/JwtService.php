<?php

namespace App\Libraries;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\SignatureInvalidException;

class JwtService
{
    private string $secret;
    private string $algo = 'HS256';
    private int $accessTtl  = 900;    // 15 minutos
    private int $refreshTtl = 604800; // 7 días

    public function __construct()
    {
        $this->secret = (string) env('JWT_SECRET', '');
        if (strlen($this->secret) < 32) {
            throw new \RuntimeException('JWT_SECRET debe tener al menos 32 caracteres.');
        }
    }

    public function issueAccessToken(array $user, array $permissions): string
    {
        $now = time();
        $payload = [
            'iss'         => base_url(),
            'sub'         => (int) $user['id'],
            'email'       => $user['email'],
            'permissions' => $permissions,
            'iat'         => $now,
            'exp'         => $now + $this->accessTtl,
        ];

        return JWT::encode($payload, $this->secret, $this->algo);
    }

    public function issueRefreshToken(): string
    {
        return bin2hex(random_bytes(40));
    }

    public function hashRefreshToken(string $token): string
    {
        return hash('sha256', $token);
    }

    public function refreshExpiresAt(): string
    {
        return date('Y-m-d H:i:s', time() + $this->refreshTtl);
    }

    /**
     * Valida un access token y retorna el payload, o null si es inválido/expirado.
     */
    public function validateAccessToken(string $token): ?object
    {
        try {
            return JWT::decode($token, new Key($this->secret, $this->algo));
        } catch (ExpiredException | SignatureInvalidException | \Exception) {
            return null;
        }
    }
}
