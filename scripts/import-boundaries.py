"""Derive web geometries from the unmodified official ISTAT 2026 archive.
Run in a venv with geo-requirements.txt installed. The archive is retained locally.
No invented points, union of successors or correction of invalid polygons.
"""
import datetime, hashlib, io, json, pathlib, shutil, tempfile, zipfile
import shapefile
from pyproj import CRS, Transformer
from shapely.geometry import shape, mapping
from shapely.ops import transform

ROOT=pathlib.Path(__file__).resolve().parents[1]
ARCHIVE=ROOT/'data/original/istat-boundaries-2026.zip'
URL='https://www.istat.it/storage/cartografia/confini_amministrativi/generalizzati/2026/Limiti01012026_g.zip'
REFERENCE='2026-01-01'
METHOD='istat-boundaries-web-v1'
raw=ARCHIVE.read_bytes()
archive_hash=hashlib.sha256(raw).hexdigest()
roster={r['PRO_COM_T']:r for r in json.loads((ROOT/'server/data/istat-comuni.raw.json').read_text())['resultset']}
with zipfile.ZipFile(io.BytesIO(raw)) as archive:
 prefix=next(n[:-4] for n in archive.namelist() if n.startswith('Com') and n.endswith('.shp'))
 crs=CRS.from_wkt(archive.read(prefix+'.prj').decode())
 if crs.to_epsg()!=32632: raise ValueError('Unexpected coordinate system')
 reader=shapefile.Reader(shp=io.BytesIO(archive.read(prefix+'.shp')),shx=io.BytesIO(archive.read(prefix+'.shx')),dbf=io.BytesIO(archive.read(prefix+'.dbf')),encoding='utf-8')
 project=Transformer.from_crs(crs,4326,always_xy=True).transform
 index={};unmatched=[];invalid=[];name_changes=[];all_codes=[]
 destination=ROOT/'public/geodata/istat-2026'
 destination.parent.mkdir(parents=True,exist_ok=True)
 temp=pathlib.Path(tempfile.mkdtemp(prefix='geo-build-',dir=ROOT/'server/data'))
 try:
  for item in reader.iterShapeRecords():
   props=item.record.as_dict();code=props['PRO_COM_T'];all_codes.append(code)
   if code not in roster: unmatched.append({'code':code,'name':props['COMUNE']});continue
   if code in index:raise ValueError('Duplicate geometry code')
   polygon=shape(item.shape.__geo_interface__)
   if polygon.is_empty or not polygon.is_valid or polygon.geom_type not in ['Polygon','MultiPolygon']:
    invalid.append(code);continue
   # Historical boundary: code correspondence does not assert unchanged territory today.
   if props['COMUNE']!=roster[code]['COMUNE']:name_changes.append(code)
   centroid=transform(project,polygon.centroid)
   anchor=transform(project,polygon.representative_point())
   # No extra simplification. Only CRS conversion; keep all source vertices and holes.
   geographic=transform(project,polygon)
   if not geographic.is_valid:raise ValueError('Invalid geometry after reprojection')
   geometry=mapping(geographic)
   bounds=list(geographic.bounds)
   if not (5<bounds[0]<20 and 5<bounds[2]<20 and 35<bounds[1]<49 and 35<bounds[3]<49):raise ValueError('Geometry outside expected Italy envelope')
   feature={'type':'Feature','id':code,'properties':{'istatCode':code,'sourceId':'istat-boundaries','referenceDate':REFERENCE,'kind':'derived','methodVersion':METHOD},'geometry':geometry}
   payload=json.dumps(feature,ensure_ascii=False,separators=(',',':'),allow_nan=False).encode()
   (temp/(code+'.json')).write_bytes(payload)
   index[code]={'centroid':[centroid.x,centroid.y],'mapCenter':[anchor.x,anchor.y],'bbox':bounds,'originalName':props['COMUNE'],'sha256':hashlib.sha256(payload).hexdigest(),'originalAttributes':props}
  manifest={'sourceId':'istat-boundaries','referenceDate':REFERENCE,'retrievedAt':datetime.datetime.fromtimestamp(ARCHIVE.stat().st_mtime,datetime.timezone.utc).isoformat(),'sourceUpdatedAt':'2026-03-02','originalUrl':URL,'originalSha256':archive_hash,'license':'CC BY 4.0','licenseUrl':'https://creativecommons.org/licenses/by/4.0/','methodVersion':METHOD,'sourceCrs':'EPSG:32632','outputCrs':'EPSG:4326','simplification':'Nessuna ulteriore semplificazione: versione generalizzata ISTAT originale, riproiettata.','sourceCount':len(reader),'matchedCount':len(index),'rosterCount':len(roster),'missingCodes':sorted(set(roster)-set(index)),'unmatchedHistorical':unmatched,'invalidCodes':invalid,'nameChanges':name_changes,'warning':'Confini a fini statistici al 1 gennaio 2026. Non catastali. Possibili variazioni successive; corrispondenza di codice non garantisce territorio invariato.','reliability':{'level':'medium','reason':'Fonte ufficiale per la geografia statistica storica; scala non certificabile uniformemente. Non adatta a verifiche immobiliari puntuali.'}}
  if len(index)<len(roster)*.99:raise ValueError('Too many unmatched/invalid boundaries')
  # Stage first; only replace the generated directory after successful validation.
  if destination.exists():shutil.rmtree(destination)
  temp.rename(destination)
  (ROOT/'server/data/boundaries-index.json').write_text(json.dumps(index,ensure_ascii=False,separators=(',',':'))+'\n')
  (ROOT/'server/data/boundaries-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
  print(json.dumps(manifest,ensure_ascii=False,indent=2))
 finally:
  if temp.exists():shutil.rmtree(temp)
