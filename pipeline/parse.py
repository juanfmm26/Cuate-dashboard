import json,re,collections
from openpyxl.utils import column_index_from_string as ci, get_column_letter as gl
r=json.load(open('raw3.json'))
def num(v):
    if isinstance(v,(int,float)) and not isinstance(v,bool): return float(v)
    return None
def split(k):
    m=re.match(r'([A-Z]+)(\d+)',k); return m.group(1),int(m.group(2))
days=[]
for x in r:
    if not x['date'] or x['date']<'2024-01-01': continue
    g=x['grid']; 
    hdr={}; hrow=None
    for k,v in g.items():
        c,rw=split(k)
        if rw<=3 and isinstance(v,str):
            s=re.sub(r'\s+',' ',v.strip().upper())
            hdr.setdefault(s,(c,rw))
    def find(*pats):
        for s,(c,rw) in hdr.items():
            for p in pats:
                if re.fullmatch(p,s): return c,rw
        return None
    keys={'tasa':[r'TASA DEL DIA'],'efe':[r'TOTAL EFE.*'],'zelle':[r'TOTAL ZELLE'],'pdv':[r'TOTAL PDV'],'pm':[r'TOTAL PM.*'],
          'bin':[r'TOTAL BINANCE.*',r'TOTAL OTROS'],'prop':[r'TOTAL PROPINA.*'],'deliv':[r'TOTAL DELIVERY'],'total':[r'TOTAL DIA',r'TOTAL']}
    d={'date':x['date'],'sheet':x['sheet']}
    pos={}
    for kk,pats in keys.items():
        f=find(*pats); pos[kk]=f
        if f: d[kk]=num(g.get(f'{f[0]}{f[1]+1}'))
    if pos['total']:
        c,rw=pos['total']; d['real_sheet']=num(g.get(f'{c}{rw+2}'))
    # mesas, ticket, % propina
    for k,v in g.items():
        if isinstance(v,str):
            s=v.strip().upper()
            c,rw=split(k)
            for lab,key in (('MESAS ATENDIDAS','mesas'),('TICKET PROMEDIO','ticket'),('PORCENTAJE DE MESAS CON PROPINA','mesas_prop')):
                if s.startswith(lab):
                    # first numeric to the right in same row
                    for cc in range(ci(c)+1,ci(c)+8):
                        vv=num(g.get(f'{gl(cc)}{rw}'))
                        if vv is not None: d[key]=vv; break
    # line items
    ef=find(r'EFECTIVO')
    lines=[]
    if ef and pos['tasa']:
        c0=ci(ef[0]); hr=ef[1]; idc=gl(c0-1) if c0>1 else None
        names=[re.sub(r'\s+',' ',str(g.get(f'{gl(c0+i)}{hr}','')).strip().upper()) for i in range(8)]
        tasacol=ci(pos['tasa'][0])
        for rw in range(hr+1,121):
            vals=[num(g.get(f'{gl(c0+i)}{rw}')) for i in range(8) if c0+i<tasacol]
            ident=g.get(f'{idc}{rw}') if idc else None
            if any(v for v in vals if v) :
                lines.append({'id':str(ident).strip() if ident is not None else '', 'v':vals})
        d['cols']=names[:tasacol-c0]
    d['lines']=lines
    days.append(d)
json.dump(days,open('days.json','w'))
print(len(days))
miss=collections.Counter()
for d in days:
    for k in ['tasa','efe','zelle','pdv','pm','bin','prop','deliv','total','real_sheet','mesas','ticket']:
        if d.get(k) is None: miss[(d['date'][:7],k)]+=1
for k in sorted(miss): print(k,miss[k],end='; ')
print()
print(collections.Counter(tuple(d.get('cols',[])) for d in days).most_common(6))
