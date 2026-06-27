# Backlog — Épicas, Historias de Usuario y Criterios de Aceptación

| Campo | Valor |
|---|---|
| Proyecto | PayrollTool · Fletes Sotelo |
| Documento | 07b — Backlog / User Stories |
| Versión | 1.0 |
| Fecha | 2026-06-11 |
| Autor | David García |
| Depende de | [07_roadmap_fases](07_roadmap_fases.md), [06_plan_de_pruebas](../06-pruebas/06_plan_de_pruebas.md) |

> **Convenciones:** historias en formato estándar, criterios en Gherkin (Dado/Cuando/Entonces), estimación en Story Points (Fibonacci: 1,2,3,5,8,13). DoD global al final.

---

## Definition of Done (global, aplica a TODAS las historias)

- Código en PR revisado y aprobado.
- Pruebas automatizadas verdes (PHPUnit / lint frontend) en CI.
- Sin regresiones en la suite de cálculo de nómina.
- Cambios de BD vía migración aditiva y reversible.
- Documentación/decisión actualizada si aplica (ADR/RFC).
- Desplegado en BD de prueba (Docker) y verificado.

---

## ÉPICA A — Identidad y Control de Acceso (Fase 1)

### A-1 · Login de usuario · **3 SP**
> Como **usuario del sistema**, quiero iniciar sesión con email y contraseña, para acceder según mi rol.

```gherkin
Escenario: Login exitoso
  Dado un usuario activo con email "nomina@sotelo.com" y contraseña válida
  Cuando envío POST /api/v1/auth/login con esas credenciales
  Entonces recibo 200 con un access token y un refresh token
  Y el access token contiene mi id y mis permisos

Escenario: Credenciales inválidas
  Dado un email registrado con contraseña incorrecta
  Cuando intento iniciar sesión
  Entonces recibo 401 y un mensaje genérico "credenciales inválidas"
  Y no se revela si el email existe

Escenario: Usuario inactivo
  Dado un usuario con is_active = 0
  Cuando inicia sesión con credenciales correctas
  Entonces recibo 403 "cuenta deshabilitada"
```

### A-2 · Autorización por permiso en la API · **5 SP**
> Como **dueño del sistema**, quiero que cada endpoint sensible exija un permiso, para impedir accesos no autorizados.

```gherkin
Escenario: Acceso permitido
  Dado un usuario con rol Admin (permiso catalog.tabulador.manage)
  Cuando hace POST /api/v1/admin/tabulador
  Entonces la operación se ejecuta (201)

Escenario: Acceso denegado por rol
  Dado un usuario con rol Operador (sin catalog.tabulador.manage)
  Cuando hace POST /api/v1/admin/tabulador
  Entonces recibe 403 "no autorizado"
  Y queda registrado el intento en audit_logs

Escenario: Sin token
  Dado un request sin Authorization
  Cuando llama a una ruta protegida
  Entonces recibe 401
```

### A-3 · Refresh y logout de token · **3 SP**
> Como **usuario**, quiero renovar mi sesión y cerrarla, para mantener seguridad sin re-loguearme constantemente.

```gherkin
Escenario: Renovar access token
  Dado un refresh token válido y no revocado
  Cuando hago POST /api/v1/auth/refresh
  Entonces recibo un nuevo access token y el refresh rota

Escenario: Logout revoca refresh
  Dado una sesión activa
  Cuando hago POST /api/v1/auth/logout
  Entonces el refresh token queda revocado
  Y un intento posterior de refresh devuelve 401
```

### A-4 · Gestión de usuarios y roles (Admin) · **5 SP**
> Como **Admin**, quiero crear usuarios y asignarles roles, para administrar quién accede a qué.

```gherkin
Escenario: Crear usuario con rol
  Dado que soy Admin
  Cuando creo un usuario con email único y le asigno rol "operador"
  Entonces el usuario puede iniciar sesión con permisos de Operador

Escenario: Email duplicado
  Cuando creo un usuario con un email ya registrado
  Entonces recibo 422 y el detalle del campo email
```

---

## ÉPICA B — Lógica de Negocio Correcta (Fase 2) ⚠️ requiere doc 05

### B-1 · Diésel por viaje (campo ex-"Peso") · **5 SP** · *Ajuste 4*
> Como **Admin**, quiero capturar el precio de diésel por cada viaje, para que el cálculo use el rendimiento real de ese viaje.

