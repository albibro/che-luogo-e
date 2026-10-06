import type {IndicatorBundle,MunicipalityReport,Observation,OriginalResponse} from '../src/domain/model';
import {createJsonReader} from './upstream';
const specs=[['pm25-forecast','pm2_5'],['pm10-forecast','pm10'],['no2-forecast','nitrogen_dioxide'],['ozone-forecast','ozone']] as const;
export function validateAir(p:any,point:[number,number],time:number){
 if(!p||!Number.isFinite(p.latitude)||!Number.isFinite(p.longitude)||Math.abs(p.latitude-point[1])>.2||Math.abs(p.longitude-point[0])>.2||p.utc_offset_seconds!==0||p.hourly_units?.time!=='unixtime'||!Array.isArray(p.hourly?.time)||p.hourly.time.length!==1||p.hourly.time[0]!==time)throw new Error('CAMS: cella o orizzonte temporale non corrispondente');
}
export function deriveAir(original:OriginalResponse,report:MunicipalityReport,time:number):IndicatorBundle{
 const p=original.payload as any;validateAir(p,report.boundary!.mapCenter,time);const at=new Date(time*1000).toISOString();
 const observations:Observation[]=specs.map(([id,field])=>{
  const n=p.hourly[field]?.[0];const unit=p.hourly_units[field];const valid=typeof n==='number'&&Number.isFinite(n)&&n>=0&&['μg/m³','µg/m³'].includes(unit)&&p.hourly[field].length===1;
  return {id:`${report.municipality.id}-${id}-${time}`,municipalityId:report.municipality.id,indicatorId:id,sourceId:'cams',kind:'forecast',value:valid?n:null,unit:'µg/m³',missingReason:valid?null:'Concentrazione assente, non valida o unità non riconosciuta.',period:{from:at,to:at},retrievedAt:original.retrievedAt,sourceUpdatedAt:null,spatial:{level:'grid',resolution:`CAMS Europa 0,1° (~11 km). Cella restituita: ${p.latitude}° N, ${p.longitude}° E. Non misura di centralina.`,coveragePercent:null},reliability:{level:'medium',reason:'Previsione modellistica oraria; nessuna incertezza quantitativa fornita dalla risposta. Non descrive esposizione personale o medie annuali.'},methodVersion:'cams-europe-next-hour-v1',methodDescription:`Concentrazione prevista per ${at} (UTC), prossima ora intera al momento della richiesta. CAMS European Air Quality Forecast tramite Open-Meteo. Valore originale senza soglie, punteggi o giudizi sanitari.`,lineage:[original.url],raw:{payload:p,originalUrl:original.url,checksum:original.checksum}};
 });
 return {sourceId:'cams',sourceName:'CAMS Europa / Open-Meteo',status:'ready',message:`Previsioni per ${at} UTC su griglia di circa 11 km. Non sono misure osservate o medie annue. CAMS ENSEMBLE, elaborazione Open-Meteo.`,observations,original};
}
export function createAirProvider(key?:string,fetcher:typeof fetch=fetch,cache?:Cache){const read=createJsonReader(fetcher,cache);return {id:'cams',async get(report:MunicipalityReport):Promise<IndicatorBundle>{
 if(!key)return {sourceId:'cams',sourceName:'CAMS Europa / Open-Meteo',status:'configuration-required',message:'Collegamento implementato. Manca OPEN_METEO_API_KEY: serve un abbonamento Open-Meteo che autorizzi l’uso commerciale. Il servizio gratuito non viene chiamato.',observations:[],original:null};
 if(!report.boundary)throw new Error('Coordinate verificate non disponibili');
 const point=report.boundary.mapCenter,time=(Math.floor(Date.now()/3600000)+1)*3600,at=new Date(time*1000).toISOString().slice(0,16);
 const u=new URL('https://customer-air-quality-api.open-meteo.com/v1/air-quality');u.search=new URLSearchParams({latitude:String(point[1]),longitude:String(point[0]),hourly:specs.map(s=>s[1]).join(','),domains:'cams_europe',timezone:'GMT',timeformat:'unixtime',start_hour:at,end_hour:at,cell_selection:'nearest'}).toString();
 const publicUrl=u.toString();u.searchParams.set('apikey',key);
 const original=await read(u.toString(),p=>validateAir(p,point,time),600,publicUrl);return deriveAir(original,report,time);
}};}
