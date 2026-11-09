# Cuate — dashboard de ventas

Página con contraseña para ver las ventas del restaurante. Los datos van **cifrados** en `data.enc.json` (AES-GCM, clave derivada con PBKDF2): sin la contraseña no se pueden leer, aunque el repositorio sea público. No hay datos sin cifrar ni Excel en este repositorio.

## Archivos de la página
- `index.html`, `app.js`: pantalla de contraseña, descifrado y carga.
- `panel.html`, `main.js`, `charts.js`, `calcs.js`: el dashboard (mismo contenido que el dashboard de Claude).
- `dash-shim.js`: motor mínimo que reemplaza al del dashboard de Claude.
- `theme.css`, `d3.min.js`: estilos y librería de gráficos.

## Actualizar los datos (cada semana)
Desde la carpeta `pipeline/`, con el Excel de cuadres más reciente:

```bash
pip install pandas openpyxl cryptography
CUATE_PW='<contraseña>' ./actualizar.sh /ruta/cuate_ventas.xlsx ..
git add -A && git commit -m "Datos al <fecha>" && git push
```

`actualizar.sh` lee todas las hojas diarias, corrige nombres de hoja con el mes mal escrito, recalcula la venta real (factor de brecha 0,75 hasta jun-2026, 0,80 del 1 al 15 de jul y 0,85 desde el 16 de jul), separa canales (columna A; toda comanda con cobro en DELIVERY es delivery propio) y Binance/PayPal (color verde/azul de la celda en OTROS), y genera `data.enc.json`, `panel.html` y `main.js`.

Los totales por mes llegan hasta el último mes completo. Cuando se cierra un mes nuevo, revisar en `pipeline/index.html` y `pipeline/calcs.js` las etiquetas y rangos fijos («ene–oct», comparaciones ene–may vs ago–oct).
