# CLAUDE.md — PayrollTool (Fletes Sotelo)

Guía operativa para trabajar en la reestructura de este sistema. Léela completa antes de escribir código.

## Qué es esto

**PayrollTool** procesa la **nómina foránea** de Fletes Sotelo: ingiere CSV exportados de **Genesis**, agrupa los movimientos por **boleta** (por unidad), clasifica cada pierna por segmento (**FCH** = Foráneo Chihuahua, **PAC** = Pacífico, **LOCAL/CRUCE**), resuelve tarifas y calcula el pago de cada operador. El resultado es una **liquidación** revisable y aprobable.

El núcleo del dominio es el **cálculo de pago**: una operación donde un error = dinero mal pagado. Por eso el backend es la **única fuente de verdad** del cálculo y todo se valida contra **nóminas reales pagadas**.

## Stack (no improvisar otro)

| Capa | Tecnología |
|---|---|
| Backend | **CodeIgniter 4.7** (PHP 8.2) — API REST JSON (`backend/`) |
| Frontend | **React 19 + Vite 7 + Tailwind 4** — SPA (`frontend/`) |
| Base de datos | **MySQL 8** — única fuente de verdad (robustecida en esta reestructura) |
| Autenticación | **JWT** de vida corta + refresh token (ver doc 04) |
| BD de prueba | **Docker** (MySQL 8 + Adminer) — ver `03-datos/docker/` |
| Pruebas | **PHPUnit** (lógica de nómina) · ESLint/Vite (frontend) |
| Despliegue | VPS Linux — prod `nomina-sotelo.dataholics.com.mx` |

## Reglas no negociables

1. **El cliente nunca es de fiar.** Toda validación de negocio y autorización vive en CI4. React solo da UX previa.
2. **MySQL es la única fuente de verdad** de identidad, autorización y dominio.
3. **El backend es la única fuente de verdad del cálculo.** El frontend **no recalcula** totales: muestra `Total_Pay` del backend (ADR-003). Eliminar el recálculo de `BoletaCard.jsx`.
4. **Los cálculos no se equivocan.** Ningún cambio en la lógica de nómina se mergea sin pasar el **set de control** de nóminas reales (100% de coincidencia, tolerancia $0.00) y mantener cobertura ≥90% en `app/Libraries/`.
5. **Evolución incremental, no reescritura.** Migraciones **aditivas y reversibles** (`up()`/`down()` reales); el motor legacy se conserva como fallback hasta cerrar la fase. Sin `DROP` en el corte inicial a producción.
6. **Autorización por permiso, no por nombre de rol** (RBAC). Denegación por defecto. Filtros CI4 en toda ruta sensible.
7. **Catálogos administrables, no hardcodeados** (tabulador, rutas, keywords, rendimientos, **exclusiones de pago base**).
8. **Todo cambio sensible se audita** en `audit_logs` con `user_id`, antes/después e IP.
9. **Secretos solo por entorno** (`.env` / secret manager), nunca versionados. Las credenciales de producción no van al repo.

## Arquitectura en capas (backend)

`Filters` (CORS, auth, permission) → `Controllers` delgados → `Validation`/DTO → `Libraries` (lógica de negocio **pura**, testeable sin BD) → `Models` (acceso a datos, `$allowedFields`) → MySQL. La matemática de nómina vive en `Libraries` y no toca HTTP.

## Comandos

```bash
# Infra local (BD de prueba)
cd 03-datos/docker && cp .env.example .env && docker compose up -d

# Backend (backend/)
composer install
cp env .env                  # configurar conexión a MySQL de Docker
php spark migrate            # esquema (doc 03)
php spark db:seed RolesPermisosSeeder
php spark db:seed AdminUserSeeder
php spark serve              # API en http://localhost:8080
composer test               # PHPUnit (lógica de nómina)

# Frontend (frontend/)
npm install
npm run dev                  # SPA en http://localhost:5173
npm run build
npm run lint
```

## Orden de lectura de la documentación

1. `README.md` — panorama e índice.
2. `01-vision/01_SRS_PRD.md` — qué hace el sistema (requisitos, roles, máquina de estados).
3. `01-vision/02_reglas_negocio_supuestos.md` — **dominio crítico** + 4 decisiones bloqueantes.
4. `02-arquitectura/02_arquitectura_sistema.md` + ADR-001…008 — cómo y por qué.
5. `03-datos/03_modelo_de_datos.md` y `05-api/05_especificacion_api.md` — referencia de implementación.
6. `04-seguridad/04_plan_de_seguridad.md` — **lectura obligatoria** antes de tocar flujos sensibles.
7. `06-pruebas/06_plan_de_pruebas.md` — red de seguridad y Definición de Hecho.
8. `07-roadmap/07_roadmap_fases.md` — orden seguro de construcción (Fase 0 → 5).

> Los ADR registran decisiones. Si un documento contradice un ADR, **prevalece el ADR**.

## Orden de construcción (resumen del roadmap)

Fase 0 Fundaciones (Docker, CI, golden master) → 1 BD robusta + Auth + RBAC → 2 Lógica de cálculo + tests (**bloqueada** por las 4 decisiones de negocio) → 3 Panel admin + RBAC frontend → 4 UI/UX → 5 Endurecimiento + corte a producción. **Nunca** construir una funcionalidad sensible antes que su control de seguridad.

## Definición de Hecho (por historia)

Pasa estática/lint, tiene pruebas unitarias y de feature que cubren sus criterios de aceptación, las pruebas de cálculo contra nóminas reales pasan (cuando aplica), no introduce divergencia frontend↔backend ni N+1 en rutas calientes, los cambios de BD van por migración reversible, y la documentación afectada queda actualizada.

## Valores de negocio a fijar (ver doc 01b — BLOQUEANTE)

1. Definición exacta del **Total** (¿cruces/bonos dentro del pago base o sumandos aparte?) + ejemplo numérico real.
2. **Bono Doble:** $2,439 (vigente, validado) vs $1,726 (alternativa) — confirmar y/o regla por ruta.
3. Regla de **deduplicación de cruce** (por boleta / cruce físico / folio-coordenada).
4. Lista completa de **exclusiones de pago base** (Tri, GT, Zaragoza DTR, Fletes Sotelo, ¿más?).

## Estructura de la documentación

```
Reestructura Sotelo/
├── README.md            ← panorama e índice
├── CLAUDE.md            ← este archivo
├── 01-vision/           SRS/PRD, reglas de negocio, design system
├── 02-arquitectura/     arquitectura + ADR-001…008
├── 03-datos/            modelo de datos, plan de migración, docker/
├── 04-seguridad/        RBAC, auth, OWASP, auditoría
├── 05-api/              especificación de endpoints
├── 06-pruebas/          plan de pruebas
├── 07-roadmap/          roadmap por fases, backlog, riesgos
└── 08-ux/               plan de mejoras UX
```
