import json,re,collections,datetime as dt
r=json.load(open('raw.json'))
def parse(n):
    s=re.sub(r'[^0-9]',' ',n).split()
    if len(s)==1 and len(s[0])==4: s=[s[0][:2],s[0][2:]]
    if len(s)<2: return None
    d,m=int(s[0]),int(s[1])
    if not(1<=m<=12 and 1<=d<=31): return None
    return d,m
y=2023;pm=None
for i,x in enumerate(r):
    p=parse(x['sheet'])
    if p is None: x['date']=None; continue
    d,m=p
    if pm is not None and m < pm-6: y+=1
    pm=m
    try: x['date']=dt.date(y,m,d).isoformat()
    except: x['date']=None
c=collections.Counter((x['date'] or 'None')[:7] for x in r)
print(' | '.join(f'{k}:{c[k]}' for k in sorted(c)))
# check monotonic violations
prev=None
for i,x in enumerate(r):
    if x['date']:
        if prev and x['date']<=prev[1]: print('nonmono',i,repr(prev[0]),prev[1],'->',repr(x['sheet']),x['date'])
        prev=(x['sheet'],x['date'])
# duplicates
dc=collections.Counter(x['date'] for x in r if x['date'])
print('dups',[k for k,v in dc.items() if v>1])
json.dump(r,open('raw2.json','w'))
