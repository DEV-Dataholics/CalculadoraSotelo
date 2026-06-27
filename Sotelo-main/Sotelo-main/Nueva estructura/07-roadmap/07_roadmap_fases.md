# Roadmap por Fases — Reestructura PayrollTool

| Campo | Valor |
|---|---|
| Proyecto | PayrollTool · Fletes Sotelo |
| Documento | 07 — Roadmap por Fases |
| Versión | 1.0 |
| Fecha | 2026-06-11 |
| Autor | David García |
| Depende de | 01–06 · [07b_backlog](07b_backlog_user_stories.md) · [07c_matriz_riesgos](07c_matriz_riesgos.md) |

> **Metodología:** iterativo incremental (Kanban con hitos por fase). Cada fase cierra con un *gate* de verificación.

---

## Principio de secuenciación

Las fases se ordenan para **bajar riesgo temprano** y respetar dependencias técnicas:

1. Primero se montan **fundaciones** (entorno reproducible, BD de prueba, CI, primeros tests) — habilita todo lo demás sin tocar producción.
2. Luego **datos + identidad** (BD robusta, usuarios, RBAC) — base sobre la que se apoyan panel y lógica.
3. Después la **lógica de negocio** (los 5 ajustes) con tests — el corazón del valor y del riesgo; requiere las decisiones de negocio cerradas.
4. Encima, **panel administrativo + RBAC en frontend**.
5. Refinamiento de **UI/UX**.
6. **Endurecimiento y corte a producción**.

```
Fase 0 ─► Fase 1 ─► Fase 2 ─► Fase 3 ─► Fase 4 ─► Fase 5
(funda-   (BD +     (lógica   (panel    (UI/UX)   (prod
 ciones)   auth)     + tests)  admin)              cutover)
                        ▲
                        │ bloqueada por decisiones de negocio (doc 05)
```

---

## Fase 0 — Fundaciones (≈1 semana)

**Objetivo:** entorno reproducible y red de seguridad antes de tocar nada crítico.

| Entregable | Detalle |
|---|---|
| Docker para BD de prueba | `docker-compose.yml` con MySQL 8 + seeds; ver `03-datos/docker/` |
| Pipeline CI | GitHub Actions: `composer test` (PHPUnit) + `npm run lint`/`build` en cada PR |
| Baseline de pruebas | Caracterización del cálculo **actual** (golden master) para detectar regresiones |
| ADRs base | Confirmar stack, estrategia de ramas, convención de migraciones (ver `ADR_LOG.md`) |
| Backup verificado de producción | Snapshot restaurable antes de cualquier cambio futuro |

**Gate de salida:** CI verde, BD de prueba levanta con un comando, golden master congelado.
**Dependencias:** ninguna. Puede iniciar ya.

---

## Fase 1 — BBDD robusta + Autenticación + RBAC backend (≈2 semanas)

**Objetivo:** integridad de datos y control de acceso, sin romper el flujo actual.

| Entregable | Detalle |
|---|---|
| Migraciones aditivas de integridad | FKs, índices, `NOT NULL` donde aplique; normalización de liquidaciones→boletas→viajes (ver doc 06) |
| Tablas de identidad | `users`, `roles`, `permissions`, `role_permissions`, `user_roles` (ver RFC-001) |
| Autenticación | Login, hashing de contraseñas, emisión de token (JWT o sesión — ver RFC-001), refresh |
| Filtros CI4 por rol | Middleware `auth` + `role`/`permission` aplicado a rutas `api/admin/*` y operativas |
| Auditoría ampliada | `audit_logs` con `user_id`, `before/after`, sobre catálogos y liquidaciones |
| Seed de usuarios iniciales | Admin inicial + roles base |

**Gate de salida:** toda ruta sensible exige rol; suite de auth verde; migraciones reversibles probadas en BD de prueba; el flujo de carga/cálculo legacy sigue funcionando.
**Dependencias:** Fase 0.

---

## Fase 2 — Lógica de negocio + Tests robustos (≈2–2.5 semanas) ⚠️ BLOQUEADA

**Objetivo:** corregir los 5 ajustes de *Ajustes Sotelo* con el backend como fuente única y validación exhaustiva.

> **Bloqueo:** requiere cerrar las 4 decisiones de negocio de `05_Reglas_Negocio_Supuestos.md`. Hasta entonces se trabaja con supuestos documentados y tests parametrizados.

