# DOCUMENTO DE ALCANCE Y DECLARACION DE TRABAJO (SOW)

Empresa Contratante: Dataholics  
Cliente Operativo: Fletes Sotelo  
Nombre del Proyecto: PayrollTool - Fase 2 (Nuevas Reglas de Seguimiento y Proceso Semi-automatico de Diesel)  
Fecha de Elaboracion: 15/03/2026  
Contratista / Desarrollador: [Insertar Nombre del Profesional Independiente]  
Aprobador Tecnico: Luis Carlos Morales Lopez (CTO)

---

## 1. Objetivo del Proyecto

Consolidar la evolucion del MVP de nomina foranea (Chihuahua y Pacifico) a una version operable para uso continuo, implementando las nuevas reglas detectadas en el analisis de seguimiento y corrigiendo el modelo de liquidacion de diesel para que deje de ser automatico y pase a un flujo semi-automatico con intervencion del operador.

El objetivo de negocio es reducir errores de liquidacion, reflejar la realidad operativa del ticket fisico de diesel y preparar el sistema para una posterior etapa de reportes de utilidad por flete y por camion.

---

## 2. Stack Tecnologico Requerido

- Frontend: React + Vite (UI de captura y validacion por viaje)
- Backend: PHP 8.x puro (sin frameworks externos)
- Hosting: Site5 / cPanel compartido con mod_rewrite
- Base de Datos: Sin base de datos en esta fase (procesamiento stateless por CSV)
- Infraestructura/Otros: Carga manual por CSV exportado de Genesis

---

## 3. Alcance del Proyecto (Scope)

### 3.1. LO QUE SI INCLUYE (In Scope)

1. Implementacion del modelo semi-automatico de diesel (retiro del calculo automatico en carga)
- El sistema conservara el calculo automatico de referencia (litros permitidos, costo esperado), pero no liquidara incentivo automaticamente al subir el CSV.
- La liquidacion final de diesel quedara sujeta a captura manual del operador (litros reales y precio real por litro del ticket).
- Formula de liquidacion final:
  - Incentivo Diesel = (Litros Permitidos - Litros Reales Ticket) x Precio Real Ticket

2. Nuevos campos de captura operativa en interfaz
- Campo manual: Litros reales recargados.
- Campo manual: Precio real por litro.
- Visualizacion de referencias no editables: Litros permitidos, Costo esperado, Litros de empate.

3. Separacion formal de precio diesel por tipo de operacion
- Mantener precio de referencia para Local/Cruce: 14.50 MXN por litro.
- Mantener precio de referencia para Foraneo Chihuahua: 14.85 MXN por litro.
- Aplicar fallback al precio de referencia solo cuando no exista captura manual de precio real.

4. Implementacion de Bono Quimico
- Integrar Bono Quimico por 250 MXN como ajuste operativo.
- Activacion inicial manual (toggle/flag) mientras se cierra regla exacta de negocio con el cliente.

5. Validacion e implementacion de Deduccion de Cruce
- Aplicar deduccion de kilometraje fronterizo para evitar doble pago de tramo internacional.
- Cubrir y probar los seis escenarios operativos de combinacion de ruta y cruce.

6. Actualizacion oficial de tabla de rendimientos por unidad (5 decimales)
- Sustituir y/o validar rendimientos con la tabla oficial de seguimiento para asegurar coincidencia de litros permitidos.

7. Ampliacion de tabla de rutas
- Incorporar rutas con nombres reales de clientes/plantas para mejorar mapeo automatico de kilometros.

8. Actualizacion del catalogo de tipos de movimiento de Genesis
- Incorporar codigos operativos detectados en seguimiento para clasificacion correcta de movimientos.

9. Ajustes de consistencia en resumen y calculos agregados
- El frontend no recalculara incentivo por su cuenta con formulas divergentes.
- El resumen total consumira los valores calculados y validados por backend.

10. Documentacion tecnica de cambios
- Actualizacion de README tecnico de PayrollTool con los nuevos campos, flujo de dos etapas y reglas implementadas en fase 2.

### 3.2. LO QUE NO INCLUYE (Out of Scope)

