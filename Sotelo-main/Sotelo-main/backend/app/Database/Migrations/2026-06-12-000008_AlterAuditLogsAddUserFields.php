<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AlterAuditLogsAddUserFields extends Migration
{
    public function up(): void
    {
        $this->forge->addColumn('audit_logs', [
            'user_id' => [
                'type'       => 'INT',
                'constraint' => 11,
                'unsigned'   => true,
                'null'       => true,
                'default'    => null,
                'after'      => 'id',
            ],
            'before_json' => [
                'type'    => 'JSON',
                'null'    => true,
                'default' => null,
                'after'   => 'details',
            ],
            'after_json' => [
                'type'    => 'JSON',
                'null'    => true,
                'default' => null,
                'after'   => 'before_json',
            ],
        ]);

        // FK opcional — no bloquea si se borra el usuario, conserva el audit trail
        $this->db->query('ALTER TABLE audit_logs ADD CONSTRAINT fk_audit_logs_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE');
    }

    public function down(): void
    {
        $this->db->query('ALTER TABLE audit_logs DROP FOREIGN KEY fk_audit_logs_user_id');
        $this->forge->dropColumn('audit_logs', ['user_id', 'before_json', 'after_json']);
    }
}
