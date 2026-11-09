import json as _j, datetime as _dt
_ULT = max(d['date'] for d in _j.load(open('days.json')))
_u = _dt.date.fromisoformat(_ULT)
_sig = _u + _dt.timedelta(days=1)
CORTE_MES = (_sig.replace(day=1) if _sig.day == 1 else _u.replace(day=1)).isoformat()  # primer día del mes incompleto
import openpyxl,json,collections,re
import pandas as pd
wb=openpyxl.load_workbook('/home/claude/data/cuadres.xlsx',data_only=True)
days={d['date']:d for d in json.load(open('days.json'))}
raw=json.load(open('raw3.json')); dates={x['sheet']:x['date'] for x in raw}
df=pd.read_pickle('df.pkl'); fac=dict(zip(df.date.dt.strftime('%Y-%m-%d'),df.f))
def name_chan(s):
    s=s.strip().lower()
    if 'yum' in s: return 'Yummy'
    if 'pedidos' in s: return 'PedidosYa'
    if 'pick' in s or 'llevar' in s or 'pik' in s: return 'Para llevar'
    if re.fullmatch(r'd ?\d+.*',s) or 'deliv' in s: return 'Delivery propio'
    return 'Salón'
out=[]
for n in wb.sheetnames:
    d=dates.get(n)
    if not d or d<'2026-01-01' or d>_ULT: continue
    ws=wb[n]; t=days[d]['tasa']; cols=days[d]['cols']; idx={c:i for i,c in enumerate(cols)}
    for r in range(2,121):
        vals=[ws.cell(r,2+i).value for i in range(len(cols))]
        num=lambda k:(vals[idx[k]] if k in idx and isinstance(vals[idx[k]],(int,float)) else 0)
        pay=num('EFECTIVO')+num('ZELLE')+num('PDV')/t+num('PAGO MOVIL / EFECTIVO')/t+num('OTROS')
        if pay<=0: continue
        a=ws.cell(r,1); f=a.fill; rgb=f.fgColor.rgb if f.fill_type=='solid' and f.fgColor.type=='rgb' else None
        nm=str(a.value or '')
        ch=name_chan(nm)
        if rgb=='FFFF5050': ch='PedidosYa'
        elif rgb=='FF9966FF': ch='Yummy'
        prop=num('PROPINA DÓLAR')+num('PROPINA BS')/t
        hard=num('EFECTIVO')+num('ZELLE')+num('OTROS'); bs=num('PDV')/t+num('PAGO MOVIL / EFECTIVO')/t; dl=num('DELIVERY')
        out.append(dict(fecha=d,id=nm,color=rgb,canal=ch,pay=pay,hard=hard,bs=bs,prop=prop,deliv=dl,real=hard+(bs-prop-dl)*fac[d]))
L=pd.DataFrame(out); L.to_pickle('lines_color.pkl')
L['mes']=L.fecha.str[:7]
print(len(L))
print(L.pivot_table(index='mes',columns='canal',values='pay',aggfunc='count').fillna(0).astype(int))
print(L[L.color=='FFFF5050'].groupby('mes').size())
print(L[(L.canal=='PedidosYa')].id.str.lower().value_counts().head(10))
print(L[L.color=='FFFF5050'].fecha.min())
