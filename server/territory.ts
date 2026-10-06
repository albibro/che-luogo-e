import type {IndicatorBundle, MunicipalityReport, Observation, OriginalResponse} from '../src/domain/model';
import {createJsonReader} from './upstream';
export function validateTerritory(p:any,code:string){
 if(!p||typeof p!=='object'||String(p.pro_com).padStart(6,'0')!==code||typeof p.nome!=='string'||!p.nome||!Number.isFinite(p.ar_kmq)||p.ar_kmq<=0)throw new Error('ISPRA: comune o schema non corrispondente');
}
const fields=[
 {id:'flood',key:'aridp2_p',unit:'%',year:2020,kind:'derived',description:'Percentuale pubblicata da ISPRA: superficie nello scenario idraulico P2, pericolosità media. Mosaicatura 2020 riportata sui limiti amministrativi 2024.'},
 {id:'landslide',key:'ar_frp3p4p',unit:'%',year:2024,kind:'derived',description:'Percentuale pubblicata da ISPRA: aree a pericolosità da frana elevata P3 e molto elevata P4. Mosaicatura e limiti amministrativi 2024.'},
 {id:'population',key:'pop_res021',unit:'residenti',year:2021,kind:'observed',description:'Popolazione del censimento ISTAT 2021, ripubblicata da ISPRA IdroGEO. Non è la popolazione attuale.'},
 {id:'young',key:'pop_gio_p',unit:'%',year:2021,kind:'derived',description:'Percentuale di residenti con meno di 15 anni, pubblicata da ISPRA su censimento ISTAT 2021.'},
 {id:'elderly',key:'pop_anz_p',unit:'%',year:2021,kind:'derived',description:'Percentuale di residenti con più di 64 anni, pubblicata da ISPRA su censimento ISTAT 2021.'},
 {id:'surface',key:'ar_kmq',unit:'km²',year:2024,kind:'observed',description:'Superficie del territorio ISTAT 2024 pubblicata da ISPRA, senza ricalcolo dal confine semplificato.'},
 {id:'families',key:'fam_tot',unit:'famiglie',year:2021,kind:'observed',description:'Famiglie censimento ISTAT 2021, come pubblicate da ISPRA.'},
 {id:'adults',key:'pop_adu_p',unit:'%',year:2021,kind:'derived',description:'Quota di residenti tra 15 e 64 anni nel censimento ISTAT 2021. Non è un tasso di occupazione.'},
 {id:'business-units',key:'im_tot',unit:'unità locali',year:2022,kind:'observed',description:'Unità locali delle imprese dal registro ASIA ISTAT 2022. Non sedi legali, addetti o imprese attuali.'},
 {id:'cultural-heritage',key:'n_vir',unit:'beni',year:2024,kind:'observed',description:'Beni culturali registrati in Vincoli in Rete ICR 2024, ripubblicati da ISPRA. Non equivale a musei visitabili.'},
 {id:'flood-high',key:'aridp3_p',unit:'%',year:2020,kind:'derived',description:'Superficie in scenario di pericolosità idraulica elevata P3, mosaicatura 2020. Gli scenari non si sommano.'},
 {id:'flood-low',key:'aridp1_p',unit:'%',year:2020,kind:'derived',description:'Superficie in scenario di pericolosità idraulica bassa P1, mosaicatura 2020. Gli scenari non si sommano.'},
] as const;
export function deriveTerritory(original:OriginalResponse,code:string):IndicatorBundle{
 const p=original.payload as Record<string,unknown>;validateTerritory(p,code);
 const observations:Observation[]=fields.map(s=>{
  const n=p[s.key];const valid=typeof n==='number'&&Number.isFinite(n)&&n>=0&&(s.unit==='%'?n<=100:s.unit==='km²'?n>0:Number.isInteger(n));
  return {id:`${code}-${s.id}-ispra`,municipalityId:code,indicatorId:s.id,sourceId:'ispra',kind:s.kind,value:valid?n:null,unit:s.unit,missingReason:valid?null:'Campo assente, non valido o -1 (dato non disponibile nella fonte ISPRA).',period:{from:`${s.year}-01-01`,to:`${s.year}-12-31`},retrievedAt:original.retrievedAt,sourceUpdatedAt:null,
   spatial:{level:'municipality',resolution:'Aggregato comunale ISPRA su limiti ISTAT 2024; non confine corrente né singolo immobile',coveragePercent:null},reliability:{level:'medium',reason:'Fonte istituzionale. Epoche diverse e limiti storici; completezza e aggiornamento non garantiti da ISPRA. Nessuna valutazione di sicurezza.'},
   methodVersion:'ispra-pir-metadata-2025-07-v1',methodDescription:s.description+' Estrazione del campo originale, senza ricalcolo o punteggio.',lineage:[`${original.url}#${s.key}`,'https://idrogeo.isprambiente.it/cms/wp-content/uploads/2025/07/Metadati_PIR.csv'],raw:{payload:{field:s.key,value:n??null,record:p},originalUrl:original.url,checksum:original.checksum}};
 });
 return {sourceId:'ispra',sourceName:'ISPRA IdroGEO · dati demografici ISTAT',status:'ready',message:'Alluvioni: 2020. Frane: 2024. Demografia: censimento 2021. Aggregati su limiti comunali 2024. Non sono allerte in tempo reale né valutazioni del singolo immobile.',observations,original};
}
export function createTerritoryProvider(fetcher:typeof fetch=fetch,cache?:Cache){const read=createJsonReader(fetcher,cache);return {id:'ispra',async get(report:MunicipalityReport){
 const code=report.municipality.id;const original=await read(`https://idrogeo.isprambiente.it/api/pir/comuni/${code}`,p=>validateTerritory(p,code),86400);
 return deriveTerritory(original,code);
}};}
