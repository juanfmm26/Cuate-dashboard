import openpyxl,re,json,sys,datetime as dt
wb=openpyxl.load_workbook(sys.argv[1],read_only=True,data_only=True)
names=wb.sheetnames
def parse(n):
    s=re.sub(r'[^0-9]',' ',n).split()
    if len(s)==1 and len(s[0])==4: s=[s[0][:2],s[0][2:]]
    if len(s)==1 and len(s[0])==3: s=[s[0][:1],s[0][1:]]
    if len(s)<2: return None
    return int(s[0]),int(s[1])
parsed=[(n,parse(n)) for n in names]
bad=[p for p in parsed if p[1] is None or not(1<=p[1][1]<=12 and 1<=p[1][0]<=31)]
print("bad",bad)
# assign years backward
out=[];nxt=dt.date(2026,11,2);y=2026
for n,p in reversed(parsed):
    if p is None or not(1<=p[1]<=12): out.append((n,None));continue
    d,m=p
    while True:
        try: c=dt.date(y,m,d)
        except ValueError: c=dt.date(y,m,28)
        if c<nxt: break
        y-=1
    out.append((n,c.isoformat()));nxt=c
out.reverse()
dates=dict(out)
res=[]
for n in names:
    ws=wb[n]
    grid={}
    for row in ws.iter_rows(min_row=1,max_row=120,max_col=26):
        for c in row:
            if c.value not in (None,'') and hasattr(c,'coordinate'):
                grid[c.coordinate]=c.value
    res.append({'sheet':n,'date':dates[n],'grid':grid})
json.dump(res,open('raw.json','w'),default=str)
print(len(res))
