import type {IndicatorBundle,MunicipalityReport,OriginalResponse} from '../src/domain/model';
import manifest from './data/schools-manifest.json';
import {loadSnapshot,snapshotObservation} from './snapshots';
type School={sector:'statale'|'paritaria';record:Record<string,string>};
export function deriveSchools(original:OriginalResponse,report:MunicipalityReport):IndicatorBundle{
 const rows=original.payload as School[];const code=report.municipality.id;const belfiore=report.original.COD_CATASTO;
 const units=new Map<string,School>();
 for(const item of rows){
  const r=item.record;
  if(!['statale','paritaria'].includes(item.sector)||r.CODICECOMUNESCUOLA!==belfiore||r.ANNOSCOLASTICO!=='202627'||!r.CODICESCUOLA||!r.DESCRIZIONETIPOLOGIAGRADOISTRUZIONESCUOLA)throw new Error('MIM: record incompatibile');
  const key=item.sector+':'+r.CODICESCUOLA;const previous=units.get(key);
  if(previous&&JSON.stringify(previous)!==JSON.stringify(item))throw new Error('MIM: codice scuola con record in conflitto');
  units.set(key,item);
 }
 const values=[...units.values()];
 const excluded=manifest.excludedProvinces.includes(code.slice(0,3));
 const specs=[
  {id:'schools-state',sector:'statale',type:null},
  {id:'schools-private',sector:'paritaria',type:null},
  {id:'schools-primary',sector:'statale',type:'SCUOLA PRIMARIA'},
  {id:'schools-nursery',sector:'statale',type:'SCUOLA INFANZIA'},
  {id:'schools-middle',sector:'statale',type:'SCUOLA PRIMO GRADO'},
 ];
 const observations=specs.map(s=>{
  const sector=values.filter(r=>r.sector===s.sector);const selected=sector.filter(r=>!s.type||r.record.DESCRIZIONETIPOLOGIAGRADOISTRUZIONESCUOLA===s.type);
  // No source records in that sector is unknown, not an assertion that no school exists.
  const value=excluded||!sector.length?null:selected.length;
  return snapshotObservation(report,manifest,original,{id:s.id,value,unit:'unità scolastiche',from:'2026-09-01',to:'2027-08-31',missing:excluded?'Copertura nazionale di questa importazione: escluse Aosta, Trento e Bolzano. Registri delle autonomie da integrare.':'Nessun record associato per questo settore scolastico: non interpretato come zero.',description:`Anno scolastico 2026/27, fotografia MIM del 1 settembre 2026. Codici scuola univoci nel settore ${s.sector}${s.type?`, tipologia esatta «${s.type}»`:''}. Collegamento tramite codice catastale/Belfiore ISTAT. Le unità anagrafiche possono includere sedi direttive e istituti comprensivi: non sono edifici fisici distinti, classi o posti disponibili.`,payload:{sector:s.sector,type:s.type,schoolCodes:selected.map(r=>r.record.CODICESCUOLA),originalDownloads:manifest.originals}});
 });
 return {sourceId:'scuole',sourceName:'Ministero dell’Istruzione e del Merito',status:'ready',message:'Anagrafe 2026/27 al 1 settembre 2026, importata ed esposta dalla nostra API. Unità scolastiche, non edifici o qualità della scuola. Dati delle autonomie esclusi da questa importazione.',observations,original,entries:values.map(({sector,record:r})=>({id:sector+':'+r.CODICESCUOLA,title:r.DENOMINAZIONESCUOLA,description:`${r.DESCRIZIONETIPOLOGIAGRADOISTRUZIONESCUOLA} · ${sector} · ${r.INDIRIZZOSCUOLA} · ${r.CODICESCUOLA}`}))};
}
export function createSchoolsProvider(readAsset?:(path:string)=>Promise<Response>){return {id:'scuole',async get(report:MunicipalityReport){return deriveSchools(await loadSnapshot('schools',manifest,report.municipality.id,readAsset),report);}};}
