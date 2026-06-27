<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateLiquidacionesTable extends Migration
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
            'estado' => [
                'type'       => 'ENUM',
                'constraint' => ['BORRADOR', 'PENDIENTE', 'APROBADA', 'CERRADA'],
                'default'    => 'BORRADOR',
                'null'       => false,
            ],
            'start_date' => [
                'type' => 'DATE',
                'null' => true,
                'default' => null,
            ],
            'end_date' => [
                'type' => 'DATE',
                'null' => true,
                'default' => null,
            ],
            'total_general' => [
                'type'       => 'DECIMAL',
                'constraint' => '12,2',
                'null'       => true,
                'default'    => null,
            ],
            'motivo_rechazo' => [
                'type'       => 'TEXT',
                'null'       => true,
                'default'    => null,
            ],
            'datos_json' => [
                'type' => 'JSON',
                'null' => true,
                'default' => null,
            ],
            'created_by' => [
                'type'     => 'INT',
                'constraint' => 11,
                'unsigned' => true,
                'null'     => true,
                'default'  => null,
            ],
            'approved_by' => [
                'type'     => 'INT',
                'constraint' => 11,
                'unsigned' => true,
                'null'     => true,
                'default'  => null,
            ],
            'created_at' => [
                'type' => 'DATETIME',
                'null' => false,
            ],
            'updated_at' => [
                'type' => 'DATETIME',
                'null' => false,
            ],
        ]);

        $this->forge->addKey('id', true);
        $this->forge->addKey('estado');
        $this->forge->addKey(['start_date', 'end_date']);
        $this->forge->addForeignKey('created_by', 'users', 'id', 'SET NULL', 'SET NULL');
        $this->forge->addForeignKey('approved_by', 'users', 'id', 'SET NULL', 'SET NULL');
        $this->forge->createTable('liquidaciones');
    }

    public function down(): void
    {
        $this->forge->dropTable('liquidaciones', true);
    }
}
