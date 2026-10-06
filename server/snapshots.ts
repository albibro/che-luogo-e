import type {IndicatorBundle, MunicipalityReport, Observation, OriginalResponse} from '../src/domain/model';
import incomeManifest from './data/income-manifest.json';
import soilManifest from './data/soil-manifest.json';
import {checksum} from './upstream';
export interface SnapshotManifest {sourceId:string;referenceYear:string;retrievedAt:string;methodVersion:string;originals:{url:string;sha256:string}[];partitions:Record<string,string>}
type Row=Record<string,unknown>;
export async function loadSnapshot(kind:string,manifest:SnapshotManifest,code:string,readAsset?:(path:string)=>Promise<Response>):Promise<OriginalResponse>{
 if(!readAsset)throw new Error('Archivio non configurato');
 const filename=code.slice(0,3)+'.json';let rows:unknown[]=[];
 if(manifest.partitions[filename]){
  const response=await readAsset(`/data/${kind}/${filename}`);if(!response.ok)throw new Error('Archivio non raggiungibile');
  const text=await response.text();if(await checksum(text)!==manifest.partitions[filename])throw new Error('Integrità archivio non verificata');
  rows=JSON.parse(text)[code]??[];if(!Array.isArray(rows))throw new Error('Schema archivio non valido');
 }
 const text=JSON.stringify(rows);return {payload:rows,text,checksum:await checksum(text),url:manifest.originals[0].url,retrievedAt:manifest.retrievedAt};
}
export function numeric(value:unknown):number|null{
 if(typeof value==='number')return Number.isFinite(value)?value:null;
 if(typeof value!=='string'||!/^[-+]?\d+(\.\d+)?$/.test(value.trim()))return null;
 const n=Number(value.trim());return Number.isFinite(n)?n:null;
}
export function snapshotObservation(report:MunicipalityReport,manifest:SnapshotManifest,original:OriginalResponse,spec:{id:string;unit:string;value:number|null;description:string;kind?:'observed'|'derived';from?:string;to?:string;missing?:string;fields?:string[];payload?:unknown}):Observation{
 return {id:`${report.municipality.id}-${spec.id}-${manifest.sourceId}`,municipalityId:report.municipality.id,indicatorId:spec.id,sourceId:manifest.sourceId,kind:spec.kind??'derived',value:spec.value,unit:spec.unit,missingReason:spec.value!==null?null:spec.missing??'Valore assente, oscurato dalla fonte o codice comunale storico non corrispondente. Non viene convertito in zero.',period:{from:spec.from??`${manifest.referenceYear}-01-01`,to:spec.to??`${manifest.referenceYear}-12-31`},retrievedAt:manifest.retrievedAt,sourceUpdatedAt:null,spatial:{level:'municipality',resolution:'Aggregato comunale della fonte, alla data indicata. Codici storici non ricostruiti per fusioni o variazioni.',coveragePercent:null},reliability:{level:'medium',reason:'Fonte istituzionale importata integralmente; non è un aggiornamento in tempo reale. L’assenza di corrispondenza territoriale o di un campo impedisce il calcolo.'},methodVersion:manifest.methodVersion,methodDescription:spec.description,lineage:manifest.originals.flatMap(o=>[o.url,`sha256:${o.sha256}`]),raw:{payload:spec.payload??{fields:spec.fields??[],records:original.payload,originalDownloads:manifest.originals},originalUrl:original.url,checksum:original.checksum}};
}
export function deriveIncome(original:OriginalResponse,report:MunicipalityReport):IndicatorBundle{
 const rows=original.payload as Row[];if(rows.length>1)throw new Error('MEF: codice duplicato');
 const row=rows[0];if(row&&(row['Codice Istat Comune']!==report.municipality.id||row['Anno di imposta']!=='2024'))throw new Error('MEF: record incompatibile');
 const n=(key:string)=>numeric(row?.[key]);
 const count=(key:string)=>{const v=n(key);return v!==null&&v>=0&&Number.isInteger(v)?v:null;};
 const mean=(base:string)=>{const amount=n(base+' - Ammontare in euro'),frequency=count(base+' - Frequenza');return amount!==null&&frequency!==null&&frequency>0?amount/frequency:null;};
 const description='Anno d’imposta 2024, dichiarazioni 2025. Importi in euro nominali. Dati MEF – Dipartimento delle Finanze, CC BY 3.0. Campi oscurati conservati come mancanti, senza ricostruirli.';
 const specs=[
  {id:'taxpayers',unit:'contribuenti',value:count('Numero contribuenti'),kind:'observed' as const,description:description+' Numero dei contribuenti: non coincide con la popolazione residente.',fields:['Numero contribuenti']},
  ...[['income-mean','Reddito complessivo'],['salary-mean','Reddito da lavoro dipendente e assimilati'],['pension-mean','Reddito da pensione']].map(([id,base])=>({id,unit:'€/anno',value:mean(base),description:description+` Ammontare della voce «${base}» / frequenza della stessa voce. La frequenza indica dichiarazioni con valore significativo secondo MEF, non tutti i contribuenti o residenti. Non è reddito netto disponibile né patrimonio.`,fields:[base+' - Ammontare in euro',base+' - Frequenza']})),
  {id:'income-recipients',unit:'contribuenti',value:count('Reddito complessivo - Frequenza'),kind:'observed' as const,description:description+' Frequenza del reddito complessivo: denominatore della media, esclusi i valori nulli secondo la nota MEF.',fields:['Reddito complessivo - Frequenza']},
 ];
 return {sourceId:'redditi',sourceName:'MEF – Dipartimento delle Finanze',status:'ready',message:'Redditi fiscali 2024; archivio ufficiale importato ed esposto dalla nostra API. Media per dichiarazione con reddito significativo, non reddito medio di tutti i residenti. Valori oscurati non ricostruiti.',observations:specs.map(s=>snapshotObservation(report,incomeManifest,original,s)),original};
}
export function deriveSoil(original:OriginalResponse,report:MunicipalityReport):IndicatorBundle{
 const rows=original.payload as Row[];if(rows.length>1)throw new Error('ISPRA suolo: codice duplicato');const row=rows[0];
 if(row&&String(row.PRO_COM).padStart(6,'0')!==report.municipality.id)throw new Error('ISPRA suolo: comune errato');
 const fields=[['soil-percent','Suolo consumato 2024 [%]','%'],['soil-hectares','Suolo consumato 2024 [ettari]','ha'],['soil-change','Incremento netto 2023-2024 [ettari]','ha'],['soil-restored','Ripristino 2023-2024 [ettari]','ha']];
 const observations=fields.map(([id,field,unit])=>{let value=numeric(row?.[field]);if(value!==null&&((id!=='soil-change'&&value<0)||(unit==='%'&&value>100)))value=null;
  return snapshotObservation(report,soilManifest,original,{id,unit,value,from:id==='soil-change'||id==='soil-restored'?'2023-01-01':undefined,description:`Campo originale «${field}», senza arrotondamento nei dati. ISPRA/SNPA, rapporto 2025, dati 2024. Superfici artificiali: non è copertura arborea. Incremento netto = incremento lordo meno ripristino; un valore negativo è possibile. I limiti del dataset non sono aggiornati automaticamente a quelli correnti.`,fields:[field]});
 });
 return {sourceId:'ispra-soil',sourceName:'ISPRA / SNPA · Consumo di suolo',status:'ready',message:'Edizione 2025, dati fino al 2024. File ufficiale importato ed esposto dalla nostra API. Non deduciamo verde o biodiversità dalla superficie non consumata.',observations,original};
}
export function createIncomeProvider(readAsset?:(path:string)=>Promise<Response>){return {id:'redditi',async get(report:MunicipalityReport){return deriveIncome(await loadSnapshot('income',incomeManifest,report.municipality.id,readAsset),report);}};}
export function createSoilProvider(readAsset?:(path:string)=>Promise<Response>){return {id:'ispra-soil',async get(report:MunicipalityReport){return deriveSoil(await loadSnapshot('soil',soilManifest,report.municipality.id,readAsset),report);}};}
