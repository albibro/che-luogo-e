import type {IndicatorBundle, MunicipalityReport, Observation} from '../src/domain/model';
import manifest from './data/pharmacies-manifest.json';
import {checksum} from './upstream';
export type PharmacyRecord=Record<string,string>;
function date(value:string):string|null{
 const m=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);if(!m)return null;
 const iso=`${m[3]}-${m[2]}-${m[1]}`;const parsed=new Date(iso);return Number.isNaN(+parsed)||parsed.toISOString().slice(0,10)!==iso?null:iso;
}
export function countPharmacies(rows:PharmacyRecord[],code:string,asOf:string){
 const active:PharmacyRecord[]=[];let invalid=false;
 for(const r of rows){
  if(r.cod_comune!==code)throw new Error('Record farmacia assegnato al comune errato');
  const start=date(r.data_inizio_validita),end=r.data_fine_validita==='-'?null:date(r.data_fine_validita);
  if(!start||(r.data_fine_validita!=='-'&&!end)||!r.cod_farmacia||!['1','2','3','4'].includes(r.codice_tipologia)||(end&&end<start)){invalid=true;continue;}
  if(start<=asOf&&(!end||end>=asOf))active.push(r);
 }
 const byId=new Map<string,PharmacyRecord>();
 for(const row of active){const prev=byId.get(row.cod_farmacia);if(prev&&JSON.stringify(prev)!==JSON.stringify(row))invalid=true;byId.set(row.cod_farmacia,row);}
 const records=[...byId.values()];
 return {pharmacies:!rows.length||invalid?null:records.filter(r=>['1','2'].includes(r.codice_tipologia)).length,dispensaries:!rows.length||invalid?null:records.filter(r=>['3','4'].includes(r.codice_tipologia)).length,active:records,invalid};
}
export function createServicesProvider(readAsset?:(path:string)=>Promise<Response>){return {id:'salute',async get(report:MunicipalityReport):Promise<IndicatorBundle>{
 if(!readAsset)throw new Error('Archivio farmacie non disponibile');
 const code=report.municipality.id;const filename=code.slice(0,3)+'.json';
 const r=await readAsset(`/data/farmacie/${filename}`);if(!r.ok)throw new Error('Archivio territoriale farmacie assente. Codici storici non ricondotti automaticamente a nuovi comuni.');
 const text=await r.text();if(await checksum(text)!==(manifest.partitions as Record<string,string>)[filename])throw new Error('Integrità archivio farmacie non verificata');
 const grouped=JSON.parse(text) as Record<string,PharmacyRecord[]>;const rows=grouped[code]??[];
 const result=countPharmacies(rows,code,manifest.referenceDate);const rowText=JSON.stringify(rows);const rowChecksum=await checksum(rowText);
 const observations:Observation[]=[['pharmacies','pharmacies'],['dispensaries','dispensaries']].map(([indicatorId,field])=>{
  const value=result[field as 'pharmacies'|'dispensaries'];return {
   id:`${code}-${indicatorId}-salute`,municipalityId:code,indicatorId,sourceId:'salute',kind:'derived',value,unit:'strutture',missingReason:value!==null?null:result.invalid?'Date, tipologie o record attivi in conflitto: conteggio sospeso.':'Nessun record associato al codice ISTAT corrente. Non viene interpretato come zero.',
   period:{from:manifest.referenceDate,to:manifest.referenceDate},retrievedAt:manifest.retrievedAt,sourceUpdatedAt:manifest.referenceDate,
   spatial:{level:'municipality',resolution:'Codice ISTAT del comune dichiarato dal Ministero; nessuna associazione per vicinanza geografica',coveragePercent:null},reliability:{level:'medium',reason:'Registro nazionale ufficiale; fotografia alla data di importazione. Validità anagrafica diversa da apertura odierna. Fusioni e ritardi di ricodifica possono lasciare comuni senza dato.'},methodVersion:'salute-active-register-v1',methodDescription:`Conteggio di codici ministeriali univoci validi al ${manifest.referenceDate}, inizio incluso e fine inclusa, “-” come fine aperta. ${indicatorId==='pharmacies'?'Tipologie 1 (ordinaria) e 2 (succursale).':'Tipologie 3 (dispensario) e 4 (dispensario stagionale).'} Record originali conservati; nessun uso delle coordinate.`,lineage:[manifest.originalUrl,`sha256:${manifest.sha256}`],raw:{payload:{records:rows,activeIds:result.active.map(r=>r.cod_farmacia),snapshot:manifest.referenceDate,originalDownloadSha256:manifest.sha256},originalUrl:manifest.originalUrl,checksum:rowChecksum}
  };
 });
 return {sourceId:'salute',sourceName:'Ministero della Salute · Farmacie',status:'ready',message:`Archivio ministeriale importato il ${manifest.referenceDate}; esposto dalla nostra API. Farmacie e dispensari separati. Non contiene orari o turni.`,observations,original:{payload:rows,text:rowText,url:manifest.originalUrl,checksum:rowChecksum,retrievedAt:manifest.retrievedAt}};
}};}
