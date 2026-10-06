import type {Observation} from './model';
export function compareObservations(a?:Observation,b?:Observation):{comparable:boolean;reason:string;difference:number|null;unit:string}{
 const no=(reason:string)=>({comparable:false,reason,difference:null,unit:''});
 if(!a||!b||a.value===null||b.value===null)return no('Dato mancante per almeno un comune. Nessuna differenza calcolata.');
 if(!Number.isFinite(a.value)||!Number.isFinite(b.value))return no('Valore non valido.');
 if(a.indicatorId!==b.indicatorId)return no('Indicatori diversi.');
 if(a.indicatorId==='gbif-records'||a.spatial.level==='bounding-box'||b.spatial.level==='bounding-box')return no('Riquadri e sforzo di raccolta diversi: le segnalazioni GBIF non misurano differenze di biodiversità.');
 if(!a.period||!b.period||a.period.from!==b.period.from||a.period.to!==b.period.to)return no('Periodi diversi o non documentati.');
 if(a.unit!==b.unit||a.kind!==b.kind)return no('Unità o natura del dato differenti.');
 if(a.sourceId!==b.sourceId||!a.methodVersion||a.methodVersion!==b.methodVersion)return no('Fonte o versione del metodo differenti o non documentate.');
 if(a.spatial.level!==b.spatial.level||a.spatial.resolution!==b.spatial.resolution)return no('Granularità o risoluzione geografica differenti.');
 const cell=(o:Observation)=>{const p=o.raw.payload as {cell?:unknown}|null;return p&&Array.isArray(p.cell)?p.cell:null;};
 const ac=cell(a),bc=cell(b);const sameCell=ac&&bc&&JSON.stringify(ac)===JSON.stringify(bc);
 return {comparable:true,difference:b.value-a.value,unit:a.unit==='%'?'punti percentuali':a.unit,reason:sameCell?'Stessa cella del modello: i valori non distinguono i due microclimi.':a.kind==='forecast'?'Stesso istante previsto e modello. Non sono misure osservate.':a.spatial.level==='grid'?'Stesso modello e periodo; confronto tra celle, non tra misure comunali.':'Stessa fonte, periodo, unità e metodo. La differenza non indica quale comune sia migliore.'};
}
export function displayValue(value:number,unit:string){return new Intl.NumberFormat('it-IT',{maximumFractionDigits:['residenti','contribuenti','strutture','unità scolastiche','famiglie','beni','unità locali','giorni','segnalazioni'].includes(unit)?0:unit==='€/anno'?0:3}).format(value);}
export function periodLabel(o?:Observation){if(!o?.period)return 'Periodo non disponibile';const a=o.period.from,b=o.period.to;if(a.endsWith('-01-01')&&b.endsWith('-12-31')&&a.slice(0,4)===b.slice(0,4))return a.slice(0,4);if(a===b)return new Intl.DateTimeFormat('it-IT',{dateStyle:'medium',timeZone:'UTC'}).format(new Date(a));return `${a.slice(0,10)} → ${b.slice(0,10)}`;}
