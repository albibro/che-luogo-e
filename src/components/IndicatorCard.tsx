import { ChevronDown, Database, Info } from 'lucide-react';
import type { IndicatorDefinition,Observation } from '../domain/model';
import { CategoryIcon } from './Icons';
import { categories } from '../data/catalog';
import { formatDate } from '../domain/format';
export function IndicatorCard({definition,observation,loading=false,error}:{definition:IndicatorDefinition;observation?:Observation;loading?:boolean;error?:string}) {
 const category=categories.find(c=>c.id===definition.category)!;const integrated=definition.category==='clima';
 const hasValue=observation?.value!==null&&observation?.value!==undefined;
 return <article className={`indicator-card ${category.color}`}>
  <div className="indicator-top"><span className={`category-icon ${category.color}`}><CategoryIcon id={definition.category} size={20}/></span><span className="category-eyebrow">{category.short}</span><span className="badge">{observation?'Elaborazione · rianalisi':integrated?'NASA POWER':'Da integrare'}</span></div>
  <h3>{definition.name}</h3><p className={`indicator-value ${hasValue?'':'missing'}`} aria-live="polite">{hasValue?<>{new Intl.NumberFormat('it-IT',{maximumFractionDigits:definition.unit==='giorni'?0:1}).format(observation!.value!)} <small>{observation!.unit}</small></>:loading?'Caricamento…':integrated?'Dato non disponibile':'Fonte da integrare'}</p><p className="indicator-description">{definition.description}</p>
  <div className="indicator-period">{observation?.period?`${formatDate(observation.period.from)} – ${formatDate(observation.period.to)} · NASA POWER`:integrated?'Archivio storico 2025':'Collegamento alla fonte non ancora implementato'}</div>
  <div className="assessment"><Info size={15}/><span>{integrated?'Rianalisi su griglia · non una misura comunale':'Nessuna valutazione calcolata'}</span></div>
  <details className="data-details"><summary><Database size={16}/> {observation?'Dato, fonte e metodo':'Stato e metodo previsto'} <ChevronDown size={16}/></summary><div className="data-details-body">
   {observation?<><p>{observation.missingReason??'Elaborazione di dati reali di rianalisi NASA/MERRA-2. Nessun punteggio e nessuna previsione.'}</p><h4>Metodo</h4><p>{observation.methodDescription} Versione: {observation.methodVersion}.</p><h4>Risoluzione e affidabilità</h4><p>{observation.spatial.resolution}. Affidabilità media: {observation.reliability.reason}</p><p>Acquisizione: {formatDate(observation.retrievedAt)}. Aggiornamento della fonte: non fornito. Un solo anno non descrive il clima di lungo periodo.</p><a href={observation.raw.originalUrl!} target="_blank" rel="noreferrer">Apri la richiesta originale NASA ↗</a><details><summary>Serie giornaliera originale</summary><pre>{JSON.stringify(observation.raw.payload,null,2)}</pre></details><p className="checksum">SHA-256 della risposta integrale: {observation.raw.checksum}</p></>:<><p>{error??(loading?'Richiesta alla fonte in corso.':integrated?'Il dato non è stato restituito o validato. Nessuna sostituzione con zero.':'Questa fonte non è ancora collegata: non è un guasto al tuo sito. L’assenza non indica un valore nullo o un luogo sicuro.')}</p><h4>Metodo previsto</h4><p>{definition.plannedMethod}</p></>}
   <h4>Confrontabilità</h4><p>{definition.comparability}</p>
  </div></details>
 </article>;
}
