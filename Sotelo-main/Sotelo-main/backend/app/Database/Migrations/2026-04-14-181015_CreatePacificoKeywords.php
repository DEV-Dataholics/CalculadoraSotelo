<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreatePacificoKeywords extends Migration
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
            'keyword' => [
                'type'       => 'VARCHAR',
                'constraint' => 50,
            ],
            'is_active' => [
                'type'       => 'TINYINT',
                'constraint' => 1,
                'default'    => 1,
            ],
        ]);

        $this->forge->addKey('id', true);
        $this->forge->addUniqueKey('keyword', 'idx_keyword_unique');
        $this->forge->createTable('pacifico_keywords', true);
    }

    public function down()
    {
        $this->forge->dropTable('pacifico_keywords', true);
    }
}
