import type {IndicatorBundle,MunicipalityReport,OriginalResponse} from '../src/domain/model';
import manifest from './data/broadband-manifest.json';
import {loadSnapshot,numeric,snapshotObservation} from './snapshots';
export function parseCoverage(value:unknown):number|null{
 if(typeof value!=='string'||!/^\d+(,\d+)?%$/.test(value.trim()))return null;
 const n=Number(value.trim().slice(0,-1).replace(',','.'));return n>=0&&n<=100?n:null;
}
export function deriveBroadband(original:OriginalResponse,report:MunicipalityReport):IndicatorBundle{
 const rows=original.payload as Record<string,unknown>[];if(rows.length>1)throw new Error('AGCOM: codice duplicato');const row=rows[0];
 if(row&&String(row.pro_com).padStart(6,'0')!==report.municipality.id)throw new Error('AGCOM: comune errato');
 const households=numeric(row?.['Famiglie raggiunte FTTH (calcolato)']);
 const specs=[
  {id:'ftth',field:'Copertura FTTH DESI',value:parseCoverage(row?.['Copertura FTTH DESI']),unit:'%'},
  {id:'ftth-20m',field:'Copertura FTTH 20m',value:parseCoverage(row?.['Copertura FTTH 20m']),unit:'%'},
  {id:'ftth-households',field:'Famiglie raggiunte FTTH (calcolato)',value:households!==null&&households>=0&&Number.isInteger(households)?households:null,unit:'famiglie'},
 ];
 const observations=specs.map(s=>{
  const o=snapshotObservation(report,manifest,original,{id:s.id,unit:s.unit,value:s.value,from:manifest.referenceDate,to:manifest.referenceDate,fields:[s.field],description:`Campo originale «${s.field}», senza ricalcolo. Reportistica AGCOM «${manifest.metadataTitle}», riferimento 30 giugno 2026 dal titolo ufficiale. Percentuali e famiglie sono elaborazioni AGCOM basate sulle dichiarazioni degli operatori: non speed test, contratti attivi o garanzie di attivabilità al civico. Le due percentuali FTTH hanno metodi distinti (DESI e celle di 20 metri) e non si sommano.`});
  o.sourceUpdatedAt=manifest.sourceUpdatedAt;o.spatial.resolution='Aggregato comunale AGCOM del 30 giugno 2026; stima di copertura, non verifica del singolo indirizzo';
  o.reliability.reason='Elaborazione istituzionale su dati degli operatori e distribuzione stimata delle famiglie. Non misura velocità effettiva; copertura territoriale e contributi degli operatori possono essere incompleti. Campi di confidenza originali consultabili nel record.';
  return o;
 });
 return {sourceId:'agcom',sourceName:'AGCOM · Broadband Map',status:'ready',message:'Reportistica 30 giugno 2026, importata dalla distribuzione ufficiale API/CSV. Copertura stimata FTTH, non velocità reale o disponibilità contrattuale al civico. Le percentuali DESI e su celle di 20 metri sono distinte.',observations,original};
}
export function createBroadbandProvider(readAsset?:(path:string)=>Promise<Response>){return {id:'agcom',async get(report:MunicipalityReport){return deriveBroadband(await loadSnapshot('broadband',manifest,report.municipality.id,readAsset),report);}};}
