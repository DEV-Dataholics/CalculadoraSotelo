<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateExclusionesPagoBaseTable extends Migration
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
            'valor' => [
                'type'       => 'VARCHAR',
                'constraint' => 100,
                'null'       => false,
            ],
            'tipo_match' => [
                'type'       => 'ENUM',
                'constraint' => ['COORDENADA', 'RUTA'],
                'null'       => false,
            ],
            'is_active' => [
                'type'       => 'TINYINT',
                'constraint' => 1,
                'default'    => 1,
            ],
            'created_at' => ['type' => 'DATETIME', 'null' => true],
            'updated_at' => ['type' => 'DATETIME', 'null' => true],
        ]);

        $this->forge->addPrimaryKey('id');
        $this->forge->addUniqueKey(['valor', 'tipo_match']);
        $this->forge->createTable('exclusiones_pago_base');
    }

    public function down(): void
    {
        $this->forge->dropTable('exclusiones_pago_base');
    }
}
