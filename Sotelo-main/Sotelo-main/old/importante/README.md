# Carpeta `importante/` — Documentación del Proyecto

Documentación de referencia de **PayrollTool — Nómina Foránea Fletes Sotelo**.
Organizada por propósito; los números indican el orden de lectura recomendado para
alguien nuevo en el proyecto.

## Estructura

### `01_proyecto/` — Qué es el proyecto y qué se acordó
| Archivo | Contenido |
|---|---|
| `sow.md` | Alcance y declaración de trabajo de la Fase 2 (contrato) |
| `guideline-mvp.md` | Marco de trabajo y reglas mandatorias de implementación |
| `handover-tecnico.md` | Handover técnico: arquitectura, deploy, lógica de negocio, accesos |
| `Runbook_Desarrollo_MVP_Web.md` | Runbook de desarrollo del MVP web |
| `estado_actual_app.md` | Snapshot del estado funcional de la app (abril 2026) |

### `02_reglas_negocio/` — Reglas de nómina validadas
| Archivo | Contenido |
|---|---|
| `RULE_LEDGER.md` | **Fuente de verdad**: todas las reglas de pago (R-001…R-021) con nivel de confianza |
| `calculadoras_sotelo_payroll_rules.md` | Resumen ejecutivo de tasas confirmadas vs nóminas pagadas |
| `REVERSE_ENGINEERING_REPORT_2026-04-21.md` | Ingeniería inversa de nóminas pagadas (semanas 41-45) |
| `Checklist_Clarificacion_Nomina.md` | Preguntas de negocio aún abiertas con el cliente |
| `GUIA_MOTOR_TARIFAS_2026.md` | Cómo funciona el motor/tabulador de tarifas |

### `03_planes/` — Planes de implementación
| Archivo | Contenido |
|---|---|
| `PLAN_AJUSTES_2026-06-11.md` | **Plan vigente**: 5 ajustes de la revisión de junio 2026 + estimación |
| `PLAN_IMPLEMENTACION_BBDD.md` | Plan de migración a MySQL/persistencia (ejecutado) |
| `PLAN_IMPLEMENTACION_CRUCES.md` | Plan del tabulador de cruces (ejecutado) |
| `PLAN_PRUEBAS_TABULADOR.md` | Conexión del módulo operativo a CodeIgniter + protocolo de pruebas |

### `04_informes/` — Auditorías y reportes
| Archivo | Contenido |
|---|---|
| `informe_diferencias_lógica_210426.md` | Auditoría forense de lógica de nómina vs RULE_LEDGER |
| `informe_diferencias_logica_bonos_manuales.md` | Diferencias en bonos manuales FCH/PAC |
| `REPORTE_DE_REVISION_DISCREPANCIAS_2026-04-28.md` | Revisión de calidad del reporte de discrepancias |
| `reporte-cruces.md` | Reporte de análisis de cruces |
| `Reporte_Implementacion_Fase2.md` | Reporte de cierre de implementación Fase 2 |

### `05_datos/` — Datos maestros y de prueba
| Archivo | Contenido |
|---|---|
| `tabulador_procesado.csv` | Tabulador de tarifas procesado (datos maestros) |
| `tarifa de pago cruce y movimientos locales op.foraneos.csv/.xlsx` | Tarifas fuente del cliente |
| `movimientos gnesis.csv` | Export real de Genesis — dataset de prueba para el flujo de carga |

### `06_seguimiento/` — Seguimiento de desarrollo
| Archivo | Contenido |
|---|---|
| `todo.md` | Backlog global (Fase 2 completada; QA/deploy pendiente) |
| `lessons.md` | Lecciones aprendidas y patrones a respetar |
