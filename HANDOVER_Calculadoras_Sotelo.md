# Handover de Proyecto: Calculadoras Sotelo

Este documento describe la estructura y contenidos de la carpeta principal del proyecto **Calculadoras Sotelo**, orientado a facilitar la transferencia técnica al siguiente desarrollador.

## Estructura Principal del Proyecto

La carpeta contiene los siguientes directorios clave:

1. **`PayrollTool/`**: Esta es la carpeta principal de código. Contiene la aplicación web (frontend en React/Vite y backend en PHP) diseñada para automatizar el cálculo de las nóminas de los operadores. 
   - **IMPORTANTE:** Para detalles técnicos profundos, arquitectura, despliegue y lógica de negocio, por favor consultar el documento: `PayrollTool/D-Process/HANDOVER_Desarrollador_PayrollTool_Fase2.md`.
   - Incluye versiones pre-compiladas en `HOSTING_DEPLOY_READY/` y el backend en Python legacy de la fase 1.

2. **`Genesis/`**: Contiene archivos Excel con los movimientos crudos exportados del sistema Genesis (ej. "Movimientos octubre 2025.xlsx"). Son los datos de origen primarios.

3. **`Seguimiento/`**: Contiene archivos de análisis de requerimientos, reglas operativas y transcripciones de entrevistas con los involucrados.
   - Destacan: `El proceso de foraneo chihuahua.md`, `REPORTE_HALLAZGOS_NUEVAS_REGLAS.md`, y la transcripción descriptiva del proceso.
   - Contiene archivos CSV extraídos para análisis de rutas y rendimientos.

4. **`Reportes/`**: Contiene documentos de texto libre relativos a las diferentes formas de pago para los operadores de Fletes Sotelo y reportes adicionales de investigación.

5. **`D-Process/` (Raíz)**: Documentación general del proceso analítico.

### Archivos en raíz
Archivos de texto generados durante las pruebas analíticas, descubrimiento de reglas y scripts auxiliares (ej. `pacifico_rules.txt`, `audit_result.txt`).

## Pasos Siguientes para el Desarrollador
1. Leer este documento como punto de entrada general.
2. Leer obligatoriamente el archivo `PayrollTool/D-Process/HANDOVER_Desarrollador_PayrollTool_Fase2.md` para entender el estado del desarrollo de la herramienta y los pendientes para la Fase 2 (ajuste de Bono Químico, Precio Real de Diésel y Deducciones de Cruce).
3. Levantar el proyecto `PayrollTool` en local según las instrucciones del Handover Técnico y verificar que compile con sus componentes React y PHP.
4. Reanudar el desarrollo implementando las reglas faltantes de la Fase 2 en `api/upload.php` y en el frontend.