```gherkin
Escenario: Captura de diésel por viaje
  Dada una boleta con dos viajes del mismo operador
  Cuando capturo $18.46 en el viaje 1 y $14.85 en el viaje 2
  Entonces el diésel a favor de cada viaje se calcula con su propio precio
  Y el precio global queda solo como fallback visible

Escenario: Sin captura usa fallback
  Dado un viaje sin precio de diésel capturado
  Cuando se calcula
  Entonces se usa el precio de referencia del segmento como fallback
  Y la UI lo marca como "referencia, no capturado"
```

### B-2 · Total = pago base + diésel a favor · **5 SP** · *Ajuste 1 + ADR-003*
> Como **Admin**, quiero que el total de la boleta sea exactamente *pago base + diésel a favor*, para liquidar correctamente.

```gherkin
Escenario: Total incluye diésel a favor
  Dada una boleta con pago base = $1,000 y diésel a favor capturado = $250
  Cuando el backend calcula el total
  Entonces Total_Pay = $1,250
  Y el frontend muestra exactamente ese total (sin recálculo local)

Escenario: Frontend no diverge del backend
  Dado cualquier cambio en la boleta
  Cuando se recalcula vía /api/calculate
  Entonces el total mostrado es idéntico al devuelto por backend
```
> **Nota:** la definición exacta (si cruces/bonos van *dentro* del pago base o como sumandos) está en doc 05, decisión 1 — **bloqueante**.

### B-3 · Dedupe de cruces (1 pago por cruce físico) · **8 SP** · *Ajuste 2*
> Como **nómina**, quiero que cada cruce físico se pague una sola vez, para no duplicar los $500.

```gherkin
Escenario: Cruce con ida y retorno
  Dado un cruce físico representado por 2 filas (ida + retorno por Zaragoza)
  Cuando se calcula el pago de cruce
  Entonces se paga UNA sola vez (no $500 × 2)

Escenario: Nivel 3 del tabulador no aplica a locales
  Dado un movimiento local sin cruce
  Cuando el tabulador resuelve la tarifa
  Entonces NO se le asigna tarifa de cruce
```
> **Nota:** la regla exacta de deduplicación (por boleta / cruce físico / folio-coordenada) está en doc 05, decisión 3 — **bloqueante**.

### B-4 · Exclusiones de pago base · **5 SP** · *Ajuste 3 + ADR-006*
> Como **Admin**, quiero administrar qué coordenadas/rutas no pagan base, para corregir el cálculo sin tocar código.

```gherkin
Escenario: Coordenada Tri no paga base
  Dado que "TRI" está en exclusiones_pago_base (tipo COORDENADA)
  Cuando se procesa una pierna con esa coordenada
  Entonces su pago base = 0

Escenario: Ruta base no paga base
  Dado que "ZARAGOZA DTR" y "FLETES SOTELO" están excluidas (tipo RUTA)
  Cuando se procesan esas piernas
  Entonces no suman $110/$55

Escenario: Admin agrega una exclusión
  Dado que soy Admin
  Cuando agrego "GT" como exclusión por coordenada
  Entonces los cálculos siguientes la respetan sin desplegar código
```
> **Nota:** la lista definitiva está en doc 05, decisión 4 — **bloqueante**.

### B-5 · Filtro por rango de fechas · **5 SP** · *Ajuste 5 + ADR-008*
> Como **Admin**, quiero filtrar por rango de fechas en vez de semana, para procesar viajes que cruzan periodos.

```gherkin
Escenario: Viaje que cruza semanas
  Dado un viaje foráneo que va del sábado al lunes (dos semanas ISO)
  Cuando filtro por el rango que lo contiene
  Entonces el viaje aparece completo en la liquidación

Escenario: Selector de rango
  Dado el panel de liquidación
  Cuando elijo "de 01/06 a 07/06"
  Entonces se listan los viajes cuya fecha cae en ese rango
  Y "semana de nómina" se muestra solo como dato informativo
```

---

## ÉPICA C — Panel Administrativo + Flujo de Aprobación (Fase 3)

### C-1 · CRUD de catálogos desde el panel · **8 SP**
> Como **Admin**, quiero gestionar tabulador, rutas, keywords, rendimientos y exclusiones desde la UI, para mantener las reglas sin desarrollador.

```gherkin
Escenario: Editar una tarifa del tabulador
  Dado que soy Admin en la sección Tabulador
  Cuando edito el pago_operador de una tarifa y guardo
  Entonces el cambio se persiste, se versiona y queda en auditoría
```

### C-2 · Flujo de aprobación de liquidaciones · **8 SP**
> Como **Supervisor**, quiero aprobar o rechazar una liquidación, para que ningún pago salga sin revisión.

