<?php

namespace App\Models;

use CodeIgniter\Model;

class RefreshTokenModel extends Model
{
    protected $table      = 'refresh_tokens';
    protected $primaryKey = 'id';
    protected $returnType = 'array';

    protected $allowedFields = ['user_id', 'token_hash', 'expires_at', 'revoked_at'];

    protected $useTimestamps = false;

    public function store(int $userId, string $tokenHash, string $expiresAt): void
    {
        $this->insert([
            'user_id'    => $userId,
            'token_hash' => $tokenHash,
            'expires_at' => $expiresAt,
            'created_at' => date('Y-m-d H:i:s'),
        ]);
    }

    public function findValid(string $tokenHash): ?array
    {
        return $this->where('token_hash', $tokenHash)
            ->where('revoked_at IS NULL')
            ->where('expires_at >', date('Y-m-d H:i:s'))
            ->first();
    }

    public function revoke(string $tokenHash): void
    {
        $this->where('token_hash', $tokenHash)
            ->set(['revoked_at' => date('Y-m-d H:i:s')])
            ->update();
    }

    public function revokeAllForUser(int $userId): void
    {
        $this->where('user_id', $userId)
            ->where('revoked_at IS NULL')
            ->set(['revoked_at' => date('Y-m-d H:i:s')])
            ->update();
    }
}
