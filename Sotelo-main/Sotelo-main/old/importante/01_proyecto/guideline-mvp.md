# Guideline de Desarrollo del MVP
## Proyecto: PayrollTool Foraneo Chihuahua y Pacifico - Fase 2

Este documento define el marco de trabajo para ejecutar el MVP Fase 2 de PayrollTool, alineado al SOW vigente y a los procesos internos de Dataholics.

Ruta de referencia del SOW:
- `proyectos/Calculadoras Sotelo/D-Process/SOW_PayrollTool_Fase2_Nuevas_Reglas.md`

---

## 1. Objetivo del Guideline

Asegurar que el equipo implemente las nuevas reglas operativas sin romper el flujo actual del sistema, con foco en:

1. Retiro del calculo automatico de incentivo diesel en carga de CSV.
2. Transicion a flujo semi-automatico con captura manual del operador.
3. Implementacion controlada de reglas nuevas detectadas en seguimiento.
4. Entrega validable con criterios de aceptacion medibles.

> **Nota de arquitectura (actualizada 15/03/2026):** El backend fue migrado de Python/FastAPI a **PHP 8.x puro** para compatibilidad con el hosting compartido Site5/cPanel. No se requiere ninguna configuracion adicional de servidor. Los endpoints son `api/upload.php` y `api/calculate.php` servidos directamente por Apache.

---

## 2. Alcance Tecnico del MVP (Fase 2)

Stack operativo de esta fase:
- Backend: PHP 8.x puro (archivos `api/upload.php` y `api/calculate.php`)
- Frontend: React + Vite (bundle estatico)
- Hosting: Site5 / cPanel con Apache + mod_rewrite + PHP
- Entrada de datos: CSV exportado de Genesis
- Persistencia: sin base de datos en esta fase (stateless por request)

Principio rector de esta fase:
- El sistema automatiza referencia y validacion.
- El operador valida y captura los datos finales de diesel desde ticket fisico.

---

## 3. Reglas Mandatorias de Implementacion

1. Backend como fuente unica de verdad
- Todo calculo final de liquidacion debe resolverse en backend.
- El frontend no debe recalcular formulas financieras criticas con logica divergente.

2. Diesel en dos etapas
- Etapa automatica (al cargar CSV): clasificacion de viajes, mano de obra base, km tabulados, litros permitidos, costo esperado.
- Etapa manual (operador): litros reales y precio real por litro.

3. Formula oficial de incentivo
- Incentivo Diesel = (Litros Permitidos - Litros Reales Ticket) x Precio Real Ticket
- Si no hay precio manual capturado, usar precio de referencia por zona como fallback visible.

4. Precios por zona
- Local/Cruce: 14.50 MXN/litro
- Foraneo Chihuahua: 14.85 MXN/litro

5. Catalogos oficiales
- Rendimientos por unidad con precision de 5 decimales.
- Rutas con nombres reales de clientes y plantas.
- Tipos de movimiento de Genesis actualizados.

---

## 4. Prompt Maestro para Agentes de Desarrollo

Copia y pega este prompt al iniciar desarrollo:

> Contexto:
> Eres un equipo tecnico de Dataholics trabajando en PayrollTool Fase 2 para Fletes Sotelo.
>
> Objetivo:
> Implementar nuevas reglas operativas y retirar el calculo automatico de diesel.
>
> Stack:
> Backend PHP 8.x puro (`api/upload.php`, `api/calculate.php`), Frontend React + Vite, ingest de CSV Genesis. Hosting Site5/cPanel.
>
> Reglas no negociables:
> 1) El incentivo diesel NO se liquida automaticamente al cargar CSV.
> 2) El operador captura litros reales y precio real por litro.
> 3) El backend calcula liquidacion final.
> 4) Implementar Bono Quimico, Deduccion de Cruce (6 casos), rendimientos oficiales y rutas expandidas.
> 5) Mantener compatibilidad con flujo existente y evitar regresiones.
>
> Forma de trabajo:
> 1) Definir contrato de datos por endpoint.
> 2) Implementar backend primero.
> 3) Conectar frontend a respuestas reales.
> 4) Ejecutar pruebas de regresion contra casos historicos.

