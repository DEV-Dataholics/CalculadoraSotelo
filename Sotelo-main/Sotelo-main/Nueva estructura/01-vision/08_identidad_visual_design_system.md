# Identidad Visual y Design System

| Campo | Valor |
|---|---|
| Proyecto | PayrollTool · Fletes Sotelo |
| Documento | 08 — Identidad Visual y Design System |
| Versión | 1.0 |
| Fecha | 2026-06-11 |
| Fuente | Estilo actual del frontend (`frontend/src/index.css`, componentes) |

> **Principio:** conservar el lenguaje visual actual (limpio, profesional, blue-grey/navy) y formalizarlo como tokens reutilizables. La reestructura **no cambia el "look"**, lo ordena y lo hace consistente y accesible (ver doc 09).

---

## 1. Marca y tono visual

Interfaz de herramienta operativa de nómina: sobria, densa en datos pero legible, sin elementos decorativos. Paleta **blue-grey / navy** sobre fondos claros, con acentos de color reservados para **estados** (éxito, advertencia, error, info). Los tokens ya existen en `:root` como variables CSS en espacio **OKLCH**; se conservan y se mapean a Tailwind 4 vía `@theme`.

---

## 2. Paleta de color (tokens actuales)

### Fondos y superficies
| Token | Valor (OKLCH) | Uso |
|---|---|---|
| `--bg` | `oklch(96.5% 0.006 240)` | fondo de la app |
| `--bg-2` | `oklch(94% 0.008 240)` | fondo secundario |
| `--surface` | `oklch(100% 0 0)` | tarjetas, paneles |
| `--surface-2` | `oklch(98.5% 0.004 240)` | superficie sutil |

### Bordes
| Token | Valor | Uso |
|---|---|---|
| `--border` | `oklch(90% 0.008 240)` | borde estándar |
| `--border-md` | `oklch(84% 0.012 240)` | borde de mayor contraste |

### Texto (escala slate)
| Token | Valor | Uso |
|---|---|---|
| `--ink-1` | `oklch(15% 0.018 240)` | texto principal |
| `--ink-2` | `oklch(35% 0.014 240)` | texto secundario |
| `--ink-3` | `oklch(55% 0.010 240)` | texto terciario / labels |
| `--ink-4` | `oklch(70% 0.007 240)` | texto deshabilitado / hints |

### Primario (navy / slate-900)
| Token | Valor | Uso |
|---|---|---|
| `--primary` | `oklch(22% 0.030 255)` | CTA, encabezados, elementos activos |
| `--primary-light` | `oklch(30% 0.028 255)` | hover del primario |
| `--primary-muted` | `oklch(96% 0.014 240)` | fondo suave del primario |
| `--primary-border` | `oklch(84% 0.022 240)` | borde del primario |

### Acento (azul) y estados
| Token | Valor | Uso |
|---|---|---|
| `--blue` / `--blue-bg` / `--blue-bd` | `oklch(54% 0.160 252)` … | info, acento |
| `--emerald` / `-bg` / `-bd` | `oklch(52% 0.145 162)` … | éxito / aprobado |
| `--amber` / `-bg` / `-bd` | `oklch(70% 0.148 65)` … | advertencia / pendiente |
| `--red` / `-bg` | `oklch(52% 0.185 27)` … | error / rechazado |

> Mapeo a estados de liquidación (doc 01): BORRADOR = slate · PENDIENTE = amber · APROBADA = emerald · RECHAZADA/CERRADA = red/slate.

---

## 3. Tipografía

| Rol | Familia | Pesos |
|---|---|---|
| Display / UI | **Inter** (`--font-display`, `--font`) | 300–800 |
| Monoespaciada (cifras, montos, folios) | **DM Mono** (`--mono`) | 400, 500 |

- Base: `html { font-size: 14px }` — interfaz densa, apropiada para tablas de nómina.
- Usar `--mono` para montos, kilómetros, litros y folios (alineación de cifras).

---

## 4. Forma, radios y sombras

| Grupo | Tokens |
|---|---|
| Radios | `--r-xs:4px` · `--r-sm:8px` · `--r:10px` · `--r-lg:14px` · `--r-xl:18px` · `--r-2xl:22px` |
| Sombras | `--sh-xs` · `--sh-sm` · `--sh` · `--sh-lg` (sombras suaves slate, sin negros duros) |

---

## 5. Componentes base (existentes)

`BoletaCard`, `TripCard`, `TripList`/`TripListHeader`, `DashboardKPIs`, `SummaryBar`, `FileUpload`, `PeriodSelector`, `Sidebar`, `AdminSection`, `WorkflowGuide`. Se **conservan y refinan** (doc 09), no se reescriben.

> Nota: hoy conviven tokens CSS (`:root`) con clases utilitarias Tailwind dispersas (`text-slate-500`, `bg-slate-900`, `bg-blue-500`, etc.). La acción de design system es **unificar**: mapear los tokens en `@theme` de Tailwind 4 y reemplazar valores sueltos por tokens, para una sola fuente de verdad visual.

---

## 6. Reglas de consistencia (lint visual)

1. Usar **tokens**, no valores hex/oklch sueltos en componentes.
2. Color de estado **solo** para estados; el primario navy para acción.
3. Cifras (monto/km/litros) siempre en `--mono`.
4. Contraste mínimo **WCAG AA** (texto normal ≥ 4.5:1) — verificar `--ink-3`/`--ink-4` sobre fondos claros (ver doc 09).
5. Retirar `SHOW_NEW_BADGES` (flag temporal en `constants.js`) cuando el cliente apruebe la revisión visual.

---

## 7. Pendiente

- [ ] Mapear tokens `:root` → `@theme` de Tailwind 4 (centralizar).
- [ ] Auditar contraste de `--ink-3`/`--ink-4` y estados (doc 09).
- [ ] Definir guía de espaciado (escala de `gap`/`padding`) — hoy implícita.
