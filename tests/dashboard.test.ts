import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {MemoryRouter} from 'react-router-dom';
import {compareObservations} from '../src/domain/comparison';
import {freshGroups} from '../src/domain/presentation';
import {nationalProvider} from '../server/national';
import {createIndicatorProviders} from '../server/indicators';
import {ComparisonRow,ComparePage} from '../src/components/ComparePage';
import {MunicipalityDashboard} from '../src/components/MunicipalityDashboard';
import {indicators} from '../src/data/catalog';
import type {Observation} from '../src/domain/model';
import worker from '../worker';
const readAsset=async(path:string)=>new Response(readFileSync(new URL('../public'+path,import.meta.url),'utf8'));
const providers=createIndicatorProviders({readAsset});
async function pair(){const a=(await nationalProvider.getMunicipality('carimate'))!,b=(await nationalProvider.getMunicipality('roma'))!;return {a,b,aa:await providers.income.get(a),bb:await providers.income.get(b)};}
test('Comparison uses real MEF records, absolute B-A, and permits a genuine zero baseline',async()=>{
 const {aa,bb}=await pair();const a=aa.observations[1],b=bb.observations[1];const r=compareObservations(a,b);
 assert.equal(r.comparable,true);assert.equal(r.difference,b.value!-a.value!);
 const zero={...a,value:0};assert.equal(compareObservations(zero,b).difference,b.value);
 const percent={...a,unit:'%'};assert.equal(compareObservations(percent,{...b,unit:'%'}).unit,'punti percentuali');
});
test('Comparison fails closed for missing values, periods, source, kind, method and resolution',async()=>{
 const {aa}=await pair();const o=aa.observations[1];
 for(const changed of [{value:null,missingReason:'Assente'},{value:NaN},{period:null},{period:{from:'2023-01-01',to:'2023-12-31'}},{unit:'USD'},{sourceId:'another'},{kind:'forecast'},{methodVersion:null},{methodVersion:'v-other'},{spatial:{...o.spatial,level:'province'}},{spatial:{...o.spatial,resolution:'Altra scala'}},{indicatorId:'another'}]){
  const r=compareObservations(o,{...o,...changed} as Observation);assert.equal(r.comparable,false,JSON.stringify(changed));assert.equal(r.difference,null);
 }
 assert.equal(compareObservations(undefined,o).comparable,false);
 const bbox={...o,indicatorId:'gbif-records',spatial:{...o.spatial,level:'bounding-box' as const}};assert.equal(compareObservations(bbox,bbox).comparable,false);
});
test('Same climate cell is explicitly disclosed; forecast instants must match',async()=>{
 const {aa}=await pair();const o:Observation={...aa.observations[1],indicatorId:'temperature',spatial:{level:'grid',resolution:'MERRA-2',coveragePercent:null},raw:{...aa.observations[1].raw,payload:{cell:[9.375,45.5]}}};
 assert.match(compareObservations(o,o).reason,/Stessa cella/);
 const forecast={...o,kind:'forecast' as const,period:{from:'2026-10-06T10:00:00Z',to:'2026-10-06T10:00:00Z'}};
 assert.equal(compareObservations(forecast,{...forecast,period:{from:'2026-10-06T11:00:00Z',to:'2026-10-06T11:00:00Z'}}).comparable,false);
});
test('Comparison renders two sources and suspends difference for incompatible records',async()=>{
 const {aa,bb}=await pair();const d=indicators.find(d=>d.id==='income-mean')!;const a=aa.observations[1],b=bb.observations[1];
 const html=renderToStaticMarkup(createElement(ComparisonRow,{definition:d,a,b,nameA:'Carimate',nameB:'Roma'}));
 assert.match(html,/Carimate/);assert.match(html,/Roma/);assert.match(html,/Differenza B/);assert.match(html,/dati e fonti/);
 const bad=renderToStaticMarkup(createElement(ComparisonRow,{definition:d,a,b:{...b,methodVersion:'different'},nameA:'Carimate',nameB:'Roma'}));
 assert.match(bad,/Non confrontabile/);assert.ok(!bad.includes('class="comparison-track"'));assert.ok(!bad.includes('Differenza B'));
});
test('Dashboard renders genuine headline metrics, source states and expanded records without synthetic data',async()=>{
 const {a,aa}=await pair();const extra=freshGroups();for(const s of Object.values(extra))s.loading=false;extra.income.data=aa;
 const html=renderToStaticMarkup(createElement(MemoryRouter,null,createElement(MunicipalityDashboard,{name:'Carimate',slug:a.municipality.slug,code:a.municipality.id,observations:aa.observations,extra,climate:null,climateState:'error',climateError:'NASA non raggiungibile',retry:()=>{},selected:'tutte',onSelect:()=>{}})));
 assert.match(html,/Dentro Carimate/);assert.match(html,/headline-grid/);assert.match(html,/dashboard-panels/);assert.match(html,/3\.?137/);assert.match(html,/NASA non raggiungibile/);assert.match(html,/confronta\?a=carimate-013046/);assert.match(html,/Nessun voto complessivo/);
});
test('Comparison page provides independently labelled accessible selectors and survives empty SSR',()=>{
 const html=renderToStaticMarkup(createElement(MemoryRouter,null,createElement(ComparePage,{provider:nationalProvider})));
 assert.match(html,/Cerca comune a/);assert.match(html,/Cerca comune b/);assert.match(html,/Scegli i tuoi due luoghi/);
});
test('Worker serves a direct shareable comparison URL through prerendered assets',async()=>{
 let path='';const response=await worker.fetch(new Request('https://example.test/confronta?a=carimate-013046&b=roma-058091'),{ASSETS:{async fetch(request:Request){path=new URL(request.url).pathname;return new Response('comparison-shell');}}});
 assert.equal(path,'/confronta');assert.equal(response.status,200);assert.equal(await response.text(),'comparison-shell');
});
