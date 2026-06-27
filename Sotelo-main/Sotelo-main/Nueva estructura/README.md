# PayrollTool — Fletes Sotelo · Documentación Técnica del Proyecto
### Sistema de Nómina Foránea · Reestructura por Fases

> Sistema que procesa archivos de nómina (CSV de Genesis), calcula pagos de viajes (FCH, Pacífico, Local/Cruce) y produce liquidaciones. Esta documentación de ingeniería guía la **reestructura por fases**: panel administrativo + roles, BBDD robusta, lógica de cálculo correcta con pruebas, y mejora de UI/UX.

| | |
|---|---|
| **Cliente** | Fletes Sotelo · Ciudad Juárez, Chihuahua |
| **Responsable técnico** | David García (Dataholics) |
| **Estado** | Documentación de reestructura — pendiente de aprobación para iniciar Fase 0 |
| **Versión doc.** | 1.0 |
| **Fecha** | 11 de junio de 2026 |

> **Principio rector.** Esta reestructura es **evolución incremental, no reescritura**: migraciones aditivas/reversibles, el motor de cálculo legacy se conserva como fallback durante la transición, y el panel admin existente (`Controllers/Admin/*` + `AdminSection.jsx`) se **extiende**, no se reemplaza. Cada fase cierra con verificación contra nóminas reales.

---

## Stack tecnológico (confirmado)

| Capa | Tecnología | Versión (jun-2026) |
|---|---|---|
| Backend | **CodeIgniter** (API REST JSON) | 4.7.x |
| Lenguaje | PHP | 8.2+ |
| Frontend | **React + Vite** | React 19 · Vite 7 |
| Estilos | Tailwind CSS | 4.x |
| Base de datos (fuente de verdad) | **MySQL** (robustecida) | 8.x |
| Autenticación | JWT de vida corta + refresh token (ver ADR-005 / doc 04) | — |
| BD de prueba | Docker (MySQL 8 + Adminer) | ver `03-datos/docker/` |
| Pruebas | PHPUnit (backend) · ESLint/Vite (frontend) | — |
| Despliegue | VPS Linux — producción `nomina-sotelo.dataholics.com.mx` | HTTPS |

**Arquitectura:** cliente-servidor desacoplado. La SPA React consume la API REST de CodeIgniter 4. **MySQL es la única fuente de verdad**; el **backend es la única fuente de verdad del cálculo** (el frontend no recalcula totales — ADR-003). **El cliente nunca es de fiar**: toda regla de negocio y autorización vive en CI4.

---

### Código fuente

El código real del sistema vive en el repositorio `Sotelo-main/`: `backend/` (CodeIgniter 4) y `frontend/` (React + Vite). La estructura objetivo de carpetas se describe en el documento **02 (Arquitectura)**. Antes de codificar, lee **`CLAUDE.md`** — es el punto de entrada con el stack, las reglas no negociables, los comandos y el orden de lectura.

---

## Índice de documentos

