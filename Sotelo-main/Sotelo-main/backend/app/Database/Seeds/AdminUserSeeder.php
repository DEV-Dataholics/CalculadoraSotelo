<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $email    = env('ADMIN_EMAIL', 'admin@sotelo.local');
        $password = env('ADMIN_PASSWORD', 'Admin1234!');

        if ($this->db->table('users')->where('email', $email)->countAllResults()) {
            return;
        }

        $now = date('Y-m-d H:i:s');

        $this->db->table('users')->insert([
            'email'         => $email,
            'password_hash' => password_hash($password, PASSWORD_ARGON2ID),
            'is_active'     => 1,
            'created_at'    => $now,
            'updated_at'    => $now,
        ]);

        $userId = $this->db->insertID();

        $adminRole = $this->db->table('roles')->where('name', 'admin')->get()->getRowArray();
        if ($adminRole) {
            $this->db->table('user_roles')->insert([
                'user_id' => $userId,
                'role_id' => $adminRole['id'],
            ]);
        }
    }
}
