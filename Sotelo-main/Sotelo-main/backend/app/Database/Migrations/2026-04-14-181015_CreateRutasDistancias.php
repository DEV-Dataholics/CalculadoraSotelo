<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateRutasDistancias extends Migration
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
            'origen_normalizado' => [
                'type'       => 'VARCHAR',
                'constraint' => 100,
            ],
            'destino_normalizado' => [
                'type'       => 'VARCHAR',
                'constraint' => 100,
            ],
            'distancia_km' => [
                'type'       => 'DECIMAL',
                'constraint' => '8,1',
            ],
            'region' => [
                'type'       => 'ENUM',
                'constraint' => ['GENERAL', 'PACIFICO', 'CLIENTE'],
                'default'    => 'GENERAL',
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
        $this->forge->addUniqueKey(['origen_normalizado', 'destino_normalizado', 'region'], 'idx_ruta_unique');
        $this->forge->addKey('region');
        $this->forge->addKey('is_active');
        $this->forge->createTable('rutas_distancias', true);
    }

    public function down()
    {
        $this->forge->dropTable('rutas_distancias', true);
    }
}
