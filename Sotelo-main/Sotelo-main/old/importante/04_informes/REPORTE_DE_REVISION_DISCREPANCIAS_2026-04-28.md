# REPORTE DE REVISION DEL REPORTE DE DISCREPANCIAS
**Proyecto:** Calculadoras Sotelo - Motor de Calculo de Nomina  
**Documento revisado:** REPORTE_ESTADO_DISCREPANCIAS.md  
**Fecha de revision:** 2026-04-28  
**Preparado por:** GitHub Copilot (GPT-5.3-Codex)

---

## 1. Objetivo
Evaluar la calidad tecnica y numerica del reporte de estado de discrepancias, identificando hallazgos concretos y proponiendo mejoras para fortalecer trazabilidad, priorizacion y toma de decisiones con el area de nomina.

---

## 2. Alcance de esta revision
1. Consistencia interna del reporte (secciones, estados, resumen).
2. Solidez de datos economicos (signos, unidades, trazabilidad de cifras).
3. Claridad de pendientes de negocio vs pendientes tecnicos.
4. Priorizacion de riesgos operativos.

No se recalculo nomina completa ni se ejecutaron pruebas de codigo en esta revision; el enfoque es documental y de calidad de reporte.

---

## 3. Hallazgos principales

### H-01 (Alta) - Cifra de varianza 4.1% sin sustento explicito en el mismo documento
**Observacion:** El reporte incluye la meta de bajar varianza de 4.1% a <1%, pero no documenta formula, base de comparacion, muestra, ni archivo fuente de ese 4.1%.  
**Riesgo:** Debilita auditoria y dificulta validacion de avance real en UAT.  
**Impacto:** Alto (calidad de evidencia ejecutiva).

### H-02 (Alta) - Mezcla de unidades economicas en el resumen
**Observacion:** La tabla se titula como "impacto por semana", pero el contenido se expresa en unidad evento (por boleta, por movimiento) y en otro caso por kilometros corregidos.  
**Riesgo:** Lectura financiera ambigua; posible interpretacion equivocada del impacto total semanal.  
**Impacto:** Alto (comunicacion a direccion/nomina).

### H-03 (Media-Alta) - Inconsistencia de signos economicos entre secciones
**Observacion:** En secciones de fixes se describe subpago con signo negativo, mientras en el resumen aparece como impacto positivo sin aclarar convencion contable.  
**Riesgo:** Confusion al interpretar si el monto representa perdida historica, correccion o beneficio esperado.  
**Impacto:** Medio-alto.

### H-04 (Media) - PEN-04 puede estar sobrerrepresentado como incertidumbre de negocio
**Observacion:** El pendiente FCH flat vs km se presenta como decision abierta, pero la evidencia documental cercana apunta a pago fijo 110/55 ya validado operativamente en FCH (con equivalencia por km solo como expresion matematica de ruta estandar).  
**Riesgo:** Sobrecargar la agenda de clarificacion con un punto que parece principalmente de reconciliacion documental.  
**Impacto:** Medio.

### H-05 (Media) - FIX-02 tecnico resuelto, definicion operativa aun abierta
**Observacion:** El cambio a contador para Bono Quimico es correcto a nivel codigo, pero permanece abierta la definicion canonica de "movimiento QMS".  
**Riesgo:** Captura manual inconsistente entre operadores de nomina.  
**Impacto:** Medio.

### H-06 (Positivo) - Buena estructura general de gestion
**Observacion:** El reporte separa adecuadamente tres capas: fixes cerrados en codigo, pendientes de negocio y backlog no implementado.  
**Valor:** Facilita priorizacion por tipo de decision.

---

## 4. Sugerencias accionables

### S-01 - Estandarizar convencion economica
Adoptar una sola convencion para todo el documento:
1. "Delta historico vs pago correcto" (siempre positivo = subpago recuperable).
2. "Sobrepago potencial" (siempre positivo = riesgo por pagar de mas).

Agregar una nota de 1 linea con la convencion elegida antes de tablas de impacto.

### S-02 - Separar "impacto unitario" de "impacto semanal"
Reemplazar la tabla actual por dos tablas:
1. **Impacto unitario corregido** (por boleta, por movimiento, por km).
2. **Impacto semanal estimado** con formula explicita y frecuencias observadas.

Formula sugerida:
`Impacto_Semanal = 713 * N_DO + 250 * N_QMS_extra + SUM(Delta_km_i * Tarifa_i)`

### S-03 - Trazabilidad numerica minima obligatoria
Para cada KPI del reporte (ej. 4.1%, <1%, varianza, exactitud):
1. Incluir formula usada.
2. Definir muestra (semanas, operadores, segmentos).
3. Registrar fuente (archivo y hoja).
4. Registrar fecha de corte.

### S-04 - Reetiquetar estatus de FIX-02
Cambiar texto de estado a:
**"Resuelto en codigo; pendiente definicion operativa de conteo QMS"**.

Esto evita falso cierre funcional y alinea expectativas con nomina.

### S-05 - Reubicar PEN-04 a "Reconciliacion documental"
Si negocio confirma que FCH es flat 110/55 en todos los casos operativos vigentes, mover PEN-04 fuera de "pendientes criticos" y dejarlo como nota de consistencia documental.

### S-06 - Fortalecer bloque de UAT
Definir criterios de aceptacion verificables:
1. Error absoluto medio por operador.
2. % de operadores dentro de tolerancia (ej. <= 1 MXN).
3. Diferencia total semanal (sistema vs pagado).
4. Casos frontera (QMS multiple, Doble Operador, FOK/HAW, cruce de semana).

---

## 5. Priorizacion recomendada

### Prioridad 1 (inmediata)
1. Cerrar definicion de tabla CRUCE vigente (PEN-05).
2. Definir formalmente conteo QMS (PEN-03).
3. Documentar trazabilidad del 4.1% y metodo UAT.

### Prioridad 2
1. Resolver coexistencia 1726 vs 2439 (PEN-02).
2. Aclarar unidad de captura para estancia Mochis/Guamuchil (PEN-01).

### Prioridad 3
1. Limpiar ambiguedades de redaccion/convencion economica.
2. Reconciliar pendiente FCH flat vs km como tema documental.

---

## 6. Conclusion ejecutiva
El reporte base es util y bien estructurado para gestion, pero requiere ajustes de calidad numerica para soportar decisiones con mayor rigor. Los principales riesgos no estan en los fixes tecnicos ya aplicados, sino en la definicion operativa pendiente (QMS, CRUCE y reglas PAC duales) y en la falta de trazabilidad explicita de algunos indicadores clave.

Con los ajustes propuestos, el documento puede escalar de "reporte de estado" a "documento auditable de decision".

---

## 7. Entregable relacionado
Este documento complementa al reporte revisado y esta pensado para usarse en la sesion de clarificacion con nomina junto con las preguntas PEN-01 a PEN-05.