import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {createHash} from 'node:crypto';
import {renderToStaticMarkup} from 'react-dom/server';
import {createElement} from 'react';
import {cellFor,deriveClimate,type PowerDownload} from '../server/climate';
import {handleApi} from '../worker';
import {assertObservation} from '../src/domain/model';
import {IndicatorCard} from '../src/components/IndicatorCard';
import {indicators} from '../src/data/catalog';
import {createMapProvider} from '../src/maps/provider';
import manifest from './fixtures/nasa-power-manifest.json';
const originalText=readFileSync(new URL('./fixtures/nasa-power-2025-45.5-9.375.json',import.meta.url),'utf8');
const data:PowerDownload={...manifest,cell:manifest.cell as [number,number],payload:JSON.parse(originalText),originalText};
test('Real NASA response retains SHA and correctly aggregates all 365 days',()=>{
 assert.equal(createHash('sha256').update(originalText).digest('hex'),manifest.checksum);
 const result=deriveClimate(data,'013046');assert.equal(result.observations.length,3);
 assert.ok(Math.abs(result.observations[0].value!-14.199506849315068)<1e-10);assert.equal(result.observations[1].value,23);assert.ok(Math.abs(result.observations[2].value!-1237.87)<1e-8);
 for(const o of result.observations){assertObservation(o);assert.equal(o.kind,'derived');assert.equal(o.spatial.level,'grid');assert.equal(o.sourceUpdatedAt,null);}
 assert.equal(result.original.text,originalText);assert.deepEqual(cellFor([9.11,45.7]),[9.375,45.5]);
});
test('Absent days, nulls, fill values and wrong units never produce an annual value',()=>{
 for(const missing of [null,-999,undefined]){const d=structuredClone(data);if(missing===undefined)delete d.payload.properties.parameter.T2M['20250101'];else d.payload.properties.parameter.T2M['20250101']=missing;
  const [o]=deriveClimate(d,'013046').observations;assert.equal(o.value,null);assert.match(o.missingReason!,/incompleta/);assertObservation(o);
 }
 const d=structuredClone(data);d.payload.parameters.T2M.units='F';assert.equal(deriveClimate(d,'013046').observations[0].value,null);
 const wrong=structuredClone(data);wrong.payload.header.start='20240101';assert.throws(()=>deriveClimate(wrong,'013046'));
 const other=structuredClone(data);other.payload.geometry.coordinates[0]=0;assert.throws(()=>deriveClimate(other,'013046'));
});
test('Climate API exposes actual values; outages and missing geometry are explicit',async()=>{
 const provider={id:'recorded-real-response',async get(){return data;}};
 const r=await handleApi(new Request('https://test/api/v1/municipalities/carimate/climate'),'istat',undefined,provider);assert.equal(r.status,200);assert.equal((await r.json() as any).data.observations[1].value,23);
 const fail={id:'failure-test',async get():Promise<PowerDownload>{throw new Error('unavailable');}};
 assert.equal((await handleApi(new Request('https://test/api/v1/municipalities/carimate/climate'),'istat',undefined,fail)).status,503);
 assert.equal((await handleApi(new Request('https://test/api/v1/municipalities/024129/climate'),'istat',undefined,fail)).status,422);
 assert.equal((await handleApi(new Request('https://test/api/v1/municipalities/unknown/climate'),'istat',undefined,fail)).status,404);
});
test('Cards render available data and distinguish sources still to integrate',()=>{
 const html=renderToStaticMarkup(createElement(IndicatorCard,{definition:indicators[0],observation:deriveClimate(data,'013046').observations[0]}));assert.ok(html.includes('14,2'));assert.ok(html.includes('rianalisi'));assert.ok(!html.includes('Fonte da integrare'));
 const empty=renderToStaticMarkup(createElement(IndicatorCard,{definition:indicators.find(i=>i.id==='pm25')!}));assert.ok(empty.includes('Fonte da integrare'));
});
test('Esri credentials remain opt-in and the NASA fallback has been removed',()=>{
 const cfg=createMapProvider({})!;assert.equal(cfg.id,'esri');assert.equal(cfg.satelliteAvailable,false);
 assert.throws(()=>createMapProvider({provider:'maptiler',key:'not-a-real-key'}));
});
