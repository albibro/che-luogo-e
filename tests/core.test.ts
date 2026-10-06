import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { nationalProvider,municipalities,getBoundarySummary } from '../server/national';
import { sourceRegistry,istatSource } from '../server/sources';
import { assertSourceApproved,createProvider } from '../src/providers';
import { createMapProvider } from '../src/maps/provider';
import worker,{handleApi} from '../worker';
test('Official snapshot is complete, traceable and unique',async()=>{
 const status=await nationalProvider.getStatus();assert.equal(municipalities.length,status.count);
 assert.equal(new Set(municipalities.map(x=>x.id)).size,status.count);assert.equal(new Set(municipalities.map(x=>x.slug)).size,status.count);
 assert.equal(new Set(municipalities.map(x=>x.region)).size,20);assert.ok(municipalities.every(x=>/^\d{6}$/.test(x.istatCode!)));
 assert.ok(municipalities.every(x=>JSON.stringify(x.centroid)===JSON.stringify(getBoundarySummary(x.id)?.centroid??null)));
 assert.equal(createHash('sha256').update(readFileSync(new URL('../server/data/istat-comuni.raw.json',import.meta.url))).digest('hex'),status.sha256);
});
test('Search handles accents, code, province and national coverage',async()=>{
 for(const name of ['Carimate','Roma','Palermo','Cagliari','Aosta','Trento'])assert.equal((await nationalProvider.searchMunicipalities(name))[0]?.name,name);
 assert.equal((await nationalProvider.searchMunicipalities('  CÀRImate Como '))[0]?.istatCode,'013046');
 assert.equal((await nationalProvider.searchMunicipalities('013046'))[0]?.name,'Carimate');
 for(const query of ['','c','Via inesistente 123456789'])assert.deepEqual(await nationalProvider.searchMunicipalities(query),[]);
 assert.ok((await nationalProvider.searchMunicipalities('sa')).length<=20);
});
test('Reports never contain invented observations or coordinates',async()=>{
 const r=await nationalProvider.getMunicipality('carimate');assert.ok(r);assert.equal(r.original.COMUNE,'Carimate');
 assert.equal(r.mode,'live');assert.deepEqual(r.observations,[]);assert.deepEqual(r.assessments,[]);assert.deepEqual(r.municipality.centroid,r.boundary?.centroid);assert.equal(r.boundary?.referenceDate,'2026-01-01');assert.equal('score' in r,false);
 r.original.COMUNE='';assert.equal((await nationalProvider.getMunicipality('carimate'))?.original.COMUNE,'Carimate');
});
test('Missing, ambiguous and aborted lookups are explicit',async()=>{
 assert.equal(await nationalProvider.getMunicipality('unknown'),null);
 const names=new Map<string,number>();for(const m of municipalities){const key=m.slug.replace(/-\d{6}$/,'');names.set(key,(names.get(key)??0)+1);}
 for(const [name,count] of names)if(count>1)assert.equal(await nationalProvider.getMunicipality(name),null);
 const c=new AbortController();c.abort();await assert.rejects(nationalProvider.searchMunicipalities('Roma',c.signal),{name:'AbortError'});
});
test('Unreviewed sources, mock providers and unconfigured maps fail closed',()=>{
 assert.doesNotThrow(()=>assertSourceApproved(istatSource));for(const s of sourceRegistry.filter(s=>s.status!=='approved'))assert.throws(()=>assertSourceApproved(s));
 assert.throws(()=>createProvider('mock'));assert.throws(()=>createProvider('unknown'));assert.equal(createMapProvider({provider:'disabled'}),null);assert.throws(()=>createMapProvider({provider:'maptiler'}));
});
test('API serves official provenance and correct failure statuses',async()=>{
 const response=await handleApi(new Request('https://local/api/v1/municipalities/carimate'));const body=await response.json() as {data:{original:{COMUNE:string};observations:unknown[];provenance:{sourceId:string}}};
 assert.equal(response.status,200);assert.equal(body.data.original.COMUNE,'Carimate');assert.deepEqual(body.data.observations,[]);assert.equal(body.data.provenance.sourceId,'istat-situas');
 assert.equal((await handleApi(new Request('https://local/api/v1/municipalities/unknown'))).status,404);assert.equal((await handleApi(new Request('https://local/api/v1/sources',{method:'POST'}))).status,405);
 assert.equal((await handleApi(new Request('https://local/api/v1/sources'),'mock')).status,503);assert.equal((await handleApi(new Request('https://local/api/v1/municipalities?q='+'a'.repeat(101)))).status,400);
 assert.equal((await handleApi(new Request('https://local/api/unknown'))).status,404);
});
test('Every official municipality is addressable',async()=>{
 for(const m of municipalities)assert.equal((await nationalProvider.getMunicipality(m.slug))?.municipality.id,m.id);
});
test('Worker supports direct links, canonical redirects and true 404',async()=>{
 const paths:string[]=[];const env={ASSETS:{fetch:async(r:Request)=>{paths.push(new URL(r.url).pathname);return new Response('<html>shell</html>',{headers:{'Content-Type':'text/html'}});}}};
 const canonical=(await nationalProvider.getMunicipality('carimate'))!.municipality.slug;
 const redirect=await worker.fetch(new Request('https://local/comuni/carimate'),env);assert.equal(redirect.status,308);assert.equal(redirect.headers.get('Location'),`https://local/comuni/${canonical}`);
 assert.equal((await worker.fetch(new Request(`https://local/comuni/${canonical}`),env)).status,200);assert.equal(paths.pop(),'/comuni/_shell/');
 assert.equal((await worker.fetch(new Request('https://local/comuni/unknown'),env)).status,404);
});
