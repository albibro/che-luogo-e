import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync,readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import manifest from '../server/data/boundaries-manifest.json';
import index from '../server/data/boundaries-index.json';
import { nationalProvider,getBoundarySummary } from '../server/national';
import { handleApi } from '../worker';
import { boundarySvg } from '../src/maps/boundary';
import type { BoundaryFeature,BoundaryResponse } from '../src/domain/model';
const files=new URL('../public/geodata/istat-2026/',import.meta.url);
const sha=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
test('Geometry lineage and every generated asset match their checksums',()=>{
 assert.equal(sha(readFileSync(new URL('../data/original/istat-boundaries-2026.zip',import.meta.url))),manifest.originalSha256);
 assert.deepEqual(readdirSync(new URL('../public/geodata/',import.meta.url)),['istat-2026']);
 assert.equal(readdirSync(files).length,manifest.matchedCount);assert.equal(Object.keys(index).length,manifest.matchedCount);
 for(const [code,row] of Object.entries(index)){
  const raw=readFileSync(new URL(code+'.json',files));assert.equal(sha(raw),row.sha256);
  const feature=JSON.parse(raw.toString()) as BoundaryFeature;
  assert.equal(feature.id,code);assert.equal(feature.properties.istatCode,code);assert.equal(feature.properties.referenceDate,manifest.referenceDate);assert.equal(feature.properties.kind,'derived');
  const polygons=feature.geometry.type==='Polygon'?[feature.geometry.coordinates]:feature.geometry.coordinates;
  for(const polygon of polygons)for(const ring of polygon){assert.ok(ring.length>=4);assert.deepEqual(ring[0],ring.at(-1));for(const [lon,lat] of ring){assert.ok(lon>5&&lon<20&&lat>35&&lat<49);}}
 }
});
test('Unavailable historical boundaries remain missing without inferred successors',async()=>{
 for(const code of manifest.missingCodes){const report=await nationalProvider.getMunicipality(code);assert.ok(report);assert.equal(report.boundary,null);assert.equal(report.municipality.centroid,null);assert.ok(report.boundaryMissingReason);}
 for(const old of manifest.unmatchedHistorical)assert.equal(await nationalProvider.getMunicipality(old.code),null);
});
test('Geometry API attaches provenance, passes real geometry and fails explicitly',async()=>{
 const readAsset=async(path:string)=>new Response(readFileSync(new URL('../public'+path,import.meta.url)),{headers:{'Content-Type':'application/json'}});
 const r=await handleApi(new Request('https://local/api/v1/municipalities/carimate/geometry'),'istat',readAsset);
 assert.equal(r.status,200);const data=(await r.json() as {data:BoundaryResponse}).data;
 assert.equal(data.feature.id,'013046');assert.deepEqual(data.provenance,getBoundarySummary('013046'));
 assert.equal((await handleApi(new Request('https://local/api/v1/municipalities/024129/geometry'),'istat',readAsset)).status,404);
 assert.equal((await handleApi(new Request('https://local/api/v1/municipalities/carimate/geometry'))).status,503);
 assert.equal((await handleApi(new Request('https://local/api/v1/municipalities/carimate/geometry'),'istat',async()=>new Response(null,{status:404}))).status,503);
});
test('Accessible static silhouette comes from source rings including holes and islands',()=>{
 for(const code of ['013046','058091','118006','084023']){
  const feature=JSON.parse(readFileSync(new URL(code+'.json',files),'utf8')) as BoundaryFeature;
  const path=boundarySvg(feature);assert.ok(path.startsWith('M'));assert.ok(!/NaN|Infinity/.test(path));
  const polygons=feature.geometry.type==='Polygon'?[feature.geometry.coordinates]:feature.geometry.coordinates;
  assert.equal(path.split(' Z').length-1,polygons.reduce((n,p)=>n+p.length,0));
 }
});
