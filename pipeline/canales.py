import json as _j, datetime as _dt
_ULT = max(d['date'] for d in _j.load(open('days.json')))
_u = _dt.date.fromisoformat(_ULT)
_sig = _u + _dt.timedelta(days=1)
CORTE_MES = (_sig.replace(day=1) if _sig.day == 1 else _u.replace(day=1)).isoformat()  # primer día del mes incompleto
import pandas as pd,re
L=pd.read_pickle('lines_color.pkl')
def ch(s):
    s=s.strip().lower()
    if 'yum' in s: return 'Yummy'
    if 'pedidos' in s: return 'PedidosYa'
    if 'pick' in s or 'llevar' in s or 'pik' in s: return 'Para llevar'
    if re.fullmatch(r'd ?\d+.*',s) or 'deliv' in s: return 'Delivery propio'
    return 'Salón'
L['canal']=L.id.map(ch); L.loc[(L.canal=='Salón')&(L.deliv>0),'canal']='Delivery propio'
L=L[L.fecha<CORTE_MES]; L['mes']=L.fecha.str[:7]
c=L.groupby(['mes','canal']).agg(pedidos=('real','size'),venta_real=('real','sum')).reset_index(); c['ticket_real']=c.venta_real/c.pedidos
c.round(2).to_csv('out/canales_mes_2026.csv',index=False)
ct=L.groupby('canal').agg(pedidos=('real','size'),venta_real=('real','sum'),divisas=('hard','sum'),pay=('pay','sum')).reset_index()
ct['ticket_real']=ct.venta_real/ct.pedidos; ct['pct_pedidos']=ct.pedidos/ct.pedidos.sum(); ct['pct_venta']=ct.venta_real/ct.venta_real.sum(); ct['pct_divisas']=ct.divisas/ct.pay
a=L[L.mes<='2026-03'].groupby('canal').size()/3; b=L[L.mes>='2026-08'].groupby('canal').size()/3
ct['pedidos_mes_ene_mar']=ct.canal.map(a).fillna(0); ct['pedidos_mes_ago_oct']=ct.canal.map(b).fillna(0)
ct=ct.drop(columns=['divisas','pay']).sort_values('pedidos',ascending=False).round(3); ct.to_csv('out/canales_total_2026.csv',index=False)
print('canales ok', CORTE_MES)
