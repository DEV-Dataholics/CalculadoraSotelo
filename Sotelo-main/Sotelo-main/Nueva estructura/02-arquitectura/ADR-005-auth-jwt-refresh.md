# ADR-005 — Autenticación con JWT de vida corta + refresh

| Campo | Valor |
|---|---|
| Estado | Propuesto (confirmar en doc 04) |
| Fecha | 2026-06-11 |
| Autores | David García |
| Relacionado | [04_plan_de_seguridad](../04-seguridad/04_plan_de_seguridad.md) |

## Contexto

Frontend SPA desacoplado + API CI4. Se necesita autenticación stateless-friendly y compatible con CORS.

## Decisión

**JWT** de acceso de vida corta (~15 min) + **refresh token** persistido (rotable/revocable). Alternativa evaluada: sesiones server-side con cookie. La decisión final se confirma en el doc 04.

## Consecuencias

- (+) Escala sin estado de sesión compartido; encaja con SPA.
- (−) La revocación requiere rotación/registro de refresh tokens. Se documenta y se prueba.
