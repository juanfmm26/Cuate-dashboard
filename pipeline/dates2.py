import json,re,collections,datetime as dt
r=json.load(open('raw2.json'))
prev=None
for x in r:
    if not x['date']: continue
    d=dt.date.fromisoformat(x['date'])
    if prev and (prev-d).days>20:
        # month typo: use prev's month (or next month)
        for mm in (prev.month, prev.month%12+1):
            yy=prev.year+(1 if mm<prev.month else 0)
            try: c=dt.date(yy,mm,d.day)
            except: continue
            if c>prev: x['date']=c.isoformat(); x['fixed']=True; d=c; break
    prev=d if (not prev or d>prev) else prev
dc=collections.Counter(x['date'] for x in r if x['date'])
print('dups',[k for k,v in dc.items() if v>1])
print([(x['sheet'],x['date']) for x in r if x.get('fixed')])
c=collections.Counter((x['date'] or 'None')[:7] for x in r)
print(' | '.join(f'{k}:{c[k]}' for k in sorted(c)))
json.dump(r,open('raw3.json','w'))
