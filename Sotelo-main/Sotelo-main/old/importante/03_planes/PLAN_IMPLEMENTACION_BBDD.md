# Plan de Implementación de Base de Datos (Persistencia y Origen de Verdad)

**Fecha:** Abril 2026  
**Proyecto:** Fletes Sotelo — MVP Nómina y Liquidación  
**Objetivo:** Introducir una capa de persistencia mediante una Base de Datos en MySQL (para unificar los entornos de desarrollo local y producción), eliminando así la deuda técnica (variables de configuración hardcodeadas), garantizando la trazabilidad de operaciones y estableciendo una base sólida para el Motor de Tarifas de Cruces y Movimientos.

---

## 1. Justificación y Propósito Técnico

El sistema actual ha operado demostrando su funcionalidad, pero ha acumulado deuda técnica que frena su escalabilidad y seguridad.
*   **Archivos acoplados:** Datos vitales como el rendimiento de unidades (`$UNIT_YIELDS`), las distancias de las rutas (`$ROUTE_DISTANCES_CLIENTS`, `$ROUTE_DISTANCES_PACIFICO`) están *hardcodeados* tanto en `api/upload.php` (Backend) como en `frontend/src/constants.js` (Frontend). Una adición requiere tocar múltiples archivos de código.
*   **Persistencia Nula:** Las liquidaciones (boletas) calculadas existen solo en la sesión del árbol DOM del usuario en React. Una simple recarga (F5) borra todo el trabajo.
*   **Auditoría y Versionado Inexistente:** Con el nuevo plan de *Cruces y Tabulador*, necesitamos saber quién ajustó una tarifa, en qué versión vamos, y cómo respaldarlo de forma relacional en lugar de simples archivos de texto.

---

## 2. Arquitectura de Base de Datos (MySQL)

Para unificar los entornos y evitar comportamientos inesperados, usaremos MySQL de manera homologada tanto en local como en producción usando la extensión **PDO** nativa de PHP.

### 2.1 Conexión con PDO
Se creará una clase `Database.php` (ej. `api/core/Database.php`) que maneje un patrón *Singleton* para la conexión PDO a MySQL. Las credenciales dependerán de una variable de entorno o configuración alojada en un `config.php` ignorado por git:
*   **Cadena de Conexión Estándar:** `mysql:host=localhost;dbname=sotelo_db;charset=utf8mb4`. (Variables adaptables según el entorno).

### 2.2 Migraciones Estandarizadas
Ya que contaremos con el mismo motor de inicio a fin, las migraciones (`api/migrate.php`) y la estructura de las tablas utilizarán la sintaxis nativa de MySQL sin necesidad de conversores duales.
Ejemplo general de sintaxis a implementar: `INT AUTO_INCREMENT PRIMARY KEY`.

---

## 3. Esquema de Datos (Modelo Entidad-Relación Inicial)

Estructura de las tablas iniciales para absorber la deuda y preparar el futuro:

### Tabla: `unidades_rendimiento`
Almacena el rendimiento (km/L) que tiene cada tractor. Elimina el arreglo de `$UNIT_YIELDS`.
*   `id` (PK, INT AUTO_INCREMENT)
*   `tractor` (VARCHAR, Único, Index) - Ej. 'F-002'
*   `yield_km_l` (DECIMAL) - Ej. 2.37341
*   `is_active` (BOOLEAN) - Para baja lógica de unidades.
*   `updated_at` (TIMESTAMP)

### Tabla: `rutas_distancias`
Centraliza `$ROUTE_DISTANCES`, `$ROUTE_DISTANCES_PACIFICO` y `$ROUTE_DISTANCES_CLIENTS`.
*   `id` (PK, INT AUTO_INCREMENT)
*   `origen_normalizado` (VARCHAR) - Ej. 'JUAREZ'
*   `destino_normalizado` (VARCHAR) - Ej. 'CHIHUAHUA'
*   `distancia_km` (DECIMAL)
*   `region` (VARCHAR Enum: 'LOCAL', 'PACIFICO', 'CLIENTE')
*   `is_active` (BOOLEAN)

### Tabla: `tabulador_tarifas`
Soporta las fases de "Implementación de Cruces". Centraliza las reglas de viáticos y tarifas de cruces.
*   `id` (PK, INT AUTO_INCREMENT)
*   `tipo` (VARCHAR) - Ej. 'S-TER-02', 'LOC-01'
*   `cruce` (VARCHAR) - Ej. 'PUENTE ZARAGOZA', null
*   `origen` (VARCHAR) - Opcional.
*   `destino` (VARCHAR) - Opcional.
*   `pago_operador` (DECIMAL)
*   `version` (VARCHAR/INTEGER) - ID o timestamp de carga masiva.
*   `is_active` (BOOLEAN)
*   `prioridad` (INTEGER) - Mayor valor se sobrepone sobre reglas genéricas.