---

## 5. Backlog de Desarrollo por Fases

### Fase A - Contrato y Preparacion
- [ ] Definir payload de viaje con campos manuales de diesel.
- [ ] Versionar estructura de respuesta del endpoint de calculo.
- [ ] Documentar fallback de precio por zona.

### Fase B - Motor de Calculo Backend (PHP)
- [ ] Deshabilitar incentivo automatico en etapa de carga CSV (`upload.php`).
- [ ] Implementar calculo final con `precio_real_ticket` y `litros_reales_ticket` en `calculate.php`.
- [ ] Integrar Bono Quimico (activacion manual inicial) en `calculate.php`.
- [ ] Integrar Deduccion de Cruce en 6 escenarios operativos en `upload.php`.
- [ ] Actualizar tabla `$UNIT_YIELDS` con rendimientos oficiales.
- [ ] Actualizar tabla `$ROUTE_DISTANCES_CLIENTS` con rutas reales de cliente/planta.
- [ ] Actualizar logica de clasificacion por tipos de movimiento de Genesis en `upload.php`.

### Fase C - UI Operativa React
- [ ] Agregar campo editable de litros reales.
- [ ] Agregar campo editable de precio real por litro.
- [ ] Mostrar valores de referencia (litros permitidos, costo esperado, litros de empate).
- [ ] Asegurar que resumen use valores calculados por backend.

### Fase D - Validacion y Estabilizacion
- [ ] Validar resultados contra hojas historicas de operacion.
- [ ] Ejecutar casos de prueba de Deduccion de Cruce.
- [ ] Ejecutar prueba de regresion de clasificacion de viajes.
- [ ] Corregir desviaciones antes de cierre de QA.

---

## 6. Checklist de QA (Definition of Ready to Release)

1. Flujo semi-automatico diesel funcional de extremo a extremo.
2. No existe calculo automatico de incentivo al momento de importar CSV.
3. Formula manual produce resultados correctos en casos de control.
4. Deduccion de Cruce validada en los 6 escenarios.
5. Bono Quimico aplicable sin efectos colaterales en otros bonos.
6. Rendimientos y rutas oficiales activos en produccion.
7. Clasificacion de movimientos Genesis sin regresion funcional.
8. Sin bugs criticos de backend/frontend en pruebas de QA.

---

## 7. Estrategia de Pruebas Minima

Casos obligatorios:

1. Caso base Chihuahua redondo
- Viaje con km tabulados normales.
- Captura manual de litros y precio.
- Validacion de incentivo esperado.

2. Caso con cruce fronterizo
- Ruta con componente El Paso/Juarez.
- Validacion de deduccion de cruce.

3. Caso con Bono Quimico
- Activacion manual del bono.
- Validar suma correcta al total.

4. Caso fallback de precio
- Sin precio manual.
- Verificar aplicacion de precio por zona correcto.

5. Caso de regresion
- Dataset historico con resultado conocido.
- Comparar salida sistema vs control historico.

---

## 8. Entregables de Documentacion

1. README tecnico actualizado en el proyecto PayrollTool.
2. Matriz de reglas implementadas vs hallazgos de seguimiento.
3. Evidencia de pruebas (capturas o logs) por cada caso obligatorio.
4. Nota de version de Fase 2 con cambios y riesgos residuales.

---

## 9. Riesgos y Controles

Riesgos principales:
- Captura manual incorrecta de ticket (litros/precio).
- Diferencias entre criterio historico en Excel y logica formalizada en sistema.
- Reglas pendientes de precision (condicion exacta de Bono Quimico).

Controles:
- Validaciones de input y rangos permitidos en UI y backend.
- Casos comparativos contra historicos antes de liberar.
- Flags temporales para reglas de activacion manual.

---

## 10. Criterio de Cierre de Fase

La Fase 2 se considera cerrada cuando:
- Se cumplen los criterios del SOW.
- Se aprueba QA funcional por CTO.
- Se entrega documentacion tecnica minima completa.
- Se valida operacion con dataset real sin desviaciones criticas.