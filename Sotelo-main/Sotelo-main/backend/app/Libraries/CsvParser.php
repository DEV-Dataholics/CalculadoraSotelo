<?php

namespace App\Libraries;

class CsvParser
{
    /**
     * @return array{headers: array<int, string>, rows: array<int, array<string, string>>}
     */
    public function parse(string $content): array
    {
        $enc = mb_detect_encoding($content, ['UTF-8', 'ISO-8859-1', 'Windows-1252'], true);
        if ($enc && $enc !== 'UTF-8') {
            $content = mb_convert_encoding($content, 'UTF-8', $enc);
        }

        $handle = fopen('php://temp', 'r+');
        fwrite($handle, $content);
        rewind($handle);

        $headers = fgetcsv($handle);
        if (!$headers) {
            fclose($handle);
            return ['headers' => [], 'rows' => []];
        }

        $headers = array_map(static fn($h) => trim((string) $h), $headers);
        if (isset($headers[0])) {
            $headers[0] = ltrim($headers[0], "\xEF\xBB\xBF\xFF\xFE");
        }

        $rows = [];
        while (($row = fgetcsv($handle)) !== false) {
            if (count($row) === count($headers)) {
                /** @var array<string, string> $combined */
                $combined = array_combine($headers, $row);
                $rows[] = $combined;
            }
        }
        fclose($handle);

        return ['headers' => $headers, 'rows' => $rows];
    }
}
