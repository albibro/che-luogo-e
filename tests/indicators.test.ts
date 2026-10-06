import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readFile as readAsync} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {nationalProvider} from '../server/national';
import {deriveTerritory} from '../server/territory';
import {deriveNature,gbifUrl,validateGbif} from '../server/nature';
import {countPharmacies,createServicesProvider,type PharmacyRecord} from '../server/pharmacies';
import {createAirProvider,validateAir} from '../server/air';
import {createIndicatorProviders} from '../server/indicators';
import {createJsonReader} from '../server/upstream';
import {handleApi} from '../worker';
import {assertObservation,type OriginalResponse} from '../src/domain/model';
import {IndicatorCard} from '../src/components/IndicatorCard';
import {indicators} from '../src/data/catalog';
import manifest from '../server/data/pharmacies-manifest.json';
const sha=(s:string|Buffer)=>createHash('sha256').update(s).digest('hex');
function fixture(group:string):OriginalResponse{
 const text=readFileSync(new URL(`./fixtures/${group}-carimate.json`,import.meta.url),'utf8');
 const meta=JSON.parse(readFileSync(new URL(`./fixtures/${group}-carimate-manifest.json`,import.meta.url),'utf8'));
 assert.equal(sha(text),meta.checksum);return {...meta,text,payload:JSON.parse(text)};
}
const readAsset=async(path:string)=>{try{return new Response(await readAsync(new URL('../public'+path,import.meta.url),'utf8'));}catch{return new Response(null,{status:404});}};
test('ISPRA real response retains original percentages, epochs, census and provenance',()=>{
 const b=deriveTerritory(fixture('territory'),'013046');
 assert.deepEqual(b.observations.slice(0,5).map(o=>o.value),[8.778,.29,4429,12.734,22.24]);
 assert.deepEqual(b.observations.slice(0,5).map(o=>o.period!.from.slice(0,4)),['2020','2024','2021','2021','2021']);
 for(const o of b.observations){assertObservation(o);assert.equal(o.sourceUpdatedAt,null);assert.match(o.spatial.resolution,/2024/);}
});
test('ISPRA -1, null, absent fields, invalid percentages and wrong municipality never become zero',()=>{
 for(const missing of [-1,null,undefined,'0',101]){
  const d=fixture('territory');(d.payload as any).aridp2_p=missing;
  const o=deriveTerritory(d,'013046').observations[0];assert.equal(o.value,null);assertObservation(o);
 }
 assert.throws(()=>deriveTerritory(fixture('territory'),'058091'));
});
test('GBIF exact requested bbox, license, years and genuine count are transparent',async()=>{
 const r=(await nationalProvider.getMunicipality('carimate'))!;const d=fixture('nature');
 assert.equal(d.url,gbifUrl(r.boundary!.bbox));
 const u=new URL(d.url);assert.equal(u.searchParams.get('license'),'CC0_1_0');assert.equal(u.searchParams.get('year'),'2015,2025');
 const o=deriveNature(d,r).observations[0];assert.equal(o.value,(d.payload as any).count);assert.equal(o.spatial.level,'bounding-box');assert.equal(o.reliability.level,'low');assertObservation(o);
 const empty=structuredClone(d);(empty.payload as any).count=0;assert.equal(deriveNature(empty,r).observations[0].value,0);assert.match(o.reliability.reason,/non assenza di specie/);
 assert.throws(()=>validateGbif({count:null}));assert.throws(()=>deriveNature(d,{...r,boundary:null}));
});
test('Pharmacies preserve national original archive and all partition hashes',()=>{
 const raw=gunzipSync(readFileSync(new URL('../data/original/farmacie.json.gz',import.meta.url)));
 assert.equal(sha(raw),manifest.sha256);assert.equal(JSON.parse(raw.toString()).length,manifest.rows);
 let count=0;
 for(const [name,hash] of Object.entries(manifest.partitions)){
  const text=readFileSync(new URL('../public/data/farmacie/'+name,import.meta.url),'utf8');assert.equal(sha(text),hash);
  const groups=JSON.parse(text) as Record<string,PharmacyRecord[]>;
  for(const [code,rows] of Object.entries(groups)){count+=rows.length;assert.ok(rows.every(r=>r.cod_comune===code));}
 }
 assert.equal(count,manifest.rows);
});
test('Pharmacies exclude closed historical dispensary and never invent missing municipality counts',async()=>{
 const r=(await nationalProvider.getMunicipality('carimate'))!;
 const rows=fixture('services').payload as PharmacyRecord[];
 const counts=countPharmacies(rows,r.municipality.id,manifest.referenceDate);
 assert.equal(counts.pharmacies,1);assert.equal(counts.dispensaries,1);assert.equal(rows.length,3);
 assert.equal(countPharmacies([],r.municipality.id,manifest.referenceDate).pharmacies,null);
 const broken=structuredClone(rows);broken[0].data_inizio_validita='impossibile';assert.equal(countPharmacies(broken,r.municipality.id,manifest.referenceDate).pharmacies,null);
 assert.throws(()=>countPharmacies(rows,'058091',manifest.referenceDate));
 const bundle=await createServicesProvider(readAsset).get(r);assert.deepEqual(bundle.observations.map(o=>o.value),[1,1]);bundle.observations.forEach(assertObservation);
 await assert.rejects(()=>createServicesProvider(async()=>new Response('{}')).get(r),/Integrità/);
});
test('Air requires a private key and does not call the free API; incompatible payloads rejected',async()=>{
 let calls=0;const fetcher=(async()=>{calls++;throw new Error('must not fetch');}) as typeof fetch;
 const r=(await nationalProvider.getMunicipality('carimate'))!;
 const b=await createAirProvider(undefined,fetcher).get(r);assert.equal(b.status,'configuration-required');assert.equal(calls,0);assert.deepEqual(b.observations,[]);
 assert.throws(()=>validateAir({},r.boundary!.mapCenter,Date.now()/1000));
});
test('Provider requests deduplicate, cache genuine results, redact private URL and reject outages',async()=>{
 const d=fixture('nature');let calls=0;
 const fetcher=(async()=>{calls++;return new Response(d.text);}) as typeof fetch;
 const read=createJsonReader(fetcher);
 const url='https://example.invalid?apikey=test-only-not-a-credential';
 const [a,b]=await Promise.all([read(url,validateGbif,60,'https://example.invalid'),read(url,validateGbif,60,'https://example.invalid')]);
 assert.equal(calls,1);assert.equal(a.checksum,b.checksum);assert.equal(a.url,'https://example.invalid');assert.ok(!JSON.stringify(a).includes('apikey'));
 await createJsonReader(fetcher)(url,validateGbif);assert.equal(calls,1);
 const unavailable=createJsonReader((async()=>new Response(null,{status:429})) as typeof fetch);await assert.rejects(()=>unavailable(url,validateGbif));
 const invalid=createJsonReader((async()=>new Response('{}')) as typeof fetch);await assert.rejects(()=>invalid(url,validateGbif));
});
test('All category endpoints use interchangeable providers; one failure does not fabricate observations',async()=>{
 const providers=createIndicatorProviders({readAsset,fetcher:(async(url)=>{
  if(String(url).startsWith('https://idrogeo.'))return new Response(fixture('territory').text);
  if(String(url).startsWith('https://api.gbif.'))return new Response(fixture('nature').text);
  throw new Error('unexpected upstream');
 }) as typeof fetch});
 for(const group of ['territory','services','nature','air']){
  const r=await handleApi(new Request(`https://test/api/v1/municipalities/carimate/indicators/${group}`),'istat',readAsset,undefined,providers);assert.equal(r.status,200);
 }
 providers.territory={id:'ispra',async get(){throw new Error('outage');}};
 assert.equal((await handleApi(new Request('https://test/api/v1/municipalities/carimate/indicators/territory'),'istat',readAsset,undefined,providers)).status,503);
 assert.equal((await handleApi(new Request('https://test/api/v1/municipalities/unknown/indicators/services'),'istat',readAsset,undefined,providers)).status,404);
 const other=await handleApi(new Request('https://test/api/v1/municipalities/carimate/indicators/services'),'istat',readAsset,undefined,providers);assert.equal(other.status,200);
});
test('Cards show source-specific provenance instead of NASA labels on other datasets',()=>{
 const o=deriveTerritory(fixture('territory'),'013046').observations[2];
 const html=renderToStaticMarkup(createElement(IndicatorCard,{definition:indicators.find(d=>d.id==='population')!,observation:o,sourceName:'ISPRA / ISTAT'}));
 assert.match(html,/4\.?429 <small>/);assert.match(html,/2021/);assert.match(html,/Dato censito/);assert.ok(!html.includes('NASA'));
});