| Bloque | Ajuste | Archivos | Est. |
|---|---|---|---|
| 2.1 | Diésel por viaje (reusar campo "Peso") | `BoletaProcessor.php`, `PayrollCalculator.php`, `BoletaCard.jsx` | 2–3 d |
| 2.2 | Total = pago base + diésel a favor; unificar fórmula (backend única fuente) | `PayrollCalculator.php`, `BoletaCard.jsx`, `TripList.jsx`, `SummaryBar.jsx` | 1–2 d |
| 2.3 | Dedupe de cruces (1 pago por cruce físico) | `BoletaProcessor.php`, `PayrollCalculator.php`, `TabuladorModel.php` | 1.5–2 d |
| 2.4 | Exclusiones de pago base (Tri, GT, Zaragoza DTR, Fletes Sotelo) — catálogo en BD | `BoletaProcessor.php` + tabla `exclusiones_pago_base` | 1–2 d |
| 2.5 | Selector de rango de fechas (en vez de semanas) | `App.jsx`, `PeriodSelector.jsx`, `SummaryBar.jsx` | 1.5–2 d |
| 2.6 | Regresión contra nóminas reales pagadas | suite PHPUnit + datos de control | 2–3 d |

**Gate de salida:** los 6 criterios de aceptación de `PLAN_AJUSTES` cumplidos; cobertura ≥90% en Libraries; **100% de coincidencia** con el set de nóminas de control; frontend muestra exactamente el total del backend.
**Dependencias:** Fase 1 + decisiones de negocio (doc 05).

---

## Fase 3 — Panel administrativo + RBAC en frontend (≈2 semanas)

**Objetivo:** completar el panel admin (sobre `AdminSection.jsx` y `Controllers/Admin/*`) con gestión visual y flujo de aprobación.

| Entregable | Detalle |
|---|---|
| Gestión de usuarios y roles | CRUD de usuarios, asignación de roles desde UI |
| CRUD de catálogos | Tabulador (con versiones), rutas/distancias, keywords, rendimientos, **exclusiones** |
| Flujo de aprobación | Estados de liquidación (borrador→pendiente→aprobada/rechazada→cerrada) para Supervisor |
| UI condicionada por rol | Mostrar/ocultar acciones según permisos; rutas protegidas en React |
| Vista de auditoría | Bitácora consultable por Auditor/Admin |

**Gate de salida:** cada rol ve y puede hacer exactamente lo definido en la matriz de permisos (RFC-001); catálogos editables sin tocar código.
**Dependencias:** Fase 1 (RBAC backend); se beneficia de Fase 2 (estados de liquidación).

---

## Fase 4 — Mejora UI/UX (≈1.5 semanas)

**Objetivo:** conservar la identidad visual actual y elevar usabilidad y accesibilidad.

| Entregable | Detalle |
|---|---|
| Sistema de diseño ligero | Tokens (color/tipografía/espaciado) extraídos del estilo actual; consistencia |
| Estados y feedback | Loading, vacío, error, éxito; validación inline en captura |
| Jerarquía y flujo | Mejorar `BoletaCard`/`TripList`/`Dashboard` sin cambiar el "look" base |
| Accesibilidad WCAG 2.1 AA | Contraste, navegación por teclado, foco, tamaños táctiles |
| Responsividad | Breakpoints revisados para uso en distintos equipos de oficina |

**Gate de salida:** auditoría de accesibilidad AA sin bloqueantes; revisión de diseño aprobada; sin regresiones funcionales.
**Dependencias:** Fase 3.

---

## Fase 5 — Endurecimiento y corte a producción (≈1 semana)

**Objetivo:** llevar la reestructura a producción con seguridad.

| Entregable | Detalle |
|---|---|
| Migración con credenciales productivas | Aplicar migraciones aditivas en prod; verificar integridad |
| Hardening de seguridad | CORS, headers, rate limiting, revisión de permisos, secrets fuera del repo |
| Plan de despliegue y rollback | Procedimiento de corte, ventana, rollback documentado |
| Monitoreo y logs | Alertas básicas, retención de auditoría |
| Capacitación y handover | Guía de usuario por rol; actualización de `handover-tecnico.md` |

**Gate de salida:** sistema en producción, nómina de un periodo real procesada y conciliada, rollback probado.
**Dependencias:** Fases 2–4.

---

## Resumen de dependencias e hitos

| Hito | Significado |
|---|---|
| H0 | Entorno reproducible + red de seguridad de pruebas |
| H1 | Datos íntegros + acceso por rol en backend |
| **H-Negocio** | **Cliente confirma las 4 decisiones (doc 05)** — desbloquea Fase 2 |
| H2 | Cálculo correcto y verificado contra nóminas reales |
| H3 | Panel administrativo y RBAC end-to-end |
| H4 | UI/UX mejorada y accesible |
| H5 | En producción y conciliado |

> **Camino crítico:** H-Negocio → Fase 2 → Fase 5. Conviene gestionar la confirmación de las decisiones de negocio **en paralelo** a las Fases 0–1 para no retrasar el camino crítico.
