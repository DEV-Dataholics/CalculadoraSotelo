Aquí tienes el resumen estructurado con los ajustes técnicos, errores de lógica y nuevos requerimientos identificados en la revisión, listo para ser entregado al programador:

**1\. Corrección en el cálculo total de la boleta**

* **Problema:** La fórmula que calcula el total de la boleta es incorrecta, ya que está ignorando el "diésel a favor" y solo está sumando el kilometraje y los cruces.  
* **Ajuste requerido:** El total de la boleta debe ser exactamente la suma del **pago base** (dinero base) más el **diésel a favor**.

**2\. Solución al "dobleteo" de Cruces**

* **Problema:** El sistema está pagando doble los cruces (duplicando el pago de $500).  
* **Causa:** La condición está detectando e inyectando el pago del cruce basándose en el nombre de la ruta (por ejemplo, "Precoz"), pero también lo está sumando simultáneamente al detectarlo a través de las coordenadas o del diccionario de palabras clave (keywords).  
* **Ajuste requerido:** Modificar la lógica para que el pago de cruce se registre una sola vez por viaje, resolviendo la interferencia entre la lectura de la ruta y el diccionario de coordenadas.

**3\. Ajuste en variables y coordenadas que no juegan para pago base**

* **Problema:** Se están aplicando montos de base (ej. $110 o $55) a conceptos que no deberían llevarlo.  
* **Ajuste requerido:** Las coordenadas como "Tri" (cruce) y "GT", así como las rutas base locales (como Zaragoza DTR, Fletes Sotelo), no deben sumar montos para el pago de la base.

**4\. Rendimiento de Diésel Variable por Viaje (Cambio de Interfaz/Lógica)**

* **Problema:** Actualmente el costo y rendimiento del diésel se calcula como una constante general, pero la operación real requiere que varíe por viaje, ya que a un mismo operador se le puede pagar un viaje a $18.46 y otro a $18.06 o $14.85 en la misma semana dependiendo de su rendimiento.  
* **Ajuste requerido:** El cálculo del rendimiento de diésel debe dejar de ser una variable global y pasar a nivel individual (por viaje).  
* **Solución propuesta:** Habilitar un campo de captura por viaje; se acordó que se puede reemplazar el campo visual de "peso" (que actualmente no se utiliza) para registrar el diésel por viaje y simplificar el ajuste en la interfaz.

**5\. Filtro dinámico de fechas vs. Semanas rígidas**

* **Problema:** El sistema ata el cálculo a semanas estrictas (ej. Semana 22 o 43), lo cual causa problemas con viajes que cruzan periodos (ej. foráneos).  
* **Ajuste requerido:** Eliminar la selección de semanas fijas y cambiarlo por un selector de rango de fechas ("de tal fecha a tal fecha"), permitiendo procesar y liquidar los viajes independientemente de la semana estricta a la que pertenezcan.


