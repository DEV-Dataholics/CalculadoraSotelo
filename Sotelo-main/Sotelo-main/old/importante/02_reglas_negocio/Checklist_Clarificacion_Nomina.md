# Checklist de Seguimiento y Clarificacion de Nomina

Fecha: 2026-04-21
Objetivo: cerrar reglas faltantes para calculadoras de nomina (FCH, PAC, Cruce, Local).

## 1. Lista de lo que falta

### 1.1 Diésel y bono de desempeño (manual)
- [ ] Definir exactamente que campos captura manualmente la asistente de nomina.
- [ ] Confirmar si esos campos solo se guardan como evidencia o tambien ajustan total pagado.
- [ ] Bloquear cualquier calculo automatico de recarga y bono de desempeño en la calculadora.

### 1.2 FCH (Foraneo Chihuahua)
- [ ] Formalizar criterio exacto de Bono Quimico.
- [ ] Definir si Bono Quimico se cuenta por movimiento, por folio o por viaje redondo.
- [ ] Validar casos limite de descuento por cruce internacional (km menos 40) en todas las rutas aplicables.

### 1.3 PAC (Foraneo Pacifico)
- [ ] Resolver conflicto de Doble Operador: 1726 vs 2439.
- [ ] Confirmar cuando aplica Sierra 500 y si puede coexistir con otros bonos.
- [ ] Cerrar estancias Mochis/Guamuchil: por noche o por bloque de horas.

### 1.4 Cruce
- [ ] Confirmar tabla de pago vigente (historica tipo 500 base vs observada en xls tipo 450/385/375).
- [ ] Confirmar si los xls de semanas 41-45 son plantilla o nomina realmente pagada.
- [ ] Definir reglas de PT por litros y su relacion con otros conceptos del mismo dia.

### 1.5 Local
- [ ] Confirmar matriz oficial vigente por movimiento (rampa, guardia/apoyo, inter/PT, inter, sur, largos).
- [ ] Confirmar reglas de bonos de asistencia, rendimiento y produccion.
- [ ] Definir prioridad cuando coinciden varios bonos en un mismo periodo.

### 1.6 Reglas transversales
- [ ] Definir catalogo unico de conceptos y nombres para evitar duplicidad (QMS, camara, postura, pericas, etc.).
- [ ] Definir reglas de redondeo (por concepto y total).
- [ ] Definir tratamiento de deducciones, anticipos y ajustes autorizados.
- [ ] Definir regla de corte semanal cuando hay viajes que cruzan periodo.

## 2. Preguntas puntuales para quien realiza la nomina

### 2.1 Diésel y desempeño
1. ¿Que capturas exactamente de forma manual por operador y por semana?
2. ¿Esos datos manuales modifican el pago final o solo se registran como control?
3. ¿El bono de desempeño se captura manualmente siempre? ¿Que evidencia lo dispara?

### 2.2 FCH
4. ¿Cual es el disparador exacto del Bono Quimico?
5. ¿El Bono Quimico se paga 250 por evento, por folio o por semana?
6. ¿En que rutas si aplica descuento de km por cruce internacional y en cuales no?

### 2.3 PAC
7. ¿Cuando se usa 1726 y cuando 2439 para Doble Operador?
8. ¿Doble Operador puede pagarse mas de una vez en la misma semana?
9. ¿Mochis/Guamuchil se paga por noche o por cada bloque de horas?
10. ¿Cuales rutas/clientes activan exactamente Bono Sierra?

### 2.4 Cruce
11. ¿Cual tabla oficial esta vigente hoy para pago por viajes/decimales?
12. ¿El valor 0.50 se paga como 150, 225 o 250?
13. ¿PT en Cruce se paga por litros siempre o depende del tipo de movimiento?

### 2.5 Local
14. ¿La matriz por movimiento esta congelada o cambia por cliente/periodo?
15. ¿Como se calcula bono de rendimiento (formula exacta)?
16. ¿Bono de produccion usa suma semanal de decimales? ¿Cual umbral exacto?

### 2.6 Reglas generales
17. Cuando coinciden varios bonos, ¿se acumulan todos o hay exclusiones?
18. ¿Que deducciones son automaticas y cuales requieren autorizacion?
19. ¿Se redondea por concepto o solo al total final?
20. Si un viaje inicia en una semana y termina en otra, ¿en que nomina cae?
21. ¿Cuales 3 nominas pagadas consideran referencia maestra para probar la calculadora?
22. ¿Que variacion maxima aceptan contra nomina real para considerar correcto el calculo?

## 3. Evidencia a pedir en la sesion de clarificacion
- [ ] 3 nominas pagadas completas por cada tipo aplicable.
- [ ] 1 caso con bonos multiples en la misma semana.
- [ ] 1 caso con anticipo y deduccion.
- [ ] 1 caso con viaje que cruza corte semanal.
- [ ] Regla oficial firmada o validada (correo/acta) para Doble Operador y Bono Quimico.

## 4. Resultado esperado al cerrar el checklist
- [ ] Reglas con estado aprobado por tipo de nomina.
- [ ] Lista de reglas manuales (sin auto-calculo) explicitamente separada.
- [ ] Casos de prueba UAT definidos y aceptados por nomina.
- [ ] Version de calculadora lista para piloto.
