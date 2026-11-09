import json,re,collections,datetime as dt
import pandas as pd
days=json.load(open('days.json'))
raw={x['date']:x['grid'] for x in json.load(open('raw3.json')) if x['date']}
def factor(d):
    if d<'2026-01-01': return None
    if d<='2026-06-30': return 0.75
    if d<='2026-07-15': return 0.80
    return 0.85
def chan(i):
    s=i.strip().lower()
    if s.startswith('yum') or 'yummy' in s: return 'Yummy'
    if 'pick' in s or 'llevar' in s or 'pik' in s: return 'Pickup / llevar'
    if re.fullmatch(r'd ?\d+.*',s) or 'deliv' in s or 'delivery' in s: return 'Delivery propio'
    if re.fullmatch(r'(m|e|t|b|s|p|mesa) ?\d+.*',s): return 'Salón (mesa)'
    if s=='' : return 'Sin identificar'
    return 'Salón (nombre)'
rows=[];lines=[]
for d in days:
    t=d.get('tasa')
    if not t: continue
    cols=d['cols'];L=d['lines']
    idx={n:i for i,n in enumerate(cols)}
    def g(l,n):
        i=idx.get(n); 
        return (l['v'][i] or 0) if i is not None and i<len(l['v']) else 0
    two='PROPINA DÓLAR' in idx
    rec=dict(date=d['date'],tasa=t,orders=0,efe=0,zelle=0,pdv=0,pm=0,bin=0,prop=0,deliv=0)
    for l in L:
        efe,ze,pdv,pm,bi,dl=g(l,'EFECTIVO'),g(l,'ZELLE'),g(l,'PDV')/t,g(l,'PAGO MOVIL / EFECTIVO')/t,g(l,'OTROS'),g(l,'DELIVERY')
        if two: pr=g(l,'PROPINA DÓLAR')+g(l,'PROPINA BS')/t
        else: pr=None
        rec['efe']+=efe;rec['zelle']+=ze;rec['pdv']+=pdv;rec['pm']+=pm;rec['bin']+=bi;rec['deliv']+=dl
        pay=efe+ze+pdv+pm+bi
        if pay>0:
            rec['orders']+=1
            lines.append(dict(date=d['date'],id=l['id'],chan=chan(l['id']),pay=pay,prop=pr or 0,deliv=dl,hard=efe+ze+bi,bs=pdv+pm))
    rec['prop']=d.get('prop') or 0   # sheet tip total (Q2)
    rec['mesas_sheet']=d.get('mesas'); rec['mesas_prop']=d.get('mesas_prop')
    rec['total_sheet']=d.get('total'); rec['zelle_sheet']=d.get('zelle') or 0
    gr=raw[d['date']]; c=gr.get('L32'); rec['creditos']=c if isinstance(c,(int,float)) else None
    rows.append(rec)
df=pd.DataFrame(rows); df['date']=pd.to_datetime(df['date'])
df['nominal']=df.efe+df.zelle+df.pdv+df.pm+df.bin-df.prop-df.deliv
df['f']=df.date.dt.strftime('%Y-%m-%d').map(factor)
df['real']=df.efe+df.zelle+df.bin+(df.pdv+df.pm-df.prop-df.deliv)*df.f
df['perdida_brecha']=df.nominal-df.real
df['mes']=df.date.dt.to_period('M').astype(str)
df['dow']=df.date.dt.dayofweek
df.to_pickle('df.pkl'); pd.DataFrame(lines).to_pickle('lines.pkl')
y=df[df.date>='2026-01-01']
m=y.groupby('mes').agg(dias=('date','count'),real=('real','sum'),nominal=('nominal','sum'),orders=('orders','sum'),efe=('efe','sum'),zelle=('zelle','sum'),pdv=('pdv','sum'),pm=('pm','sum'),bin=('bin','sum'),prop=('prop','sum'),deliv=('deliv','sum'),tasa_ini=('tasa','first'),tasa_fin=('tasa','last'),perd=('perdida_brecha','sum'),cred=('creditos','last'),zs=('zelle_sheet','sum'),ts=('total_sheet','sum'))
m['ticket']=m.real/m.orders
m['real_dia']=m.real/m.dias
pd.set_option('display.width',250)
print(m.round(1))
print('YTD real',y.real.sum().round(0),'orders',y.orders.sum(),'zelle no sumado',(y.zelle-y.zelle_sheet).sum().round(1))
