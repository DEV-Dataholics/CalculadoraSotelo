<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateLiquidacionesTemporales extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type'           => 'INT',
                'constraint'     => 10,
                'unsigned'       => true,
                'auto_increment' => true,
            ],
            'session_token' => [
                'type'       => 'VARCHAR',
                'constraint' => 64,
            ],
            'datos_boleta_json' => [
                'type' => 'LONGTEXT',
            ],
            'status' => [
                'type'       => 'ENUM',
                'constraint' => ['PENDING', 'RESTORED', 'EXPIRED'],
                'default'    => 'PENDING',
            ],
            'semana_nomina' => [
                'type'       => 'INT',
                'constraint' => 3,
                'null'       => true,
            ],
            'created_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
            'updated_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
        ]);

        $this->forge->addKey('id', true);
        $this->forge->addKey('session_token');
        $this->forge->addKey('status');
        $this->forge->addKey('created_at');
        $this->forge->createTable('liquidaciones_temporales', true);
    }

    public function down()
    {
        $this->forge->dropTable('liquidaciones_temporales', true);
    }
}
