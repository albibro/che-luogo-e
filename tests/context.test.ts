import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {nationalProvider,municipalities} from '../server/national';
import {createIndicatorProviders} from '../server/indicators';
import {deriveIncome,deriveSoil,numeric,loadSnapshot} from '../server/snapshots';
import {deriveSchools} from '../server/schools';
import {deriveBroadband,parseCoverage} from '../server/broadband';
import {assertObservation,type OriginalResponse} from '../src/domain/model';
import {handleApi} from '../worker';
import {categories,indicators} from '../src/data/catalog';
import {contextSources} from '../server/context-sources';
import {renderToStaticMarkup} from 'react-dom/server';
import {createElement} from 'react';
import {IndicatorCard} from '../src/components/IndicatorCard';
const sha=(b:string|Buffer)=>createHash('sha256').update(b).digest('hex');
const readAsset=async(path:string)=>{try{return new Response(readFileSync(new URL('../public'+path,import.meta.url),'utf8'));}catch{return new Response(null,{status:404});}};
const manifests=Object.fromEntries(['income','soil','schools','broadband'].map(k=>[k,JSON.parse(readFileSync(new URL(`../server/data/${k}-manifest.json`,import.meta.url),'utf8'))]));
test('Four national snapshots retain exact original archives, partition hashes and coverage counts',()=>{
 for(const [kind,manifest] of Object.entries(manifests)){
  for(const original of manifest.originals){let raw=readFileSync(new URL('../'+original.file,import.meta.url));if(original.file.endsWith('.gz'))raw=gunzipSync(raw);assert.equal(sha(raw),original.sha256);}
  let count=0;const codes=new Set<string>();
  for(const [name,hash] of Object.entries(manifest.partitions)){
   const text=readFileSync(new URL(`../public/data/${kind}/${name}`,import.meta.url),'utf8');assert.equal(sha(text),hash);
   for(const [code,rows] of Object.entries(JSON.parse(text))){assert.match(code,/^\d{6}$/);assert.equal(code.slice(0,3)+'.json',name);count+=(rows as unknown[]).length;codes.add(code);}
  }
  assert.equal(count+manifest.unmappedRows,manifest.rows);
  assert.equal(municipalities.filter(m=>codes.has(m.id)).length,manifest.matchedCurrentMunicipalities);
 }
});
test('MEF uses income frequency, preserves suppressed cells and rejects identity mismatch',async()=>{
 const r=(await nationalProvider.getMunicipality('carimate'))!;const original=await loadSnapshot('income',manifests.income,r.municipality.id,readAsset);
 const bundle=deriveIncome(original,r);assert.equal(bundle.observations.find(o=>o.indicatorId==='taxpayers')?.value,3247);
 assert.equal(bundle.observations.find(o=>o.indicatorId==='income-mean')?.value,113986003/3137);
 assert.notEqual(bundle.observations.find(o=>o.indicatorId==='income-mean')?.value,113986003/3247);
 for(const o of bundle.observations){assertObservation(o);assert.equal(o.period?.from,'2024-01-01');}
 for(const missing of ['', ' ', '***', null, undefined]){
  const copy=structuredClone(original);(copy.payload as any[])[0]['Reddito complessivo - Ammontare in euro']=missing;
  assert.equal(deriveIncome(copy,r).observations.find(o=>o.indicatorId==='income-mean')?.value,null);assert.equal(numeric(missing),null);
 }
 const copy=structuredClone(original);(copy.payload as any[])[0]['Reddito complessivo - Frequenza']='0';assert.equal(deriveIncome(copy,r).observations.find(o=>o.indicatorId==='income-mean')?.value,null);
 assert.throws(()=>deriveIncome(original,{...r,municipality:{...r.municipality,id:'058091'}}));
});
test('ISPRA soil retains genuine zero, negative net changes and exact source percentages',async()=>{
 const r=(await nationalProvider.getMunicipality('carimate'))!;const original=await loadSnapshot('soil',manifests.soil,r.municipality.id,readAsset);
 const bundle=deriveSoil(original,r);assert.deepEqual(bundle.observations.map(o=>o.value),[30.80912662,159.2,.2,0]);bundle.observations.forEach(assertObservation);
 // Find a real municipality with a negative net change rather than invent a fixture.
 const rows=JSON.parse(readFileSync(new URL('../public/data/soil/001.json',import.meta.url),'utf8'));
 const code=Object.keys(rows).find(k=>rows[k][0]['Incremento netto 2023-2024 [ettari]']<0)!;assert.ok(code);
 const report=(await nationalProvider.getMunicipality(code))!;
 const real=await loadSnapshot('soil',manifests.soil,code,readAsset);assert.ok(deriveSoil(real,report).observations[2].value!<0);
});
test('MIM keeps sectors and units distinct; missing sectors and excluded provinces never become zero',async()=>{
 const r=(await nationalProvider.getMunicipality('carimate'))!;const original=await loadSnapshot('schools',manifests.schools,r.municipality.id,readAsset);
 const bundle=deriveSchools(original,r);assert.deepEqual(bundle.observations.map(o=>o.value),[3,3,2,0,1]);assert.equal(bundle.entries?.length,6);bundle.observations.forEach(assertObservation);
 const noParity=structuredClone(original);noParity.payload=(original.payload as any[]).filter(r=>r.sector==='statale');assert.equal(deriveSchools(noParity,r).observations[1].value,null);
 const aosta=(await nationalProvider.getMunicipality('aosta'))!;const absent=await loadSnapshot('schools',manifests.schools,aosta.municipality.id,readAsset);assert.ok(deriveSchools(absent,aosta).observations.every(o=>o.value===null));
 const conflict=structuredClone(original);const extra=structuredClone((conflict.payload as any[])[0]);extra.record.DENOMINAZIONESCUOLA+=' changed';(conflict.payload as any[]).push(extra);assert.throws(()=>deriveSchools(conflict,r));
});
test('AGCOM percentages retain comma precision, date and model nature, never convert blanks to zero',async()=>{
 const r=(await nationalProvider.getMunicipality('carimate'))!;const original=await loadSnapshot('broadband',manifests.broadband,r.municipality.id,readAsset);
 const bundle=deriveBroadband(original,r);assert.deepEqual(bundle.observations.map(o=>o.value),[99.4,98.1,1800]);
 for(const o of bundle.observations){assertObservation(o);assert.equal(o.kind,'derived');assert.equal(o.period?.from,'2026-06-30');assert.ok(o.sourceUpdatedAt);}
 for(const bad of ['', ' ', null, '101%', '99.4', '-1%', 'n.d.'])assert.equal(parseCoverage(bad),null);assert.equal(parseCoverage('0,0%'),0);
});
test('Four API groups operate from actual snapshots for Carimate, Roma and Palermo without upstream calls',async()=>{
 const providers=createIndicatorProviders({readAsset,fetcher:(async()=>{throw new Error('No upstream for snapshots');}) as typeof fetch});
 for(const slug of ['carimate','roma','palermo'])for(const group of Object.keys(manifests)){
  const response=await handleApi(new Request(`https://local/api/v1/municipalities/${slug}/indicators/${group}`),'istat',readAsset,undefined,providers);assert.equal(response.status,200,`${slug}/${group}`);
  const b=(await response.json() as any).data;assert.ok(b.observations.some((o:any)=>o.value!==null));b.observations.forEach(assertObservation);
 }
 await assert.rejects(()=>loadSnapshot('income',manifests.income,'013046',async()=>new Response('{}')),/Integrità/);
 const renamed=(await nationalProvider.getMunicipality('castegnero-nanto'))!;assert.ok(renamed);
 const noData=await providers.income.get(renamed);assert.ok(noData.observations.every(o=>o.value===null));
});
test('Expanded catalog includes the proposed themes, explicit unavailable reasons and licensed real sources',()=>{
 assert.equal(new Set(indicators.map(i=>i.id)).size,indicators.length);
 for(const id of ['case','sicurezza','economia','scuole','connettivita','territorio'])assert.ok(categories.some(c=>c.id===id));
 for(const d of indicators.filter(d=>!d.providerGroup&&d.category!=='clima'))assert.ok(d.unavailableReason,d.id);
 for(const s of contextSources){assert.equal(s.status,'approved');assert.equal(s.license.commercialUse,'allowed');assert.ok(s.license.url);}
 const html=renderToStaticMarkup(createElement(IndicatorCard,{definition:indicators.find(i=>i.id==='house-sale')!}));assert.match(html,/Fonte da integrare/);assert.ok(!html.includes('API collegata'));
});
