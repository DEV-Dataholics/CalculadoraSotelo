# Plan de Pruebas — Reestructura PayrollTool

| Campo | Valor |
|---|---|
| Proyecto | PayrollTool · Fletes Sotelo |
| Documento | 06 — Plan de Pruebas |
| Versión | 1.0 |
| Fecha | 2026-06-11 |
| Autor | David García |
| Depende de | [01b_reglas_negocio](../01-vision/02_reglas_negocio_supuestos.md), [07b_backlog](../07-roadmap/07b_backlog_user_stories.md) |

> **Premisa del cliente:** *"Fallas en la lógica de negocio y los cálculos no son negociables."* → la estrategia de pruebas prioriza la **exactitud del cálculo de nómina** por encima de todo.

---

## 1. Pirámide de pruebas

```
        ▲  E2E (pocas)  — flujo login→upload→cálculo→aprobación
       ╱ ╲
      ╱   ╲ Integración (medias) — controllers + BD (CI4 FeatureTest)
     ╱     ╲
    ╱───────╲ Unitarias (muchas) — Libraries de cálculo SIN BD
```

- **Unitarias (núcleo):** `PayrollCalculator`, `BoletaProcessor`, `PacificoDetector`, `RouteResolver`, y las nuevas `ExclusionResolver`/`CruceDeduplicator`/`DieselPerTrip`. Sin BD (ya se inyecta `TabuladorModel` opcional → ideal para mocks).
- **Integración:** controllers + MySQL de prueba (CI4 `FeatureTestTrait` + `DatabaseTestTrait`, transacciones con rollback).
- **E2E (mínimas):** un par de flujos críticos extremo a extremo.

---

## 2. Pruebas de regresión de nómina (lo más importante)

### 2.1 Golden master (Fase 0)
Antes de tocar la lógica, se **congela el comportamiento actual**: se corre el cálculo sobre los datasets de `importante/05_datos/` y se guardan los resultados como *snapshots*. Cualquier cambio que altere un snapshot debe ser **intencional y justificado**.

### 2.2 Set de control contra nóminas reales pagadas
Fuente: nóminas reales (Excel) provistas por Fletes Sotelo + `REVERSE_ENGINEERING_REPORT_2026-04-21.md`.

```gherkin
Escenario (parametrizado por cada boleta de control):
  Dada la boleta histórica "<archivo, operador, periodo>"
  Cuando se procesa con el motor reestructurado
  Entonces Total_Pay coincide con el total pagado real (tolerancia $0.00)
  Y cada componente (base, diésel a favor, cruces, bonos, estancias) coincide
```

Meta de aceptación de Fase 2: **100% de coincidencia** en el set de control.

### 2.3 Casos puntuales de los 5 ajustes

| Test | Verifica | Regla |
|---|---|---|
| `testTotalIncluyeDieselAFavor` | Total = base + diésel a favor | Ajuste 1 |
| `testDieselPorViajeIndependiente` | Dos viajes, dos precios distintos | Ajuste 4 |
| `testCruceSePagaUnaVez` | Ida+retorno = 1 pago de cruce | Ajuste 2 / R-006 |
| `testNivel3NoAplicaALocales` | Local sin cruce no recibe tarifa de cruce | Ajuste 2 |
| `testExclusionTriGtNoPaganBase` | Tri/GT/rutas base → base = 0 | Ajuste 3 |
| `testRangoFechasViajeQueCruzaSemanas` | Viaje sáb→lun aparece completo | Ajuste 5 |
| `testBonoDobleEs2439` | Bono Doble = $2,439 (R-018, no $1,726) | R-017/R-018 |
| `testLitrosPermitidos5Decimales` | Precisión 5 decimales | R-010 |
| `testSoloEstadosTerminadoCompleto` | Filtro de status Genesis | D-001 |
| `testFiltroPorUnidadNoPorNombre` | Agrupar por unidad | D-002 |
| `testKmTabuladosNoOdometro` | Usa km de tabla, no odómetro | D-005 |

