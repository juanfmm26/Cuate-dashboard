"""Genera los archivos de datos y del panel para la página de GitHub.
Uso: CUATE_PW='...' python3 build_site.py <carpeta_csv> <carpeta_dashboard> <carpeta_sitio>
"""
import base64, csv, gzip, json, os, re, sys, time
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

out_dir, dash_dir, site = sys.argv[1], sys.argv[2], sys.argv[3]
pw = os.environ['CUATE_PW']
FILES = {'diario': 'diario_2026.csv', 'mensual': 'mensual_2026.csv', 'semana': 'dia_semana_2026.csv',
         'canales_mes': 'canales_mes_2026.csv', 'canales': 'canales_total_2026.csv', 'historico': 'pedidos_historico.csv',
         'alertas': 'alertas_zelle.csv', 'canales_dia': 'canales_dia_2026.csv', 'divisas': 'divisas_dia_2026.csv'}
datasets, columns = {}, {}
for k, f in FILES.items():
    with open(os.path.join(out_dir, f), newline='', encoding='utf-8') as fh:
        r = csv.DictReader(fh)
        datasets[k] = [dict(row) for row in r]
        columns[k] = r.fieldnames
ult = max(r['fecha'] for r in datasets['diario'])
MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
payload = {
    'datasets': datasets, 'columns': columns,
    'params': {'desde': '2026-01-01', 'agrupar': 'dia', 'per_canales': 'mes', 'per_cobros': 'mes', 'div_desde': '2026-01-01', 'div_agrupar': 'mes'},
    'actualizado': f"{int(ult[8:])} de {MES[int(ult[5:7]) - 1]} de {ult[:4]}",
    'version': str(int(time.time())),
}
raw = gzip.compress(json.dumps(payload, ensure_ascii=False, separators=(',', ':')).encode('utf-8'))
salt, iv, it = os.urandom(16), os.urandom(12), 310000
key = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=it).derive(pw.encode('utf-8'))
ct = AESGCM(key).encrypt(iv, raw, None)
b = lambda x: base64.b64encode(x).decode()
json.dump({'v': 1, 'iter': it, 'salt': b(salt), 'iv': b(iv), 'ct': b(ct)}, open(os.path.join(site, 'data.enc.json'), 'w'))

# Panel: el HTML del dashboard sin scripts; el script en línea va a main.js
h = open(os.path.join(dash_dir, 'index.html'), encoding='utf-8').read()
h = h.replace('<meta name="dash-one-writer">\n', '')
m = re.search(r'<script>\n(.*?)</script>', h, re.S)
open(os.path.join(site, 'main.js'), 'w', encoding='utf-8').write(m.group(1))
h = h[:m.start()] + h[m.end():]
h = re.sub(r'<script src="[^"]+"></script>\n?', '', h)
open(os.path.join(site, 'panel.html'), 'w', encoding='utf-8').write(h)
for f in ('charts.js', 'calcs.js'):
    open(os.path.join(site, f), 'w', encoding='utf-8').write(open(os.path.join(dash_dir, f), encoding='utf-8').read())
print('ok', ult, len(ct), 'bytes cifrados')
