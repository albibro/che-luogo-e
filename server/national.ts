import raw from './data/istat-comuni.raw.json';
import manifest from './data/istat-manifest.json';
import boundaryIndex from './data/boundaries-index.json';
import boundaryManifest from './data/boundaries-manifest.json';
import type { DataProvider, Municipality, BoundarySummary } from '../src/domain/model';
import { sourceRegistry, istatSource } from './sources';
import { assertSourceApproved } from '../src/providers';
export const normalize=(value:string)=>value.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
assertSourceApproved(istatSource);
const records=raw.resultset;
const boundaries=boundaryIndex as unknown as Record<string,Pick<BoundarySummary,'centroid'|'mapCenter'|'bbox'|'originalName'|'sha256'|'originalAttributes'>>;
export function getBoundarySummary(code:string):BoundarySummary|null {
 const item=boundaries[code];if(!item)return null;
 const {sourceId,referenceDate,retrievedAt,sourceUpdatedAt,originalUrl,originalSha256,license,licenseUrl,methodVersion,sourceCrs,outputCrs,simplification,warning,reliability}=boundaryManifest;
 return {...item,sourceId,referenceDate,retrievedAt,sourceUpdatedAt,originalUrl,originalSha256,license,licenseUrl,methodVersion,sourceCrs,outputCrs,simplification,warning,reliability};
}
export const municipalities:Municipality[]=records.map(row=>({
 id:row.PRO_COM_T,istatCode:row.PRO_COM_T,slug:`${normalize(row.COMUNE).replace(/ /g,'-')}-${row.PRO_COM_T}`,
 name:row.COMUNE,region:row.DEN_REG,province:row.DEN_UTS,centroid:boundaries[row.PRO_COM_T]?.centroid??null,
}));
const indexed=municipalities.map((place,i)=>({place,row:records[i],key:normalize(`${place.name} ${records[i].COMUNE_IT} ${place.province} ${records[i].SIGLA_AUTOMOBILISTICA} ${place.region} ${place.istatCode}`),name:normalize(place.name)}));
export const nationalProvider:DataProvider={
 id:'istat',mode:'live',
 async searchMunicipalities(query,signal){
  signal?.throwIfAborted();const q=normalize(query);if(q.length<2)return [];
  const tokens=q.split(' ');
  return structuredClone(indexed.filter(x=>tokens.every(token=>x.key.includes(token))).sort((a,b)=>Number(b.name===q)-Number(a.name===q)||Number(b.name.startsWith(q))-Number(a.name.startsWith(q))||a.place.name.localeCompare(b.place.name,'it')).slice(0,20).map(x=>x.place));
 },
 async getMunicipality(slug,signal){
  signal?.throwIfAborted();
  const exact=indexed.find(x=>x.place.slug===slug||x.place.istatCode===slug);
  const names=exact?[exact]:indexed.filter(x=>x.name.replace(/ /g,'-')===slug);
  if(names.length!==1)return null;
  const match=names[0];return structuredClone({municipality:match.place,observations:[],assessments:[],mode:'live',provenance:manifest,original:match.row,boundary:getBoundarySummary(match.place.id),boundaryMissingReason:boundaries[match.place.id]?null:boundaryManifest.invalidCodes.includes(match.place.id)?'La geometria ufficiale non supera i controlli topologici. Non è stata corretta automaticamente.':'Il codice del comune non è presente nei confini ISTAT al 1 gennaio 2026. Nessuna geometria successiva è stata ricostruita.'});
 },
 async getBoundary(){throw new Error('Le geometrie sono fornite dallo storage tramite API');},
 async getSources(){return structuredClone(sourceRegistry);},
 async getStatus(){return structuredClone(manifest);},
};
