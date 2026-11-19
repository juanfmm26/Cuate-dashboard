# Cuate — Sistema de datos

La información centralizada vive aquí y no depende del historial de un chat.

- `data/gastos/2026-11.json`: 42 movimientos, importes originales, fuentes y pendientes.
- `data/proveedores.json`: clasificación confirmada por el usuario.
- `reglas/gastos.md`: reglas contables y excepciones.
- `data/ventas/` y `data/foodcost/`: áreas separadas para próximas cargas.

Chats sugeridos dentro del proyecto Cuate: 01 Ventas; 02 Gastos; 03 Food Cost; 04 Rentabilidad; 05 Dashboard.

**Nota:** La vista de gastos del dashboard requiere montos USD con tasas verificadas; no se inyectan equivalencias estimadas en `gastos-data.js`.
