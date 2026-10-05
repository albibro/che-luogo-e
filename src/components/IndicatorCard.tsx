import { ChevronDown, Database, Info } from 'lucide-react';
import type { IndicatorDefinition } from '../domain/model';
import { CategoryIcon } from './Icons';
import { categories } from '../data/catalog';
export function IndicatorCard({definition}:{definition:IndicatorDefinition}) {
 const category=categories.find(c=>c.id===definition.category)!;
 return <article className={`indicator-card ${category.color}`}>
  <div className="indicator-top"><span className={`category-icon ${category.color}`}><CategoryIcon id={definition.category} size={20}/></span><span className="category-eyebrow">{category.short}</span></div>
  <h3>{definition.name}</h3><p className="indicator-value missing">Non disponibile</p><p className="indicator-description">{definition.description}</p>
  <div className="indicator-period">Fonte non ancora integrata</div><div className="assessment"><Info size={15}/><span>Nessuna valutazione calcolata</span></div>
  <details className="data-details"><summary><Database size={16}/> Metodo previsto <ChevronDown size={16}/></summary><div className="data-details-body"><p>Non abbiamo ancora acquisito un dato verificato per questo indicatore. L’assenza del dato non indica un valore nullo, un luogo sicuro o una buona qualità.</p><h4>Metodo da validare sulla fonte</h4><p>{definition.plannedMethod}</p><h4>Limiti e confrontabilità</h4><p>{definition.comparability}</p></div></details>
 </article>;
}
