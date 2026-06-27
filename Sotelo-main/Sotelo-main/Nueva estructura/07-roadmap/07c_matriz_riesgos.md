# Matriz de Riesgos — Reestructura PayrollTool

| Campo | Valor |
|---|---|
| Proyecto | PayrollTool · Fletes Sotelo |
| Documento | 07c — Matriz de Riesgos |
| Versión | 1.0 |
| Fecha | 2026-06-11 |
| Autor | David García |
| Depende de | [07_roadmap_fases](07_roadmap_fases.md) |

> **Escala:** Probabilidad (Baja/Media/Alta) × Impacto (Bajo/Medio/Alto). Score = P×I (1–9). Estrategia: Avoid / Mitigate / Transfer / Accept.

---

## Risk Register

| ID | Riesgo | Categoría | Prob | Impacto | Score | Estrategia | Plan de mitigación | Dueño | Estado |
|----|--------|-----------|------|---------|-------|-----------|--------------------|-------|--------|
| R01 | Error de cálculo llega a producción (dinero mal pagado) | Técnico | Media | **Alto** | **6 — CRÍTICO** | Mitigate | Set de control vs nóminas reales al 100%; golden master; cobertura ≥90%; backend fuente única | Tech Lead | Activo |
| R02 | Decisiones de negocio (doc 05) no se cierran a tiempo | Externo/Org | **Alta** | **Alto** | **9 — CRÍTICO** | Mitigate | Gestionar confirmación en paralelo a Fases 0–1; tests parametrizados; escalar a stakeholder; documentar supuestos | PM | Activo |
| R03 | Divergencia frontend↔backend en totales (ya existe: $1,726 vs $2,439) | Técnico | Media | Alto | 6 — CRÍTICO | Avoid | Eliminar recálculo en `BoletaCard.jsx`; backend única fuente (ADR-003); test de no-divergencia | Tech Lead | Activo |
| R04 | Migración/backfill corrompe o pierde datos | Técnico | Baja | **Alto** | 4 — Monitorear | Mitigate | Migraciones aditivas/reversibles; backup verificado; backfill idempotente con conciliación; sin DROP en corte inicial | Backend/DBA | Activo |
| R05 | Regla de dedupe de cruces mal generalizada (sub o sobre-pago) | Técnico | Media | Alto | 6 — CRÍTICO | Mitigate | SPIKE-1 contra nóminas reales; casos de prueba por escenario; revisar nivel 3 del tabulador | Tech Lead | Activo |
| R06 | Lista de exclusiones incompleta (más coordenadas/rutas de las conocidas) | Negocio | Media | Medio | 4 — Monitorear | Mitigate | Catálogo administrable (ADR-006); el cliente puede agregar sin código; revisar contra histórico | Admin/Negocio | Activo |
| R07 | Datos de Genesis insuficientes para fecha/estancias/bonos por tiempo | Técnico | Media | Medio | 4 — Monitorear | Mitigate | SPIKE-2 (validar `Arranque`/`Arribo`); degradar a captura manual si no alcanzan | Backend | Activo |
| R08 | Introducir auth rompe el flujo operativo actual | Técnico | Media | Medio | 4 — Monitorear | Mitigate | RBAC aditivo; pruebas de flujo legacy; despliegue por fases con feature flags | Tech Lead | Activo |
| R09 | Credenciales de producción mal manejadas / fuga | Seguridad | Baja | Alto | 4 — Monitorear | Avoid | Secrets fuera del repo (env/secret manager); `.env` en `.gitignore`; revisión de seguridad Fase 5 | Tech Lead | Activo |
| R10 | Dependencia de una sola persona con el conocimiento del dominio | Equipo | Media | Alto | 6 — CRÍTICO | Mitigate | Documentación (esta carpeta + RULE_LEDGER); pair programming; ADRs | PM | Activo |
| R11 | Scope creep (nuevas reglas/bonos durante el desarrollo) | Org | Media | Medio | 4 — Monitorear | Mitigate | Backlog priorizado; cambios entran como nuevas historias; congelar scope por fase | PM | Activo |
| R12 | Incompatibilidades de versiones (PHP 8.2/CI4 4.7, React 19/Vite 7) en CI/prod | Técnico | Baja | Medio | 2 — Bajo | Accept/Mitigate | CI replica versiones de prod; lockfiles; Docker | Backend | Activo |
| R13 | Migración a producción sin ventana/rollback claro | Operacional | Baja | Alto | 4 — Monitorear | Mitigate | Plan de despliegue y rollback (Fase 5); migrar aditivo primero, DROP después | Tech Lead | Activo |
| R14 | Performance al normalizar y consultar liquidaciones grandes | Técnico | Baja | Medio | 2 — Bajo | Mitigate | Índices (doc 06); paginación; medir con datos reales | Backend | Activo |

---

## Mapa Probabilidad × Impacto

```
IMPACTO
  Alto │  R04,R09,R13  │  R01,R03,R05,R10  │  R02            │
       │               │                   │                 │
 Medio │  R12,R14      │  R06,R07,R08,R11  │                 │
       │               │                   │                 │
  Bajo │               │                   │                 │
       └───────────────┼───────────────────┼─────────────────
                Baja           Media               Alta
                            PROBABILIDAD
```

**Críticos (atención prioritaria):** R02 (decisiones de negocio), R01/R03/R05/R10.

---

## Riesgos con plan de contingencia explícito

- **R02 (decisiones de negocio):** si no se cierran al finalizar Fase 1, se inicia Fase 2 con los supuestos del doc 05 marcados como tales; los tests usan el valor supuesto y se re-validan al confirmar. **No** se cierra/despliega una nómina real sin confirmación.
- **R01/R03 (cálculo):** ningún cambio de lógica se mergea sin pasar el set de control. El golden master detecta cambios no intencionales.
- **R10 (key person):** la documentación de esta carpeta + RULE_LEDGER es el activo de mitigación; mantener actualizada.

---

## Revisión

Revisar el risk register al cierre de cada fase (gate) y actualizar probabilidad/impacto/estado.
