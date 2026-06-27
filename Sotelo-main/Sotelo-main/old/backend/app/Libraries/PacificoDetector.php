<?php

namespace App\Libraries;

use Config\Database;

class PacificoDetector
{
    /**
     * Keywords de segmento PAC documentadas en calculadoras_sotelo_payroll_rules.md.
     * Se usan como fallback si la tabla pacifico_keywords en BD está incompleta o vacía.
     * Source: calculadoras_sotelo §Detección de ruta Pacífico
     */
    private const FALLBACK_KEYWORDS = [
        'OBRG', 'OBREGON', 'MOCHIS', 'GUAMUCHIL', 'NAVOJOA',
        'CANANEA', 'ETCHO', 'JANOS', 'NOGALES', 'HERMOSILLO',
        'EMPALME', 'BACUM', 'GYSA', 'YARDA SOTELO',
    ];

    /** @var array<int, string> */
    private array $keywords = [];

    public function __construct()
    {
        $db = Database::connect();
        $rows = $db->table('pacifico_keywords')
            ->select('keyword')
            ->where('is_active', 1)
            ->get()
            ->getResultArray();

        $fromDb = array_map(static fn($row) => strtoupper(trim((string) $row['keyword'])), $rows);

        // Unión con el fallback: las keywords documentadas siempre están presentes
        // aunque la tabla BD esté vacía o incompleta (D-05 fix).
        $this->keywords = array_values(array_unique(array_merge($fromDb, self::FALLBACK_KEYWORDS)));
    }

    public function isPacifico(string $loc): bool
    {
        $locUp = strtoupper(trim($loc));
        foreach ($this->keywords as $kw) {
            if ($kw !== '' && strpos($locUp, $kw) !== false) {
                return true;
            }
        }

        return false;
    }
}