```gherkin
Escenario: Aprobar liquidación
  Dada una liquidación en estado PENDIENTE
  Cuando el Supervisor la aprueba
  Entonces pasa a APROBADA y queda registrado quién y cuándo

Escenario: Operador (conductor) no puede aprobar
  Dado un usuario Operador (conductor)
  Cuando intenta aprobar una liquidación
  Entonces recibe 403 (segregación de funciones)

Escenario: Rechazo devuelve a borrador
  Dada una liquidación PENDIENTE
  Cuando el Supervisor la rechaza con un motivo
  Entonces vuelve a BORRADOR con el motivo visible para el Admin
```

### C-3 · Vista de auditoría · **3 SP**
> Como **Auditor**, quiero consultar la bitácora de cambios, para rastrear quién modificó qué.

```gherkin
Escenario: Filtrar bitácora
  Dado que soy Auditor
  Cuando filtro audit_logs por usuario y rango de fechas
  Entonces veo las acciones con autor, entidad y antes/después
  Y no puedo modificar ningún registro
```

### C-4 · UI condicionada por rol · **5 SP**
> Como **usuario**, quiero ver solo las acciones que mi rol permite, para una experiencia clara y segura.

```gherkin
Escenario: Operador (conductor) solo ve sus viajes
  Dado un Operador (conductor) autenticado
  Cuando abre la aplicación
  Entonces solo ve "Mis viajes" (seguimiento propio)
  Y no aparecen "Carga de CSV", "Usuarios", "Catálogos" ni "Aprobar"
```

### C-5 · Seguimiento de viajes del Operador (conductor) · **5 SP**
> Como **Operador (conductor)**, quiero ver el seguimiento de mis propios viajes y mi liquidación, para conocer mi pago sin poder modificar nada.

```gherkin
Escenario: El conductor ve solo sus viajes
  Dado un conductor autenticado vinculado a su unidad/registro
  Cuando abre "Mis viajes"
  Entonces ve únicamente los viajes y liquidaciones asociados a él
  Y el backend filtra por su identidad (no por un parámetro del cliente)

Escenario: El conductor no puede modificar
  Dado un conductor viendo su liquidación
  Cuando intenta editar o recalcular
  Entonces la acción no está disponible y el backend la deniega (403)

Escenario: Aislamiento entre conductores
  Dado el conductor A
  Cuando solicita una liquidación del conductor B (por id)
  Entonces recibe 403/404 (no puede ver datos de otros)
```

---

## ÉPICA D — Mejora UI/UX (Fase 4)

### D-1 · Sistema de diseño y consistencia visual · **5 SP**
> Como **usuario**, quiero una interfaz consistente con el estilo actual, para trabajar con comodidad.

```gherkin
Escenario: Tokens de diseño aplicados
  Dado el set de componentes principales
  Cuando se aplican los tokens (color/tipografía/espaciado)
  Entonces la apariencia se mantiene coherente con el estilo actual
```

### D-2 · Estados y validación inline · **5 SP**
> Como **Admin**, quiero feedback claro (cargando, error, éxito, vacío) y validación en captura, para evitar errores.

```gherkin
Escenario: Validación de diésel por viaje
  Cuando capturo un valor no numérico en el diésel del viaje
  Entonces veo un error inline y no puedo guardar hasta corregir
```

### D-3 · Accesibilidad WCAG 2.1 AA · **5 SP**
> Como **usuario con necesidades de accesibilidad**, quiero contraste y navegación por teclado adecuados, para usar el sistema sin barreras.

```gherkin
Escenario: Navegación por teclado
  Dado el formulario de captura de boleta
  Cuando navego solo con teclado
  Entonces puedo completar y enviar la boleta, con foco visible en cada control
```

---

## ÉPICA E — Endurecimiento y Corte a Producción (Fase 5)

### E-1 · Migración a producción con backup y rollback · **8 SP**
### E-2 · Hardening de seguridad (CORS, headers, rate limit, secrets) · **5 SP**
### E-3 · Capacitación y handover por rol · **3 SP**

---

## Spikes

- **SPIKE-1 (2 d):** Validar regla exacta de deduplicación de cruces contra nóminas reales (alimenta B-3 y doc 05).
- **SPIKE-2 (1 d):** Confirmar si `Arranque`/`Arribo` de Genesis permiten derivar fecha de viaje y estancias (alimenta B-5 y bonos por tiempo).

---

## Resumen de estimación por épica

| Épica | SP aprox. | Fase |
|---|---|---|
| A — Identidad y acceso | 16 | 1 |
| B — Lógica de negocio | 28 | 2 |
| C — Panel + aprobación + seguimiento del conductor | 29 | 3 |
| D — UI/UX | 15 | 4 |
| E — Producción | 16 | 5 |
| **Total** | **~104 SP** | — |
