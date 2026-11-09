import json as _j, datetime as _dt
_ULT = max(d['date'] for d in _j.load(open('days.json')))
_u = _dt.date.fromisoformat(_ULT)
_sig = _u + _dt.timedelta(days=1)
CORTE_MES = (_sig.replace(day=1) if _sig.day == 1 else _u.replace(day=1)).isoformat()  # primer día del mes incompleto
import pandas as pd, re, json
df=pd.read_pickle('df.pkl'); L=pd.read_pickle('lines.pkl'); L['date']=pd.to_datetime(L.date)
y=df[(df.date>='2026-01-01')&(df.date<CORTE_MES)].copy()
dn=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo']
mn=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
y['dia']=y.date.dt.dayofweek.map(lambda i:dn[i])
y['zelle_no_sumado']=(y.zelle-y.zelle_sheet).round(2)
y['ticket']=y.real/y.orders.where(y.orders>0)
y['mesas_con_propina_pct']=y.mesas_prop/y.mesas_sheet
r2=lambda s:s.round(2)
d=pd.DataFrame({'fecha':y.date.dt.strftime('%Y-%m-%d'),'mes':y.mes,'dia_semana':y.dia,'venta_real':r2(y.real),'venta_nominal_bcv':r2(y.nominal),
 'pedidos':y.orders,'ticket_real':r2(y.ticket),'efectivo_usd':r2(y.efe),'zelle':r2(y.zelle),'pdv_usd':r2(y.pdv),'pago_movil_usd':r2(y.pm),'binance':r2(y.bin),
 'propinas':r2(y.prop),'delivery':r2(y.deliv),'tasa_bcv':y.tasa,'factor_brecha':y.f,'perdida_brecha':r2(y.perdida_brecha),'creditos_saldo':r2(y.creditos),
 'mesas_con_propina_pct':y.mesas_con_propina_pct.round(3)})
d.to_csv('out/diario_2026.csv',index=False)
g=y.groupby('mes')
m=pd.DataFrame({'dias':g.size(),'venta_real':g.real.sum(),'venta_nominal_bcv':g.nominal.sum(),'pedidos':g.orders.sum(),'efectivo_usd':g.efe.sum(),'zelle':g.zelle.sum(),
 'pdv_usd':g.pdv.sum(),'pago_movil_usd':g.pm.sum(),'binance':g.bin.sum(),'propinas':g.prop.sum(),'delivery':g.deliv.sum(),'perdida_brecha':g.perdida_brecha.sum(),
 'tasa_bcv_fin':g.tasa.last(),'mesas_prop':g.mesas_prop.sum(),'mesas_sheet':g.mesas_sheet.sum(),'zelle_no_sumado':g.apply(lambda x:(x.zelle-x.zelle_sheet).sum())}).reset_index()
m['nombre']=m.mes.map(lambda s:mn[int(s[5:])-1])
m['ticket_real']=m.venta_real/m.pedidos; m['venta_real_dia']=m.venta_real/m.dias; m['pedidos_dia']=m.pedidos/m.dias
cob=m[['efectivo_usd','zelle','pdv_usd','pago_movil_usd','binance']].sum(axis=1)
m['pct_divisas']=(m.efectivo_usd+m.zelle+m.binance)/cob
m['propina_pct_venta']=m.propinas/m.venta_nominal_bcv
m['mesas_con_propina_pct']=m.mesas_prop/m.mesas_sheet
m['ticket_nominal_bcv']=m.venta_nominal_bcv/m.pedidos
m=m.drop(columns=['mesas_prop','mesas_sheet']).round(3)
m.to_csv('out/mensual_2026.csv',index=False)
# weekday
w=y.groupby('dia').agg(venta_real=('real','mean'),pedidos=('orders','mean'),propinas=('prop','mean'),dias=('date','count'),venta_total=('real','sum'))
w['ticket_real']=w.venta_real/w.pedidos; w['pct_semana']=w.venta_total/w.venta_total.sum()
w=w.reindex(dn).reset_index().rename(columns={'dia':'dia_semana'}); w['orden']=range(1,8)
w.round(3).to_csv('out/dia_semana_2026.csv',index=False)
# channels
def chan(i):
    s=i.strip().lower()
    if 'yum' in s: return 'Yummy'
    if 'pedidos' in s: return 'PedidosYa'
    if 'pick' in s or 'llevar' in s or 'pik' in s: return 'Para llevar'
    if re.fullmatch(r'd ?\d+.*',s) or 'deliv' in s: return 'Delivery propio'
    return 'Salón'
L26=L[(L.date>='2026-01-01')&(L.date<CORTE_MES)].copy()
L26['canal']=L26.id.map(chan)
fac=y.set_index(y.date.dt.strftime('%Y-%m-%d')).f
L26['f']=L26.date.dt.strftime('%Y-%m-%d').map(fac)
L26['real']=L26.hard+(L26.bs-L26.prop-L26.deliv)*L26.f
L26['mes']=L26.date.dt.to_period('M').astype(str)
c=L26.groupby(['mes','canal']).agg(pedidos=('real','size'),venta_real=('real','sum')).reset_index()
c['ticket_real']=c.venta_real/c.pedidos
c.round(2).to_csv('out/canales_mes_2026.csv',index=False)
ct=L26.groupby('canal').agg(pedidos=('real','size'),venta_real=('real','sum'),divisas=('hard','sum')).reset_index()
ct['ticket_real']=ct.venta_real/ct.pedidos; ct['pct_pedidos']=ct.pedidos/ct.pedidos.sum(); ct['pct_venta']=ct.venta_real/ct.venta_real.sum()
ct['pct_divisas']=ct.divisas/(L26.groupby('canal').pay.sum().values)
# first/last quarter trend: Jan-Mar vs Aug-Oct pedidos per month
a=L26[L26.mes<='2026-03'].groupby('canal').size()/3; b=L26[L26.mes>='2026-08'].groupby('canal').size()/3
ct['pedidos_mes_ene_mar']=ct.canal.map(a).fillna(0); ct['pedidos_mes_ago_oct']=ct.canal.map(b).fillna(0)
ct=ct.drop(columns=['divisas']).sort_values('pedidos',ascending=False).round(3); ct.to_csv('out/canales_total_2026.csv',index=False); print(ct)
print('lines real sum',L26.real.sum().round(0),'vs',y.real.sum().round(0))
# history
df2=df[df.date<CORTE_MES]
h=df2.groupby(df2.date.dt.to_period('M')).agg(pedidos=('orders','sum'),dias=('date','count'),tasa_bcv_prom=('tasa','mean')).reset_index()
h['anio']=h.date.dt.year.astype(str); h['mes_num']=h.date.dt.month; h['mes']=h.date.astype(str); h['nombre']=h.mes_num.map(lambda i:mn[i-1])
h['pedidos_dia']=h.pedidos/h.dias
h[['mes','anio','mes_num','nombre','pedidos','dias','pedidos_dia','tasa_bcv_prom']].round(2).to_csv('out/pedidos_historico.csv',index=False)
# data alerts
al=d[d.zelle - y.zelle_sheet.round(2).values>0.5][['fecha','zelle']].copy()
al['zelle_en_total_hoja']=y.loc[y.zelle-y.zelle_sheet>0.5,'zelle_sheet'].values
al['diferencia']=al.zelle-al.zelle_en_total_hoja
al.to_csv('out/alertas_zelle.csv',index=False); print(al.shape, al.diferencia.sum())
print(m[['mes','venta_real','pedidos','ticket_real','pct_divisas','propina_pct_venta','mesas_con_propina_pct']])
