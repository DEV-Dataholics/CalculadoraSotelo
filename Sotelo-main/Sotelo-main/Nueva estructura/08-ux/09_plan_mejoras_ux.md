# Plan de Mejoras UX/UI

| Campo | Valor |
|---|---|
| Proyecto | PayrollTool · Fletes Sotelo |
| Documento | 09 — Plan de Mejoras UX/UI |
| Versión | 1.0 |
| Fecha | 2026-06-11 |
| Fase | 4 (post lógica y panel) |
| Depende de | [08_design_system](../01-vision/08_identidad_visual_design_system.md), [07b_backlog](../07-roadmap/07b_backlog_user_stories.md) (Épica D) |

> **Objetivo:** conservar la identidad visual actual y elevar usabilidad, claridad y accesibilidad. Sin regresiones funcionales. El backend sigue siendo la fuente de verdad del cálculo (ADR-003).

---

## 1. Principios

1. **No romper el "look".** Mejorar jerarquía, estados y consistencia sobre el estilo navy/blue-grey existente.
2. **Densidad legible.** Es una herramienta de nómina: muchos datos, pero escaneables.
3. **Evitar errores de captura.** Validación inline y feedback inmediato donde se ingresa dinero (diésel por viaje, bonos).
4. **Accesibilidad AA** como criterio de aceptación, no como extra.

---

## 2. Líneas de mejora

### 2.1 Sistema de diseño y consistencia
- Mapear tokens `:root` → `@theme` de Tailwind 4; reemplazar utilidades sueltas (`text-slate-500`, `bg-blue-500`, …) por tokens.
- Unificar tarjetas/botones/inputs a un set consistente de radios, sombras y estados.

### 2.2 Estados y feedback
- Estados explícitos: **cargando** (skeletons en listas/boletas), **vacío** (sin viajes en el rango), **error** (fallo de upload/cálculo), **éxito** (guardado/aprobado).
- Indicador de "**recalculando**" cuando una edición dispara `/api/calculate` (consecuencia de ADR-003).

### 2.3 Captura sin errores (lo crítico)
- Validación inline del **diésel por viaje** (ex campo "Peso"): numérico, rango razonable, marca "referencia vs capturado".
- Confirmaciones para acciones sensibles (enviar, aprobar, cerrar liquidación).
- Mostrar el desglose del total (base + diésel a favor + cruces + bonos) para que el operador entienda el número.

### 2.4 Flujo y jerarquía
- Refinar `BoletaCard`/`TripList`/`DashboardKPIs`/`SummaryBar` sin cambiar su esencia.
- **Selector de rango de fechas** (ADR-008) reemplaza al `PeriodSelector` de semanas, con presets ("esta semana", "rango personalizado").
- `WorkflowGuide` alineado al flujo de estados de liquidación.

### 2.5 UI por rol (con Fase 3)
- Ocultar acciones no permitidas (`RoleGate`); el Operador (conductor) solo ve "Mis viajes".
- Vistas dedicadas: carga + captura + administración (**Admin**), revisión/aprobación (**Supervisor**), **seguimiento de "Mis viajes"** (**Operador/conductor**, solo lectura), consulta global (**Auditor**).

### 2.6 Accesibilidad (WCAG 2.1 AA)
- Contraste: auditar `--ink-3`/`--ink-4` y badges de estado sobre fondos claros.
- Navegación completa por teclado con foco visible.
- Tamaños táctiles/clic adecuados; labels asociados a inputs; mensajes de error programáticamente vinculados.

### 2.7 Responsividad
- Revisar breakpoints para uso en equipos de oficina (pantallas medianas/grandes); tablas con scroll controlado.

---

## 3. Criterios de aceptación de la fase

- [ ] Auditoría de accesibilidad AA sin bloqueantes.
- [ ] Tokens centralizados en `@theme`; cero valores de color sueltos en componentes nuevos/refactorizados.
- [ ] Estados (loading/vacío/error/éxito) presentes en upload, listado y boleta.
- [ ] Validación inline del diésel por viaje impide guardar valores inválidos.
- [ ] Sin regresiones funcionales (suite de Fase 2 sigue verde).
- [ ] `SHOW_NEW_BADGES` retirado tras aprobación visual del cliente.

---

## 4. Fuera de alcance (UX)
- Rediseño total de la marca o cambio de paleta.
- Modo oscuro (evaluable como mejora futura).
- App móvil.
