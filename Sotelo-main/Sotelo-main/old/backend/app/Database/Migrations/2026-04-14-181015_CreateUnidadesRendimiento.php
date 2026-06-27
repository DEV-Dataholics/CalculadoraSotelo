<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateUnidadesRendimiento extends Migration
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
            'tractor' => [
                'type'       => 'VARCHAR',
                'constraint' => 20,
            ],
            'yield_km_l' => [
                'type'       => 'DECIMAL',
                'constraint' => '8,5',
                'default'    => '2.37341',
            ],
            'is_active' => [
                'type'       => 'TINYINT',
                'constraint' => 1,
                'default'    => 1,
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
        $this->forge->addUniqueKey('tractor', 'idx_tractor');
        $this->forge->addKey('is_active', false, false, 'idx_unidades_active');
        $this->forge->createTable('unidades_rendimiento', true);
    }

    public function down()
    {
        $this->forge->dropTable('unidades_rendimiento', true);
    }
}
