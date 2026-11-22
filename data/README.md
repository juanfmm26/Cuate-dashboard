# Cuate — Sistema de datos
La información centralizada vive aquí y no depende del historial de un chat. **Consultar primero `reglas/MAESTRAS.md`.**

## Datos canónicos
- `data/gastos/2026-11.json`: **58 movimientos**, importes originales, categorías, fuentes, tasas, fechas y equivalentes USD. Totales preliminares: Bs. 4.150.210,59 + USD 70 directos; USD gerenciales 3.967,04.
- `data/gastos/pendientes-fecha-2026-11-22.json`: lote histórico de 16 movimientos **ya integrado**; NO volver a sumar.
- `gastos-data.js`: proyección para la interfaz; debe regenerarse/sincronizarse desde el JSON canónico. `gastos.js`: presentación, filtros y explorador.
- `data/proveedores.json`: clasificación de proveedores.
- `reglas/gastos.md` y `reglas/conversiones.md`: reglas específicas y excepciones.
- `data/ventas/ESTADO-2026-11.md`: agregados de ventas disponibles, aunque falta detalle diario.
- `data/foodcost/`: costos de recetas y materias primas, cuando existan.

## Actualización obligatoria
Registrar → clasificar → convertir → consolidar → regenerar interfaz → validar cálculos → probar navegador → verificar publicación. No confundir commit con sitio publicado ni afirmar una prueba visual que no se hizo. Los 16 gastos del 19–21/11 usan fecha referencial de conversión, no fechas exactas confirmadas.

Chats: 01 Ventas; 02 Gastos; 03 Food Cost; 04 Rentabilidad; 05 Dashboard.