> Los casos marcados *bloqueantes* en el backlog (B-2, B-3, B-4) se parametrizan: el test fija el **valor esperado según doc 05**; al confirmarse la decisión, solo se ajusta el dato esperado.

---

## 3. Pruebas de autenticación y autorización (Fase 1)

| Test | Verifica |
|---|---|
| `testLoginEmiteTokens` | Login correcto devuelve access + refresh |
| `testLoginCredencialesInvalidas` | 401 sin filtrar existencia de email |
| `testRutaProtegidaSinTokenDa401` | Sin token → 401 |
| `testOperadorNoPuedeAprobar403` | Permiso `liquidacion.approve` denegado a Operador (conductor) |
| `testOperadorNoPuedeSubirCSV403` | `liquidacion.upload` denegado a Operador (solo Admin) |
| `testConductorSoloVeSusViajes` | `liquidacion.view.own` devuelve solo los viajes propios |
| `testConductorNoVeViajesDeOtro403` | El conductor A no accede a liquidaciones del conductor B |
| `testAdminGestionaCatalogos` | Admin con `catalog.*.manage` opera CRUD |
| `testRefreshRotaYLogoutRevoca` | Ciclo de refresh/logout |

## 4. Pruebas de integración de datos (Fase 1–2)

- Migraciones `up()`/`down()` ejecutan sin error en MySQL de prueba.
- Backfill JSON→normalizado concilia totales (reporte de diferencias).
- FKs y unicidades se respetan (insertar duplicado/huérfano falla controladamente).

## 5. Frontend

- **Lint/build** en CI (`npm run lint`, `npm run build`).
- **Componentes** (sugerido Vitest + Testing Library): `BoletaCard` muestra el total del backend sin recalcular; `RoleGate` oculta acciones; validación inline del diésel por viaje.
- **Accesibilidad:** auditoría WCAG 2.1 AA en Fase 4 (contraste, teclado, foco, tamaños).

## 6. Herramientas y CI

| Capa | Herramienta |
|---|---|
| Backend unit/integration | PHPUnit 10.5 (ya en `composer.json`), Faker, vfsStream |
| BD de prueba | MySQL 8 en Docker / efímera en CI |
| Frontend | ESLint 9, Vite build; (sugerido) Vitest + Testing Library |
| CI | GitHub Actions: `composer test` + `npm ci && npm run lint && npm run build` en cada PR |

```yaml
# Ejemplo (esqueleto) .github/workflows/ci.yml
on: [pull_request]
jobs:
  backend:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8.4
        env: { MYSQL_ROOT_PASSWORD: rootpass, MYSQL_DATABASE: sotelo_payroll }
        ports: ['3306:3306']
        options: >-
          --health-cmd="mysqladmin ping" --health-interval=10s --health-retries=10
    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
        with: { php-version: '8.2' }
      - run: cd backend && composer install --no-interaction
      - run: cd backend && php spark migrate && composer test
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd frontend && npm ci && npm run lint && npm run build
```

---

## 7. Métricas de calidad (gates)

| Métrica | Gate |
|---|---|
| Cobertura de líneas en `app/Libraries/` (cálculo) | ≥ 90% |
| Coincidencia con set de control de nóminas | 100% (tolerancia $0.00) |
| Tests verdes en CI | 100% (bloquea merge) |
| Divergencias frontend↔backend en total | 0 |
| Vulnerabilidades de auth en pruebas | 0 |

---

## 8. Criterios de "listo para producción" (Fase 5)

- [ ] Set de control de nóminas pasa al 100%.
- [ ] Cobertura del núcleo ≥ 90%.
- [ ] Auth/RBAC probados (acceso y denegación).
- [ ] Migraciones reversibles verificadas y backfill conciliado.
- [ ] Una nómina de un periodo real procesada y conciliada manualmente con el cliente.
