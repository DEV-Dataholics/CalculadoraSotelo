# Plan de Conexión y Pruebas del Tabulador

## Situación Actual
Actualmente, el sistema está en un estado de transición:
- **Administrador**: Ya funciona con la base de datos (CodeIgniter) y permite cargar, editar y activar versiones del tabulador.
- **Módulo Operativo**: Las rutas de la API de Carga (`/api/upload`) y Cálculo (`/api/calculate`) siguen apuntando a los scripts PHP legacy (`api/upload.php` y `api/calculate.php`) que usan valores fijos "quemados" en el código en lugar de consultar la base de datos.

Para que las reglas configuradas en el administrador apliquen a los viajes calculados, necesitamos conectar ambos módulos.

## 1. Conexión del Motor Operativo (Backend)
Se deben redirigir las solicitudes a través del router para que apunten al nuevo backend de CodeIgniter.

**Archivo a modificar:** `router.php`
- Cambiar el ruteo de `/api/upload` para apuntar al backend nuevo.
- Cambiar el ruteo de `/api/calculate` para apuntar al backend nuevo.

**Cambio propuesto en `router.php`:**
```php
if (strpos($uri, '/api/') === 0) {
    $_SERVER['SCRIPT_NAME'] = '/index.php';
    require __DIR__ . '/backend/public/index.php';
    exit;
}
```

## 2. Protocolo de Pruebas

Para garantizar que el puente entre el Módulo Operativo y la Base de Datos funciona correctamente, seguiremos este protocolo paso a paso:

### Fase A: Preparación de Datos (Administrador)
1. Ingresar al **Administrador -> Tabulador**.
2. Identificar la **versión activa** o crear una nueva.
3. Crear un registro de prueba muy específico y reconocible para evaluar el motor. Ejemplo:
   - **Tipo**: `TRI-02`
   - **Cruce**: `MX-US`
   - **Origen**: `TIJUANA`
   - **Destino**: `SAN DIEGO`
   - **Pago**: `$7,777.00`
4. Asegurar que esta tarifa guarda y la versión está "Activa".

### Fase B: Verificación Operativa (Frontend / Cálculo)
1. Acceder al **Módulo Operativo**.
2. Subir un archivo de boletas de Génesis que contenga un viaje que coincida con las condiciones anteriores. (Se puede utilizar un CSV de prueba modificado con esos destinos/orígenes).
3. Revisar el desglose del viaje en la interfaz de Boleta.
4. **Criterios de Éxito**:
   - El monto pagado para esa boleta o viaje debe reflejar los **$7,777.00** definidos en la BD.
   - En la consola de red (Network) del navegador, la respuesta de `/api/calculate` debe incluir en el objeto del viaje la propiedad `Fuente_Tarifa: "TABULADOR_BD"`.
   - Modificar la tarifa en el Administrador (ej. a `$8,888.00`) y recalcular en el Módulo Operativo (cambiando un dato como KMS o usando un botón de recalcular) debería reflejar instantáneamente el nuevo monto.

## 3. Consideraciones Técnicas
- **Compatibilidad**: El `PayrollCalculator.php` nuevo ya tiene la lógica (Niveles de especificidad 1 al 4) para consultar `TabuladorModel`. Debemos verificar que los inputs de `UploadController.php` le pasen correctamente el tipo, origen y destino extraídos del CSV.
- **Modo Legacy**: Los viajes que no coincidan con ninguna tarifa del tabulador deberían seguir calculándose según la tarifa base antigua. Esto será reportado en la API con `Fuente_Tarifa: "PAGO_BASE_LEGACY"`.
