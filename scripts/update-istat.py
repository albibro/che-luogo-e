"""Import official SITUAS: python3 scripts/update-istat.py YYYY-MM-DD.
Review diff and run npm run check before release. No upstream calls per search.
"""
import datetime, hashlib, json, pathlib, re, sys, urllib.request
reference=datetime.date.fromisoformat(sys.argv[1])
if reference>datetime.date.today(): raise SystemExit('Future date rejected')
root=pathlib.Path(__file__).resolve().parents[1]/'server/data'
url='https://situas-servizi.istat.it/publish/reportspooljson?pfun=61&pdata='+reference.strftime('%d/%m/%Y')
with urllib.request.urlopen(url,timeout=90) as response: payload=response.read()
rows=json.loads(payload)['resultset']
if not isinstance(rows,list) or not rows: raise SystemExit('Invalid or empty roster')
required=['PRO_COM_T','COMUNE','COMUNE_IT','DEN_REG','DEN_UTS','COD_REG','SIGLA_AUTOMOBILISTICA']
for row in rows:
 if any(not isinstance(row.get(k),str) or not row[k] for k in required) or not re.fullmatch(r'\d{6}',row['PRO_COM_T']): raise SystemExit('Unexpected schema')
if len({r['PRO_COM_T'] for r in rows})!=len(rows) or len({r['COD_REG'] for r in rows})!=20: raise SystemExit('Duplicate or incomplete roster')
manifest=json.loads((root/'istat-manifest.json').read_text())
if abs(len(rows)-manifest['count'])>manifest['count']*.05: raise SystemExit('Large count change: manual review required')
manifest.update(sourceUrl=url,referenceDate=reference.isoformat(),retrievedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),sourceUpdatedAt=None,count=len(rows),sha256=hashlib.sha256(payload).hexdigest())
(root/'istat-comuni.raw.json').write_bytes(payload)
(root/'istat-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(f'Imported {len(rows)} official records. Review before release.')