- Integracion directa por API con Genesis (la entrada continua via CSV).
- Desarrollo de aplicacion movil nativa iOS/Android.
- Automatizacion de nomina de operadores locales, rentados y operaciones fuera del alcance foraneo definido.
- Construccion de modulo financiero integral de utilidad por cliente/camion en tiempo real.
- Facturacion electronica y timbrado.
- Cualquier regla nueva no documentada en este SOW.

---

## 4. Criterios de Aceptacion (Definition of Done)

Para considerar la fase como terminada y aprobable:

1. El calculo automatico de incentivo diesel al momento de carga CSV queda deshabilitado en flujo productivo.
2. El operador puede capturar litros reales y precio real por litro por viaje sin errores criticos.
3. El incentivo final se calcula con formula manual y coincide con casos de prueba validados.
4. Se implementa la separacion de precios de diesel por tipo de operacion (14.50 y 14.85) con fallback visible.
5. Deduccion de cruce funciona correctamente en los seis escenarios acordados.
6. Bono Quimico se aplica correctamente cuando esta habilitado.
7. Tabla de rendimientos y tabla de rutas ampliadas quedan activas y usadas por el motor de calculo.
8. Catalogo de movimientos Genesis actualizado sin romper clasificacion existente.
9. Codigo fuente actualizado en repositorio privado designado por Dataholics, sin bugs criticos (Nivel 1 o 2) derivados de esta fase.
10. Documentacion tecnica minima entregada:
- README actualizado con setup y flujo funcional.
- Resumen tecnico de cambios de fase 2.
- Evidencia de pruebas de funcionamiento de los modulos incluidos.

---

## 5. Cronograma e Hitos (Milestones)

Fecha de Inicio del Proyecto: 15/03/2026

Hito 1 - Ajuste de flujo diesel y nuevos campos manuales (Semana 1)
- Retiro de calculo automatico de incentivo en carga.
- Incorporacion de captura manual de litros y precio real.
- Ajuste de resumen para consumir backend.

Hito 2 - Reglas nuevas de negocio (Semana 2)
- Bono Quimico.
- Deduccion de cruce (6 casos).
- Separacion de precios por tipo operativo.

Hito 3 - Catalogos y estabilidad funcional (Semana 3)
- Tabla oficial de rendimientos.
- Tabla de rutas expandida.
- Catalogo de movimientos Genesis.
- Pruebas de regresion de calculo.

Fecha de Entrega Final para QA: 05/04/2026

---

## 6. Condiciones Comerciales y de Pago

El presente proyecto se ejecutara bajo esquema de precio cerrado (Fixed Price).

- Monto Total Acordado: [Insertar Monto en MXN o USD]
- Condiciones de Liberacion:
  - El pago se procesara en una sola exhibicion en un plazo no mayor a [Insertar numero] dias habiles posteriores a:
    - validacion de criterios de aceptacion (Seccion 4) por parte del CTO de Dataholics,
    - y recepcion de factura o recibo de honorarios correspondiente.
- Modificaciones al Alcance:
  - Cualquier requerimiento adicional, cambio sustancial o tarea fuera de la Seccion 3.1 debera cotizarse y aprobarse mediante un SOW independiente.

---

## 7. Riesgos, Dependencias y Supuestos

- Dependencia clave: Confirmacion final del cliente sobre condicion exacta de activacion del Bono Quimico.
- Dependencia operativa: Calidad de captura manual de tickets y consistencia de datos en CSV de Genesis.
- Supuesto tecnico: El backend se implementa en PHP puro para compatibilidad con hosting compartido Site5/cPanel. No se requiere Python App ni servicios externos.
- Riesgo controlado: Diferencias de criterio entre calculo historico en Excel y nueva implementacion; se mitiga con casos de prueba comparativos.

---

## 8. Firmas de Conformidad

Al firmar este documento, ambas partes aceptan el alcance, entregables y condiciones comerciales descritas para la ejecucion de esta fase.


________________________________________  
Luis Carlos Morales Lopez  
CTO / Cofundador - Dataholics  
Fecha:


________________________________________  
[Nombre del Contratista]  
Desarrollador Independiente  
Fecha: