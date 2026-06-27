# ADR-006 — Exclusiones de pago base como catálogo administrable

| Campo | Valor |
|---|---|
| Estado | Aceptado |
| Fecha | 2026-06-11 |
| Autores | David García |
| Relacionado | [02_reglas_negocio_supuestos](../01-vision/02_reglas_negocio_supuestos.md) (Decisión 4), [03_modelo_de_datos](../03-datos/03_modelo_de_datos.md) |

## Contexto

Ajuste 3 de *Ajustes Sotelo*: coordenadas "Tri"/"GT" y rutas base (Zaragoza DTR, Fletes Sotelo) no deben sumar pago base. Hoy `BoletaProcessor` paga $110/$55 a toda pierna no-Pacífico sin lista de exclusión.

## Decisión

Modelar las exclusiones en una tabla **`exclusiones_pago_base`** administrable desde el panel (como `pacifico_keywords`), no hardcodeadas.

## Consecuencias

- (+) Negocio puede ajustar la lista sin desplegar código.
- (+) Auditable y versionable.
- (−) Una consulta/caché adicional en el procesamiento. Mitigable con caché en memoria por corrida.
