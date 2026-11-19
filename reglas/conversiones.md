# Cuate — Conversiones monetarias

Regla confirmada por el usuario el 2026-11-19:

- Para gastos en bolívares: **USD equivalente = (importe VES / tasa BCV de la fecha) × 0,85**.
- Para gastos pagados directamente en USD: **USD equivalente = importe USD**, sin aplicar 0,85.
- Mantener siempre importe y moneda originales; guardar además tasa BCV, fecha de tasa y fuente de la tasa.
- No inventar tasas ni utilizar una tasa única para todo noviembre sin aprobación.
- Si no se dispone de tasa verificable para una fecha, mantener `usd_equivalente: null` y estado pendiente; no sustituir por cero.
- Los 42 gastos del archivo `data/gastos/2026-11.json` no han sido convertidos todavía.
- El factor 0,85 es una convención de gestión confirmada por el usuario, no una tasa oficial BCV.
