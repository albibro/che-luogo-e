import { ChevronDown, Database, Info } from 'lucide-react';
import type { IndicatorDefinition,Observation } from '../domain/model';
import { CategoryIcon } from './Icons';
import { categories } from '../data/catalog';
import { formatDate } from '../domain/format';
const reliability={high:'Alta',medium:'Media',low:'Bassa','not-assessed':'Non valutata'};
export function IndicatorCard({definition,observation,loading=false,error,sourceName}:{definition:IndicatorDefinition;observation?:Observation;loading?:boolean;error?:string;sourceName?:string}) {
 const category=categories.find(c=>c.id===definition.category)!;
 const integrated=definition.category==='clima'||!!definition.providerGroup;
 const hasValue=observation?.value!==null&&observation?.value!==undefined;
 const source=sourceName??(observation?.sourceId==='nasa-power'?'NASA POWER / MERRA-2':observation?.sourceId);
 const kind=observation?.kind==='forecast'?'Previsione':observation?.kind==='observed'?'Dato censito':observation?.sourceId==='nasa-power'?'Elaborazione · rianalisi':'Elaborazione';
 return <article className={`indicator-card ${category.color}`}>
  <div className="indicator-top"><span className={`category-icon ${category.color}`}><CategoryIcon id={definition.category} size={20}/></span><span className="category-eyebrow">{category.short}</span><span className="badge">{observation?kind:integrated?'API collegata':'Da integrare'}</span></div>
  <h3>{definition.name}</h3><p className={`indicator-value ${hasValue?'':'missing'}`} aria-live="polite">{hasValue?<>{new Intl.NumberFormat('it-IT',{maximumFractionDigits:['giorni','residenti','strutture','segnalazioni','contribuenti','famiglie','unità locali','beni','unità scolastiche'].includes(observation!.unit)?0:['%','ha','km²'].includes(observation!.unit)?3:observation!.unit==='€/anno'?0:1}).format(observation!.value!)} <small>{observation!.unit}</small></>:loading?'Caricamento…':integrated?'Dato non disponibile':'Fonte da integrare'}</p><p className="indicator-description">{definition.description}</p>
  <div className="indicator-period">{observation?.period?`${formatDate(observation.period.from)} – ${formatDate(observation.period.to)} · ${source}`:error??definition.unavailableReason??'Fonte e periodo disponibili dopo il caricamento'}</div>
  <div className="assessment"><Info size={15}/><span>{observation?.spatial.resolution??'Nessuna valutazione calcolata'}</span></div>
  <details className="data-details"><summary><Database size={16}/> {observation?'Dato, fonte e metodo':'Stato e metodo previsto'} <ChevronDown size={16}/></summary><div className="data-details-body">
   {observation?<><h4>Fonte</h4><p>{source} · {kind}. Nessun punteggio.</p>{observation.missingReason&&<p>{observation.missingReason}</p>}<h4>Metodo</h4><p>{observation.methodDescription} Versione: {observation.methodVersion??'Non applicabile'}.</p><h4>Risoluzione e affidabilità</h4><p>{observation.spatial.resolution}. Affidabilità {reliability[observation.reliability.level].toLowerCase()}: {observation.reliability.reason}</p><p>Acquisizione: {formatDate(observation.retrievedAt)}. Aggiornamento della fonte: {observation.sourceUpdatedAt?formatDate(observation.sourceUpdatedAt):'non fornito'}.</p>{observation.raw.originalUrl&&<a href={observation.raw.originalUrl} target="_blank" rel="noreferrer">Apri la fonte originale ↗</a>}<details><summary>Dati originali utilizzati</summary><pre>{JSON.stringify(observation.raw.payload,null,2)}</pre></details><p className="checksum">SHA-256: {observation.raw.checksum}</p></>:<><p>{error??definition.unavailableReason??(loading?'Richiesta alla fonte in corso.':integrated?'Il dato non è stato restituito o validato. Nessuna sostituzione con zero.':'Fonte non ancora integrata. L’assenza non indica un luogo sicuro o un valore nullo.')}</p><h4>Metodo previsto</h4><p>{definition.plannedMethod}</p></>}
   <h4>Confrontabilità</h4><p>{definition.comparability}</p>
  </div></details>
 </article>;
}
