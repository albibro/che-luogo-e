import type {IndicatorBundle,MunicipalityReport,OriginalResponse} from '../src/domain/model';
import {createJsonReader} from './upstream';
export function gbifUrl(bbox:[number,number,number,number]){
 const [w,s,e,n]=bbox;const u=new URL('https://api.gbif.org/v1/occurrence/search');
 u.search=new URLSearchParams({country:'IT',decimalLatitude:`${s},${n}`,decimalLongitude:`${w},${e}`,year:'2015,2025',license:'CC0_1_0',occurrenceStatus:'PRESENT',hasCoordinate:'true',hasGeospatialIssue:'false',limit:'0'}).toString();return u.toString();
}
export function validateGbif(p:any){if(!Number.isSafeInteger(p?.count)||p.count<0||p.limit!==0||p.offset!==0||!Array.isArray(p.results)||p.results.length!==0)throw new Error('GBIF: conteggio non valido');}
export function deriveNature(original:OriginalResponse,report:MunicipalityReport):IndicatorBundle{
 validateGbif(original.payload);if(!report.boundary)throw new Error('Confine non disponibile');
 const p=original.payload as {count:number},code=report.municipality.id;
 return {sourceId:'gbif',sourceName:'GBIF · soli dati CC0',status:'ready',message:'Segnalazioni nel riquadro geografico che contiene il comune: include anche aree esterne. Solo record CC0 del 2015–2025. Il conteggio dipende dallo sforzo di raccolta, non misura la biodiversità.',original,observations:[{
  id:`${code}-gbif-records`,municipalityId:code,indicatorId:'gbif-records',sourceId:'gbif',kind:'derived',value:p.count,unit:'segnalazioni',missingReason:null,period:{from:'2015-01-01',to:'2025-12-31'},retrievedAt:original.retrievedAt,sourceUpdatedAt:null,
  spatial:{level:'bounding-box',resolution:`Riquadro WGS84: ${report.boundary.bbox.join(', ')} (ovest, sud, est, nord); non intersezione col confine comunale`,coveragePercent:null},reliability:{level:'low',reason:'Dati opportunistici e copertura disomogenea. Il filtro CC0 esclude altre licenze. Duplicati biologici possibili. Zero significa nessun record con questi filtri, non assenza di specie.'},methodVersion:'gbif-cc0-bbox-2015-2025-v1',methodDescription:'Conteggio restituito da GBIF per Italia, coordinate nel riquadro ISTAT, anno 2015–2025, presenza dichiarata, coordinate disponibili, nessun problema geografico segnalato e licenza CC0. Non conteggio di specie uniche.',lineage:[original.url,`istat-boundary-sha256:${report.boundary.sha256}`],raw:{payload:{response:p,bbox:report.boundary.bbox,query:original.url},originalUrl:original.url,checksum:original.checksum}
 }]};
}
export function createNatureProvider(fetcher:typeof fetch=fetch,cache?:Cache){const read=createJsonReader(fetcher,cache);return {id:'gbif',async get(report:MunicipalityReport){
 if(!report.boundary)throw new Error('Confine verificato assente: GBIF non interrogato.');
 return deriveNature(await read(gbifUrl(report.boundary.bbox),validateGbif,86400),report);
}};}