### Tabla: `liquidaciones_temporales` (Boletas / UI Session)
Un sistema de caché intermedio. Evita que el usuario pierda su reporte de Genesis si cierra accidentalmente la ventana o presiona F5.
*   `id` (PK, INT AUTO_INCREMENT)
*   `usuario_front` (VARCHAR) - Podría ser la IP temporal o token de sesión.
*   `datos_boleta_json` (LONGTEXT) - Dump completo en JSON del arreglo generado por `upload.php`.
*   `status` (VARCHAR: 'PENDING')
*   `created_at` / `updated_at` (TIMESTAMP)

### Tabla: `audit_logs`
Seguridad y trazabilidad.
*   `id` (PK, INT AUTO_INCREMENT)
*   `action` (VARCHAR) - Ej. 'MIGRACION_INICIAL', 'SUBIO_TABULADOR'
*   `details` (TEXT - JSON) - Valores afectados.
*   `created_at` (TIMESTAMP)

---

## 4. Plan de Ejecución en 4 Fases

### Fase 1: Capa Estructural y Migración Semilla 
1.  **Directorio y Core**: Crear carpeta `api/db` y `api/db/Database.php` (Clase de conexión PDO exclusiva para MySQL).
2.  **Migrador Universal**: Crear `api/db/migrate.php` para instalar todas las tablas con sintaxis de MySQL puro.
3.  **Semilla Autogenerada:** Crear `api/db/seed.php`. Este archivo importará `$UNIT_YIELDS`, `$ROUTE_DISTANCES`, etc. desde el código legado en `api/upload.php` y hará los *INSERTs* automáticos a la BD. Así poblamos la base de datos sin capturar nada a mano.

### Fase 2: Estrategia de Refactor API & Frontend (El Cacheo de RAM)
1.  **Endpoints para Catálogos**: Crear `api/get_rendimientos.php` y `api/get_rutas.php`.
2.  **Optimización en `upload.php` (CRÍTICO):** Ya que iteramos entre cientos de filas de un archivo CSV por boleta, hacer una llamada SQL de lectura por cada vuelta colapsaría el API. 
    *Solución:* `upload.php` hará un solo `SELECT *` general al arranque. Construirá un diccionario local (array asociativo en RAM de PHP) y validará contra él garantizando una respuesta instantánea.
3.  **Limpiar Frontend:** Remover toda la lógica centralizada en `constants.js` (rendimientos). El Frontend obtendrá los mapeos consultando a los nuevos endpoints al montarse la App.

### Fase 3: Conexión con Plan de Cruces (Motor de Tarifas)
*(Continúa orgánicamente)*
1.  Terminar el endpoint `api/tabulador.php`. Su esquema guardará el tabulador directamente en la tabla `tabulador_tarifas` controlando las activaciones por su respectiva versión, agilizando el control y auditoría.

### Fase 4: Persistencia Visual de Boletas (UX)
1. Modificar el flujo para que tras un procesamiento de boletas exitoso en `upload.php`, el backend guarde adicionalmente en forma encubierta el `JSON` completo en `liquidaciones_temporales`.
2. El Frontend, durante su carga inicial, consultará a un endpoint como `api/get_pending_sessions.php` para detectar si el usuario dejó trabajo pendiente restaurándolo automáticamente.

---

## 5. Prevención de Riesgos 

| Riesgo | Mitigación |
| :--- | :--- |
| **Pérdida de Performance en Cálculo** | Patrón de Diccionario en Memoria (Fase 2): Acceso a caché de RAM de PHP evitando transacciones masivas de disco (BD) en los ciclos iterativos del CSV. |
| **Falta de Sistema de Roles Formal** | Inicialmente se carece de JWT o roles rígidos en el backend (ya que el app corre en intranet hoy por hoy). Pospondremos el loggin duro registrando solo la IP a un nivel base transitorio insertándola en `audit_logs`. |

---

## Veredicto y Siguientes Pasos
Este plan representa una modernización directa asumiendo el uso estandarizado de **MySQL a lo largo de todo su ecosistema**. Las Fases 1 y 2 representarán la arquitectura crítica (que desarticulará los archivos *hardcodeados*) cediendo paso así a un flujo libre y auditable del Motor de Tarifas (Fase 3).
