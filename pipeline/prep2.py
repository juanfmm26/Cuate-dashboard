import json as _j, datetime as _dt
_ULT = max(d['date'] for d in _j.load(open('days.json')))
_u = _dt.date.fromisoformat(_ULT)
_sig = _u + _dt.timedelta(days=1)
CORTE_MES = (_sig.replace(day=1) if _sig.day == 1 else _u.replace(day=1)).isoformat()  # primer día del mes incompleto
import pandas as pd, re, json, openpyxl
df=pd.read_pickle('df.pkl')
y=df[(df.date>='2026-01-01')&(df.date<=_ULT)].copy()
dn=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo']
y['ticket']=y.real/y.orders.where(y.orders>0); y['mp']=y.mesas_prop/y.mesas_sheet
r2=lambda s:s.round(2)
d=pd.DataFrame({'fecha':y.date.dt.strftime('%Y-%m-%d'),'mes':y.mes,'dia_semana':y.date.dt.dayofweek.map(lambda i:dn[i]),'venta_real':r2(y.real),'venta_nominal_bcv':r2(y.nominal),
 'pedidos':y.orders,'ticket_real':r2(y.ticket),'efectivo_usd':r2(y.efe),'zelle':r2(y.zelle),'pdv_usd':r2(y.pdv),'pago_movil_usd':r2(y.pm),'binance':r2(y.bin),
 'propinas':r2(y.prop),'delivery':r2(y.deliv),'tasa_bcv':y.tasa,'factor_brecha':y.f,'perdida_brecha':r2(y.perdida_brecha),'creditos_saldo':r2(y.creditos),
 'mesas_con_propina_pct':y.mp.round(3)})
d.to_csv('out/diario_2026.csv',index=False); print(d.tail(2).T)
# channels incl Nov 1
L=pd.read_pickle('lines_color.pkl')
def ch(s):
    s=s.strip().lower()
    if 'yum' in s: return 'Yummy'
    if 'pedidos' in s: return 'PedidosYa'
    if 'pick' in s or 'llevar' in s or 'pik' in s: return 'Para llevar'
    if re.fullmatch(r'd ?\d+.*',s) or 'deliv' in s: return 'Delivery propio'
    return 'Salón'
L['canal']=L.id.map(ch); L.loc[(L.canal=='Salón')&(L.deliv>0),'canal']='Delivery propio'
g=L.groupby(['fecha','canal']).agg(pedidos=('real','size'),venta_real=('real','sum')).reset_index(); g['venta_real']=g.venta_real.round(2)
g.to_csv('out/canales_dia_2026.csv',index=False); print(g.fecha.max(), g.pedidos.sum())
# divisas split of OTROS by color
wb=openpyxl.load_workbook('/home/claude/data/cuadres.xlsx',data_only=True)
raw=json.load(open('raw3.json')); dates={x['sheet']:x['date'] for x in raw}
sp={}
for n in wb.sheetnames:
    dd=dates.get(n)
    if not dd or dd<'2026-01-01' or dd>_ULT: continue
    ws=wb[n]; o={'binance':0.0,'paypal':0.0,'otros':0.0}
    for r in range(2,121):
        c=ws.cell(r,6)
        if isinstance(c.value,(int,float)) and c.value>0:
            f=c.fill; rgb=f.fgColor.rgb if f.fill_type=='solid' and f.fgColor.type=='rgb' else None
            o['binance' if rgb=='FF00B050' else 'paypal' if rgb=='FF0070C0' else 'otros']+=c.value
    sp[dd]=o
dv=d[['fecha','efectivo_usd','zelle','binance','pdv_usd','pago_movil_usd']].copy()
dv['binance_verde']=dv.fecha.map(lambda f:sp[f]['binance']); dv['paypal']=dv.fecha.map(lambda f:sp[f]['paypal']); dv['otros_sin_identificar']=dv.fecha.map(lambda f:sp[f]['otros'])
chk=(dv.binance_verde+dv.paypal+dv.otros_sin_identificar-dv.binance).abs().max(); print('check otros split',chk)
out=pd.DataFrame({'fecha':dv.fecha,'efectivo_usd':dv.efectivo_usd,'zelle':dv.zelle,'binance':dv.binance_verde.round(2),'paypal':dv.paypal.round(2),'otros_sin_identificar':dv.otros_sin_identificar.round(2)})
out['total_divisas']=(out.efectivo_usd+out.zelle+out.binance+out.paypal+out.otros_sin_identificar).round(2)
out['cobrado_total']=(out.total_divisas+dv.pdv_usd+dv.pago_movil_usd).round(2)
out.to_csv('out/divisas_dia_2026.csv',index=False)
out['m']=out.fecha.str[:7]; print(out.groupby('m')[['efectivo_usd','zelle','binance','paypal','otros_sin_identificar','total_divisas']].sum().round(0))
