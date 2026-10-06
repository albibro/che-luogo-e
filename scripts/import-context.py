"""Import reviewed official snapshots; never downloads during the Cloudflare build.
python3 scripts/import-context.py income /absolute/mef.zip
python3 scripts/import-context.py soil /absolute/soil.xlsx  (requires openpyxl)
python3 scripts/import-context.py schools /absolute/state.csv /absolute/parity.csv
Revisions/URLs below must be reviewed before importing a different edition.
"""
import csv, gzip, hashlib, io, json, pathlib, shutil, sys, zipfile
from datetime import datetime, timezone

ROOT = pathlib.Path(__file__).resolve().parents[1]
kind, *files = sys.argv[1:]
sha = lambda b: hashlib.sha256(b).hexdigest()
encode = lambda o: json.dumps(o, ensure_ascii=False, separators=(',', ':'), allow_nan=False).encode()
registry = json.loads((ROOT / 'server/data/istat-comuni.raw.json').read_text())['resultset']
current = {r['PRO_COM_T'] for r in registry}
groups, originals, rejected = {}, [], []

def preserve(path, name, url):
    raw = pathlib.Path(path).read_bytes()
    target = ROOT / 'data/original' / name
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(gzip.compress(raw, mtime=0) if name.endswith('.gz') else raw)
    originals.append({'file': str(target.relative_to(ROOT)), 'url': url, 'sha256': sha(raw)})
    return raw

def add(code, row):
    if not isinstance(code, str) or len(code) != 6 or not code.isdigit():
        rejected.append(row)
        return
    groups.setdefault(code[:3], {}).setdefault(code, []).append(row)

if kind == 'income':
    source_id, year, license_name = 'redditi', '2024', 'CC BY 3.0'
    url = 'https://www1.finanze.gov.it/finanze/analisi_stat/public/v_4_0_0/contenuti/Redditi_e_principali_variabili_IRPEF_su_base_comunale_CSV_2024.zip?d=1615465800'
    raw = preserve(files[0], 'mef-income-2024.zip', url)
    archive = zipfile.ZipFile(io.BytesIO(raw))
    names = [n for n in archive.namelist() if n.endswith('.csv')]
    assert len(names) == 1
    rows = list(csv.DictReader(io.StringIO(archive.read(names[0]).decode('utf-8-sig')), delimiter=';'))
    for row in rows:
        assert row['Anno di imposta'] == year
        add(row['Codice Istat Comune'], row)
    method = 'mef-2024-csv-v1'
    excluded = []
elif kind == 'soil':
    import openpyxl
    source_id, year, license_name = 'ispra-soil', '2024', 'CC BY 4.0'
    url = 'https://www.isprambiente.gov.it/it/attivita/suolo-e-territorio/suolo/il-consumo-di-suolo/consumo_di_suolo_estratto_dati_2025_anni_2006_2024.xlsx'
    raw = preserve(files[0], 'ispra-soil-2025.xlsx', url)
    book = openpyxl.load_workbook(io.BytesIO(raw), read_only=True, data_only=True)
    values = iter(book['Comuni_2006_2024'].values)
    columns = next(values)
    assert columns[0] == 'PRO_COM' and columns[-1] == 'Suolo consumato 2024 [%]'
    rows = [dict(zip(columns, row)) for row in values]
    for row in rows:
        code = row['PRO_COM']
        add(str(code).zfill(6) if isinstance(code, int) else None, row)
    (ROOT / 'docs/sources/soil-fields.json').write_bytes(encode(list(book['Descrizione_campi'].values)))
    method = 'ispra-soil-2025-v1'
    excluded = []
elif kind == 'broadband':
    source_id, year, license_name = 'agcom', '2026', 'CC BY 4.0'
    url = 'https://geo.agcom.it/arcgis/sharing/rest/content/items/25830559c5784c1eb5eb1cf748889f4c/data'
    raw = preserve(files[0], 'agcom-260630.csv.gz', url)
    rows = list(csv.DictReader(io.StringIO(raw.decode('utf-8-sig')), delimiter=';'))
    for row in rows:
        assert 'Copertura FTTH DESI' in row
        add(row['pro_com'].zfill(6), row)
    metadata = json.loads((ROOT / 'docs/sources/agcom-item.json').read_text())
    assert metadata['title'] == 'Reportistica 260630 Comuni'
    method = 'agcom-260630-csv-v1'
    excluded = []
elif kind == 'schools':
    source_id, year, license_name = 'scuole', '202627', 'IODL 2.0'
    urls = ['https://dati.istruzione.it/opendata/opendata/catalogo/elements1/' + n for n in ['SCUANAGRAFESTAT20262720260901.csv', 'SCUANAGRAFEPAR20262720260901.csv']]
    mapping = {}
    for r in registry:
        mapping.setdefault(r['COD_CATASTO'], []).append(r['PRO_COM_T'])
    rows = []
    for path, sector, url in zip(files, ['statale', 'paritaria'], urls, strict=True):
        raw = preserve(path, f'mim-{sector}-202627.csv.gz', url)
        records = list(csv.DictReader(io.StringIO(raw.decode('utf-8-sig'))))
        assert records and 'CODICESCUOLA' in records[0] and 'CODICECOMUNESCUOLA' in records[0]
        for row in records:
            assert row['ANNOSCOLASTICO'] == year
            item = {'sector': sector, 'record': row}
            rows.append(item)
            codes = mapping.get(row['CODICECOMUNESCUOLA'], [])
            if len(codes) != 1:
                rejected.append(item)
            else:
                add(codes[0], item)
    method = 'mim-belfiore-school-unit-202627-v1'
    excluded = ['007', '021', '022']
else:
    raise ValueError('Unknown snapshot')

assert rows and groups
target = ROOT / 'public/data' / kind
staging = target.with_name(kind + '-next')
shutil.rmtree(staging, ignore_errors=True)
staging.mkdir(parents=True)
partitions = {}
for province, data in sorted(groups.items()):
    raw = encode(data)
    name = province + '.json'
    (staging / name).write_bytes(raw)
    partitions[name] = sha(raw)
manifest = dict(sourceId=source_id, referenceYear=year, retrievedAt=datetime.now(timezone.utc).isoformat(), license=license_name, methodVersion=method, originals=originals, partitions=partitions, rows=len(rows), unmappedRows=len(rejected), excludedProvinces=excluded, matchedCurrentMunicipalities=len(current.intersection(c for g in groups.values() for c in g)))
if kind == 'broadband':
    manifest['referenceDate'] = '2026-06-30'
    manifest['sourceUpdatedAt'] = datetime.fromtimestamp(metadata['modified']/1000, timezone.utc).isoformat()
    manifest['metadataTitle'] = metadata['title']
shutil.rmtree(target, ignore_errors=True)
staging.rename(target)
(ROOT / f'server/data/{kind}-manifest.json').write_bytes(encode(manifest))
(ROOT / f'data/original/{kind}-unmapped.json.gz').write_bytes(gzip.compress(encode(rejected), mtime=0))
print(json.dumps({k:v for k,v in manifest.items() if k not in ('partitions', 'originals')}, ensure_ascii=False))