| # | Documento | Contenido |
|---|---|---|
| 01 | [SRS / PRD](01-vision/01_SRS_PRD.md) | Problema, objetivos, usuarios y roles, scope, máquina de estados de liquidación, métricas de éxito |
| 01b | [Reglas de Negocio y Supuestos](01-vision/02_reglas_negocio_supuestos.md) | Reglas de pago (RULE_LEDGER) y las **4 decisiones bloqueantes** a confirmar con el cliente |
| 08 | [Identidad Visual y Design System](01-vision/08_identidad_visual_design_system.md) | Tokens extraídos del estilo actual, tipografía, componentes, reglas de consistencia |
| 02 | [Arquitectura del Sistema](02-arquitectura/02_arquitectura_sistema.md) | Capas CI4 + React, API REST, organización de carpetas, seguridad transversal, entornos |
| 02·ADR | [ADR-001 … ADR-008](02-arquitectura/) | Decisiones de arquitectura (MySQL, evolución incremental, backend fuente única, RBAC, auth, exclusiones, normalización, rango de fechas) |
| 03 | [Modelo de Datos](03-datos/03_modelo_de_datos.md) | ERD, tablas nuevas (usuarios/roles/permisos, boletas/viajes, exclusiones), DDL, índices, seeds |
| 03b | [Plan de Migración](03-datos/03b_plan_migracion.md) | Estrategia expand→migrate→contract, backfill, doble escritura, despliegue seguro |
| 03·docker | [BD de prueba con Docker](03-datos/docker/README_Docker.md) | `docker-compose`, `.env.example`, guía de arranque |
| 04 | [Plan de Seguridad](04-seguridad/04_plan_de_seguridad.md) | RBAC (roles × permisos), autenticación JWT, OWASP, auditoría, manejo de secretos |
| 05 | [Especificación de la API](05-api/05_especificacion_api.md) | Endpoints REST, contratos, códigos de estado, autorización por permiso, errores |
| 06 | [Plan de Pruebas](06-pruebas/06_plan_de_pruebas.md) | Pirámide, regresión contra nóminas reales, casos de los 5 ajustes, CI, gates |
| 07 | [Roadmap por Fases](07-roadmap/07_roadmap_fases.md) | 6 fases, hitos, dependencias, camino crítico |
| 07b | [Backlog · User Stories](07-roadmap/07b_backlog_user_stories.md) | Épicas, historias con criterios BDD/Gherkin, story points |
| 07c | [Matriz de Riesgos](07-roadmap/07c_matriz_riesgos.md) | Risk register, probabilidad × impacto, mitigación |
| 09 | [Plan de Mejoras UX](08-ux/09_plan_mejoras_ux.md) | Mejora de usabilidad y accesibilidad conservando el estilo actual |

---

## Decisiones clave de la reestructura

| Tema | Decisión | Referencia |
|---|---|---|
| Motor de BD | Mantener **MySQL** y robustecer (no migrar) | ADR-001 |
| Estrategia | **Evolución incremental**, no reescritura | ADR-002 |
| Cálculo | **Backend = fuente única**; el frontend no recalcula | ADR-003 |
| Acceso | **RBAC**: Admin, Operador, Supervisor/Aprobador, Auditor | ADR-004 / doc 04 |
| Autenticación | **JWT** de vida corta + refresh token | ADR-005 / doc 04 |
| Exclusiones de pago base | Catálogo **administrable** (no hardcodeado) | ADR-006 |
| Nómina | Normalizar **liquidación → boleta → viaje** | ADR-007 |
| Periodo | Filtro por **rango de fechas** (no semana ISO) | ADR-008 |

---

## Cómo leer esta documentación

1. Empieza por el **SRS/PRD (01)** para entender qué hace el sistema, sus roles y la máquina de estados.
2. Lee las **Reglas de Negocio (01b)** — el corazón del dominio; ahí están las **4 decisiones bloqueantes**.
3. Sigue con la **Arquitectura (02)** y los **ADR** para entender cómo y por qué.
4. El **Modelo de Datos (03)** y la **API (05)** son la referencia de implementación.
5. El **Plan de Seguridad (04)** es de lectura obligatoria antes de codificar cualquier flujo sensible.
6. El **Plan de Pruebas (06)** define la red de seguridad y la Definición de Hecho.
7. El **Roadmap (07)** marca el orden seguro de construcción.

---

## Consistencia y trazabilidad

Cada ajuste de *Ajustes Sotelo* se mapea a una regla de negocio (01b), un cambio de datos (03), una historia con criterios de aceptación (07b) y casos de prueba (06). Las decisiones de arquitectura quedan registradas como ADR. Los valores de negocio en disputa (p. ej. Bono Doble $2,439 vs $1,726) se documentan de forma única y consistente en todos los documentos.

---

## Bloqueo y próximos pasos

> ⚠️ La **Fase 2 (lógica de cálculo)** está bloqueada hasta cerrar las **4 decisiones de negocio** del documento 01b. Las Fases 0–1 (Docker, BD robusta, auth/RBAC) **no** dependen de ellas y pueden iniciar de inmediato.

- [ ] Cliente confirma las 4 decisiones de negocio (doc 01b) y entrega nóminas reales de control.
- [ ] Confirmar autenticación JWT + refresh (RFC en doc 04).
- [ ] Provisionar BD de prueba con Docker (doc 03·docker).
- [ ] Arrancar **Fase 0 — Fundaciones**.

---

*Documentación técnica de PayrollTool · Fletes Sotelo · v1.0 · 11-jun-2026*
