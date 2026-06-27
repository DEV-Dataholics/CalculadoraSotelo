<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateTabuladorTarifas extends Migration
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
            'tipo' => [
                'type'       => 'VARCHAR',
                'constraint' => 20,
            ],
            'cruce' => [
                'type'       => 'VARCHAR',
                'constraint' => 100,
                'null'       => true,
            ],
            'origen' => [
                'type'       => 'VARCHAR',
                'constraint' => 100,
                'null'       => true,
            ],
            'destino' => [
                'type'       => 'VARCHAR',
                'constraint' => 100,
                'null'       => true,
            ],
            'pago_operador' => [
                'type'       => 'DECIMAL',
                'constraint' => '10,2',
                'default'    => '0.00',
            ],
            'version' => [
                'type'       => 'INT',
                'constraint' => 10,
                'unsigned'   => true,
                'default'    => 1,
            ],
            'is_active' => [
                'type'       => 'TINYINT',
                'constraint' => 1,
                'default'    => 1,
            ],
            'prioridad' => [
                'type'       => 'INT',
                'constraint' => 11,
                'default'    => 0,
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
        $this->forge->addKey('tipo');
        $this->forge->addKey(['version', 'is_active']);
        $this->forge->addKey('prioridad');
        $this->forge->createTable('tabulador_tarifas', true);
    }

    public function down()
    {
        $this->forge->dropTable('tabulador_tarifas', true);
    }
}
