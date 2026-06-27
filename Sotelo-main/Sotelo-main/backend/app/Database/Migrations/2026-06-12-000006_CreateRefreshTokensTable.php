<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateRefreshTokensTable extends Migration
{
    public function up(): void
    {
        $this->forge->addField([
            'id' => [
                'type'           => 'INT',
                'constraint'     => 11,
                'unsigned'       => true,
                'auto_increment' => true,
            ],
            'user_id' => [
                'type'     => 'INT',
                'constraint' => 11,
                'unsigned' => true,
                'null'     => false,
            ],
            'token_hash' => [
                'type'       => 'VARCHAR',
                'constraint' => 255,
                'null'       => false,
            ],
            'expires_at' => [
                'type' => 'DATETIME',
                'null' => false,
            ],
            'revoked_at' => [
                'type'    => 'DATETIME',
                'null'    => true,
                'default' => null,
            ],
            'created_at' => [
                'type' => 'DATETIME',
                'null' => false,
            ],
        ]);

        $this->forge->addKey('id', true);
        $this->forge->addKey('token_hash');
        $this->forge->addKey('user_id');
        $this->forge->addForeignKey('user_id', 'users', 'id', 'CASCADE', 'CASCADE');
        $this->forge->createTable('refresh_tokens');
    }

    public function down(): void
    {
        $this->forge->dropTable('refresh_tokens', true);
    }
}
