import type { ClimateResponse, Observation, SourceReview } from '../src/domain/model';
export const climateSource:SourceReview={id:'nasa-power',name:'Clima storico · NASA POWER / MERRA-2',publisher:'NASA Langley Research Center',url:'https://power.larc.nasa.gov/docs/methodology/meteorology/',status:'approved',license:{name:'Dati aperti NASA · attribuzione richiesta',url:'https://forum.earthdata.nasa.gov/viewtopic.php?t=82',commercialUse:'allowed',attribution:'NASA POWER / NASA Langley Research Center / MERRA-2'},reviewedAt:'2026-10-05',coverage:'Globale; Italia inclusa. Anno 2025.',granularity:'Griglia 0,5° lat × 0,625° lon; rianalisi, non stazioni comunali',limitations:['Contesto regionale: non descrive il microclima del comune o di un immobile.','Una cella selezionata dal punto interno del confine: non media territoriale.','Un singolo anno non è una normale climatica.','Richiesti tutti i giorni; dati mancanti non sostituiti. Aggiornamento originale non fornito.','Servizio senza SLA verificato; cache di 7 giorni, nessun download massivo.']};
export const CLIMATE_YEAR=2025;
export type PowerPayload={type:string;geometry:{type:string;coordinates:number[]};header:{start:string;end:string;fill_value:number;sources:string[];time_standard:string};properties:{parameter:Record<string,Record<string,number|null>>};parameters:Record<string,{units:string}>};
export interface ClimateProvider {id:string;get(point:[number,number]):Promise<PowerDownload>}
export type PowerDownload={payload:PowerPayload;originalText:string;originalUrl:string;retrievedAt:string;checksum:string;cell:[number,number]};
export function cellFor([lon,lat]:[number,number]):[number,number]{return [Math.round(lon/.625)*.625,Math.round(lat/.5)*.5];}
export function powerUrl(cell:[number,number]){const u=new URL('https://power.larc.nasa.gov/api/temporal/daily/point');u.search=new URLSearchParams({parameters:'T2M,T2M_MAX,PRECTOTCORR',community:'AG',longitude:String(cell[0]),latitude:String(cell[1]),start:'20250101',end:'20251231',format:'JSON','time-standard':'LST'}).toString();return u.toString();}
const dates:string[]=[];for(let d=Date.UTC(2025,0,1);d<Date.UTC(2026,0,1);d+=86400000)dates.push(new Date(d).toISOString().slice(0,10).replaceAll('-',''));
export function validatePayload(p:PowerPayload,cell:[number,number]){
 if(p?.type!=='Feature'||p.geometry?.type!=='Point'||p.geometry.coordinates?.[0]!==cell[0]||p.geometry.coordinates?.[1]!==cell[1]||p.header?.start!=='20250101'||p.header.end!=='20251231'||p.header.time_standard!=='LST'||!Array.isArray(p.header.sources)||!p.header.sources.includes('MERRA2')||!p.properties?.parameter||!p.parameters)throw new Error('Risposta NASA incompatibile: periodo, griglia o modello non verificati');
}
export function deriveClimate(d:PowerDownload,municipalityId:string):ClimateResponse{
 validatePayload(d.payload,d.cell);
 const specs=[{id:'temperature',key:'T2M',unit:'°C',expected:'C',method:'Media aritmetica T2M dei giorni dell’anno.'},{id:'hot-days',key:'T2M_MAX',unit:'giorni',expected:'C',method:'Conteggio dei giorni con T2M_MAX > 30 °C; soglia descrittiva, non sanitaria.'},{id:'precipitation',key:'PRECTOTCORR',unit:'mm',expected:'mm/day',method:'Somma delle precipitazioni giornaliere PRECTOTCORR (mm/day × 1 giorno).'}];
 const observations:Observation[]=specs.map(s=>{
  const series=d.payload.properties.parameter[s.key]??{};
  const values=dates.map(day=>series[day]);const valid=values.filter((v):v is number=>typeof v==='number'&&Number.isFinite(v)&&v!==d.payload.header.fill_value&&v!==-999&&(s.key!=='PRECTOTCORR'||v>=0));
  const unitsOk=d.payload.parameters[s.key]?.units===s.expected;
  const complete=valid.length===dates.length&&unitsOk;
  const value=!complete?null:s.id==='hot-days'?valid.filter(v=>v>30).length:s.id==='temperature'?valid.reduce((a,b)=>a+b,0)/dates.length:valid.reduce((a,b)=>a+b,0);
  return {id:`${municipalityId}-${s.id}-2025-nasa`,municipalityId,indicatorId:s.id,sourceId:climateSource.id,kind:'derived',value,unit:s.unit,missingReason:complete?null:!unitsOk?'Unità della fonte diversa da quella prevista.':`Serie incompleta: ${valid.length} giorni validi su ${dates.length}. Nessuna integrazione dei giorni mancanti.`,period:{from:'2025-01-01',to:'2025-12-31'},retrievedAt:d.retrievedAt,sourceUpdatedAt:null,spatial:{level:'grid',resolution:'MERRA-2: 0,5° lat × 0,625° lon; campionamento di una cella, non media comunale',coveragePercent:null},reliability:{level:'medium',reason:'Rianalisi adatta al contesto regionale; non rappresenta microclima, stazioni o singoli immobili.'},methodVersion:'nasa-power-annual-v1',methodDescription:s.method,lineage:[`${d.originalUrl}#${s.key}`,`sha256:${d.checksum}`],raw:{payload:{parameter:s.key,series,header:d.payload.header,units:d.payload.parameters[s.key],cell:d.cell},originalUrl:d.originalUrl,checksum:d.checksum}};
 });
 return {sourceId:climateSource.id,year:CLIMATE_YEAR,cell:d.cell,observations,original:{payload:d.payload,text:d.originalText,url:d.originalUrl,checksum:d.checksum,retrievedAt:d.retrievedAt}};
}
const memory=new Map<string,{value:PowerDownload;expires:number}>();const pending=new Map<string,Promise<PowerDownload>>();
export function createPowerProvider(fetcher:typeof fetch=fetch,cache?:Cache):ClimateProvider{return {id:'nasa-power',async get(point){
 const cell=cellFor(point),url=powerUrl(cell),cached=memory.get(url);if(cached&&cached.expires>Date.now())return cached.value;
 if(pending.has(url))return pending.get(url)!;
 const task=(async()=>{
  const key=new Request('https://che-luogo-e-cache.invalid/power-v1/'+encodeURIComponent(url));
  const hit=await cache?.match(key).catch(()=>undefined);if(hit){const value=await hit.json() as PowerDownload;validatePayload(value.payload,cell);return value;}
  const response=await fetcher(url,{signal:AbortSignal.timeout(25000),headers:{Accept:'application/json'}});
  if(!response.ok)throw new Error(`NASA POWER non disponibile (${response.status})`);
  const originalText=await response.text();const payload=JSON.parse(originalText) as PowerPayload;validatePayload(payload,cell);
  const checksum=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(originalText)))).map(b=>b.toString(16).padStart(2,'0')).join('');
  const value={payload,originalText,originalUrl:url,retrievedAt:new Date().toISOString(),checksum,cell};
  const ttl=7*86400; if(memory.size>=100)memory.delete(memory.keys().next().value!);memory.set(url,{value,expires:Date.now()+ttl*1000});
  await cache?.put(key,new Response(JSON.stringify(value),{headers:{'Content-Type':'application/json','Cache-Control':`public, max-age=${ttl}`}})).catch(()=>{});
  return value;
 })();pending.set(url,task);try{return await task;}finally{pending.delete(url);}
}};}
