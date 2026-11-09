#!/usr/bin/env bash
# Actualiza los datos del dashboard de Cuate a partir del Excel de cuadres.
# Uso: CUATE_PW='...' ./actualizar.sh /ruta/al/excel.xlsx /ruta/al/sitio
set -euo pipefail
XLSX="$1"; SITE="$2"
cd "$(dirname "$0")"
mkdir -p /home/claude/data out
cp "$XLSX" /home/claude/data/cuadres.xlsx
python3 -I extract.py /home/claude/data/cuadres.xlsx   # raw.json
python3 -I dates.py >/dev/null                         # raw2.json
python3 -I dates2.py >/dev/null                        # raw3.json (corrige meses mal escritos)
python3 -I parse.py >/dev/null                         # days.json
python3 -I build.py >/dev/null                         # df.pkl, lines.pkl
python3 -I prep.py >/dev/null                          # mensual, semana, historico, alertas
python3 -I chan2.py >/dev/null                         # lines_color.pkl (colores de celdas)
python3 -I canales.py                                  # canales_mes, canales_total
python3 -I prep2.py >/dev/null                         # diario, canales_dia, divisas (hasta el último día)
python3 -I build_site.py out . "$SITE"                 # data.enc.json, panel.html, main.js
