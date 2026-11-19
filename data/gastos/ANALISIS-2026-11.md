# Cuate — Cierre preliminar de gastos de noviembre 2026

Fecha de corte de movimientos: **17/11/2026**. No es un cierre mensual completo.

## Resumen

- 42 movimientos: **Bs. 3.437.426,59** y **USD 70** en pagos directos.
- Equivalente USD antes del factor: **USD 3.878,94**, incluyendo pagos directos.
- Equivalente USD gerencial tras factor 0,85 aplicado solo a VES: **USD 3.307,60**.
- La conversión usa tasas guardadas por fecha en `data/gastos/2026-11.json`; **pendiente de validación contra histórico oficial BCV**. No es un resultado auditado.

## Categorías — USD ajustados

| Categoría | USD | Movimientos |
|---|---:|---:|
| Materia prima e ingredientes | 1.554,33 | 15 |
| Alquiler | 470,99 | 2 |
| Nómina y beneficios | 346,90 | 4 |
| Bebidas | 273,63 | 4 |
| Mantenimiento y reparaciones | 124,26 | 2 |
| Otros | 108,73 | 2 |
| Administración y contabilidad | 106,22 | 1 |
| Equipos y mobiliario | 79,90 | 1 |
| Publicidad y promociones | 71,54 | 1 |
| Transporte y logística | 69,58 | 3 |
| Servicios | 66,62 | 5 |
| Empaques y desechables | 30,19 | 1 |
| Limpieza e higiene | 4,71 | 1 |

## Hallazgos y límites

1. Compras identificadas de materia prima y bebidas suman **USD 1.827,96** (55,3 % del total gerencial), pero **no representan Food Cost** sin inventario inicial/final y consumo.
2. Gastos que pueden no ser recurrentes: sillas, liquidación de Gustavo, reparaciones; no eliminarlos del flujo de caja, pero separarlos al evaluar desempeño normalizado.
3. **No se puede calcular utilidad ni margen** con solo gastos. Se requiere Excel de ventas de noviembre, incluyendo fecha, importe y moneda; el libro identificado en Dropbox (`/0.0.1 Cuate/cuate ventas.xlsx`) excede el límite de extracción disponible (7,93 MB > 5 MB). No se importaron ventas ni se inventaron cifras.
4. Clasificación de la compra mixta de supermercado sin desglose: `Otros`, provisional. Farmaexpress se clasifica como cena del personal, sin desglose.
5. El pago USD 20 a Luis está incluido pero falta precisar el concepto. No confundir con referencia de USD 20 asociada al abono de delivery de Tito, que ya figura como Bs. 18.316.
6. Compras pendientes sin importe (como Pulgar) no se registran como gasto.
7. Tasas de cambio y movimientos requieren conciliación con comprobantes/banco antes de declararse definitivos.

## Fórmulas para rentabilidad posterior

- Ventas netas = ventas brutas - descuentos - devoluciones (según datos de origen).
- Costo de ventas = inventario inicial + compras de insumos - inventario final, ajustado por mermas y transferencias.
- Utilidad bruta = ventas netas - costo de ventas.
- Resultado operativo = utilidad bruta - gastos operativos del mismo período, sin duplicar compras ya reconocidas como costo de ventas.
- Flujo de caja operativo: ingresos cobrados - desembolsos operativos; **no es igual a utilidad contable**.

## Estado de integración

- `gastos-data.js` está cargado dinámicamente por `app.js` tras iniciar sesión.
- `gastos.js` muestra USD equivalentes por categoría. Su filtro «Este mes» se basa en la fecha actual, así que no permite seleccionar noviembre después de terminado el mes. Pendiente mejora del selector histórico.
- Datos de ventas y Food Cost no han sido importados en esta operación.
