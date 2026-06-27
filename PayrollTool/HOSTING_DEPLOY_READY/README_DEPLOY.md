# Hosting Deploy Ready — Site5 / cPanel PHP

Backend reescrito en PHP puro. No requiere Python App, no requiere configuracion extra.
Solo sube la carpeta `public/` al docroot del subdominio y listo.

## Estructura final

```
public/
├── index.html          ← React SPA
├── vite.svg
├── assets/             ← JS y CSS compilados
├── .htaccess           ← SPA routing + rutas API
└── api/
    ├── upload.php      ← Procesa el CSV de Genesis
    └── calculate.php   ← Recalcula nomina con ajustes manuales
```

La carpeta `python_api/` es obsoleta. Ya no se usa.

## Que subir y a donde

Sube el contenido COMPLETO de `public/` al docroot de `nomina-sotelo.dataholics.com.mx`:

```
index.html
vite.svg
assets/
.htaccess
api/
  upload.php
  calculate.php
```

Puedes hacerlo via FTP o desde cPanel File Manager.

## Requisitos del hosting

- PHP 7.4 o superior (cualquier hosting con cPanel lo tiene)
- Modulo mod_rewrite habilitado (estandar en todos los planes de Site5)
- `mb_string` habilitado (estandar)
- No se necesita nada mas

## Como funciona

1. El navegador carga `index.html` (React)
2. Al subir un CSV, el frontend llama a `/api/upload`
3. Apache redirige via `.htaccess` a `api/upload.php`
4. PHP parsea el CSV directamente, aplica la logica de nomina, devuelve JSON
5. Al ajustar diesel/bonos, el frontend llama a `/api/calculate` → `api/calculate.php`

## Nota sobre archivos Excel

Solo se aceptan archivos CSV en esta version.
Para exportar desde Genesis: Archivo → Exportar → CSV (separado por comas).
