# CUATE — REGLAS MAESTRAS DEL SISTEMA
Actualización: 2026-11-22. Este documento define el flujo operativo; prevalecen los registros originales y la evidencia verificable sobre cualquier cifra resumida.

## Objetivo y alcance
Mantener el sistema de Cuate coherente entre los chats 01 Ventas, 02 Gastos, 03 Food Cost, 04 Rentabilidad y 05 Dashboard GitHub. No solicitar de nuevo datos que ya estén documentados. Revisar primero los archivos canónicos del repositorio y los datos previos disponibles. No afirmar que una actualización está terminada sin comprobar el resultado.

## Ingesta de gastos
1. Extraer cada pago o compra recibido del usuario o de WhatsApp, con concepto, proveedor, monto, moneda, fecha o rango, fuente, categoría e ID estable. No duplicar recibos, descripciones, equivalencias o archivos históricos.
2. Conservar monto y moneda originales, así como fecha del comprobante y del mensaje cuando existan. Si solo se conoce un rango, conservar el rango y marcar fecha individual como no confirmada.
3. Clasificar usando `reglas/gastos.md` y `data/proveedores.json`; señalar incertidumbre. No crear compras a partir de comentarios o presupuestos.
4. Convertir VES con `(VES / BCV vigente) × 0.85`; USD directos no se ajustan. Consultar y documentar tasas y fechas. No inventar cotizaciones. Si se emplea una tasa referencial por fecha desconocida, identificar la estimación explícitamente, conservar el rango y permitir su futura corrección.
5. Incorporar transacciones al registro canónico, regenerar los datos del dashboard y actualizar **todos** los totales, categorías, períodos y tarjetas de detalle. Evitar archivos paralelos sumados dos veces. Mantener un historial de lotes integrados.
6. Comprobar conteo, suma VES, USD directo, USD equivalente y subtotales por categoría antes de publicar. Comparar cifras del dashboard con el archivo canónico.

## Ventas, food cost y rentabilidad
- Ventas, compras, costo consumido y utilidad son métricas distintas. No llamar ganancia a ventas menos compras de períodos no equivalentes.
- Registrar ventas conocidas incluso si falta el detalle diario; marcar agregados y no inventar ventas por fecha.
- Food Cost: registrar recetas, pesos, precios unitarios, rendimiento y vigencia; no extrapolar un costo de compra como consumo sin inventario/receta.
- Rentabilidad: cruzar períodos comparables, distinguir estimación de conciliación y documentar datos faltantes.

## Dashboard: diseño, publicación y control de calidad
- Vista clara, visual, móvil y similar a una herramienta online, no una hoja Excel. Botón para consultar **cada gasto** con concepto, categoría, fecha/rango, moneda, importe original, USD convertido y estado de estimación; búsqueda y filtros.
- Después de cada cambio: comprobar sintaxis de JS, dependencias y orden de carga, totales, conteos, estados vacíos, categorías, filtros semana/mes/acumulado y ausencia de duplicados. Usar un navegador real para inspeccionar visualmente el dashboard y probar navegación, especialmente Gastos y compras y el explorador.
- Verificar el sitio **publicado**, no solo el commit, antes de decir que funciona. Si la página requiere autenticación o el navegador/sitio no está accesible, declarar expresamente que la validación visual en producción está pendiente. No inventar capturas ni resultados.
- Invalidar caché cuando se actualicen scripts y comprobar que se sirve la versión nueva.
- Cuando una actualización falle, diagnosticar el error específico y corregirlo antes de afirmar que se solucionó.
- Evitar pasos repetitivos de autorización o preguntas sobre información que ya se conoce. Ejecutar de extremo a extremo y reportar únicamente resultados comprobados y pendientes reales.

## Estado registrado a 2026-11-22
- Gastos noviembre: **58 movimientos** (42 originales + 16 del 19–21/11), **Bs. 4.150.210,59** originales más **USD 70** directos, **USD 3.967,04** equivalentes gerenciales, preliminares y no conciliados.
- Los 16 últimos movimientos suman **Bs. 712.784** y **USD 659,44** bajo tasa referencial del 20/11 (918,7662 Bs/USD) y factor 0,85. Sus fechas individuales no están confirmadas.
- El registro fuente es `data/gastos/2026-11.json`. `data/gastos/pendientes-fecha-2026-11-22.json` es histórico de recepción **ya integrado**, NO se suma de nuevo.
- Ventas conocidas: enero–octubre 2026 USD 84.196,49; acumulado hasta 08/11 USD 86.783,76; 09–15/11 USD 1.946,31; acumulado hasta 15/11 USD 88.730,07; noviembre 01–15 USD 4.533,58. Agregados, no detalle diario verificado.
- Publicación visual en GitHub Pages: debe validarse independientemente del repositorio.
