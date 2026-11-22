# Cuate — Conversiones monetarias
Regla confirmada por el usuario el 2026-11-19:

- **VES → USD gerenciales = (importe VES / tasa BCV vigente para la fecha) × 0,85.**
- **USD pagados directamente → USD gerenciales = importe USD**, sin aplicar factor.
- Conservar importe y moneda originales, tasa BCV, fecha de la tasa, fuente y precisión. Redondear el equivalente USD por movimiento a dos decimales; totalizar los movimientos ya redondeados.
- Consultar histórico BCV disponible y documentar fuente; no inventar tasas ni usar una sola tasa para todo noviembre.
- Si la fecha individual no está confirmada, conservar el rango y, cuando se adopte una fecha referencial para calcular, registrar claramente `fecha_imputada_para_calculo:true`, `fecha_exacta_confirmada:false`, `fecha_tasa` y nota. No presentar una estimación como tasa auditada de la fecha real.
- Si falta tasa utilizable, mantener `usd_equivalente:null` y estado pendiente; nunca sustituir por cero.
- Los **58 gastos** del archivo `data/gastos/2026-11.json` están convertidos a USD gerenciales, **con 16 conversiones estimadas por fecha referencial**. No están conciliados ni auditados contra el BCV oficial individualmente.
- Los últimos 16 gastos: Bs. 712.784; tasa de referencia **918,7662 Bs/USD del 20/11/2026**, también aplicada a movimientos reportados dentro del rango 19–21/11; resultado registrado **USD 659,44**. La tasa del 19/11 se consignó como 917,7751, pero las fechas individuales no se conocen.
- Total noviembre registrado: **Bs. 4.150.210,59 + USD 70 directos**; equivalente gerencial registrado **USD 3.967,04**.
- El factor 0,85 es una convención de gestión del usuario, **no** una tasa BCV.
- Fuente de cálculo de los 16 gastos: histórico secundario citado en el registro canónico; requiere comprobación contra fuente oficial si se necesita auditoría.
