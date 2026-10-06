import type {Observation,IndicatorDefinition} from '../domain/model';
import {displayValue,periodLabel} from '../domain/comparison';
export function ValueVisual({definition:d,observation:o}:{definition:IndicatorDefinition;observation:Observation}){
 if(o.value===null)return null;
 return <div className="value-visual"><div className="value-label"><span>{d.name}</span><strong>{displayValue(o.value,o.unit)} <small>{o.unit}</small></strong></div>{o.unit==='%'&&o.value>=0&&o.value<=100&&<div className="percent-track" aria-hidden="true"><span style={{width:`${o.value}%`}}/></div>}<small className="value-context">{periodLabel(o)} · {o.kind==='forecast'?'Previsione':o.kind==='observed'?'Censito':'Elaborato'} · {o.spatial.level==='grid'?'griglia':o.spatial.level==='bounding-box'?'riquadro geografico':'comune'} · {o.sourceId}</small></div>;
}
export function AgcomCredit(){return <div className="agcom-credit"><a href="https://maps.agcom.it/"><img src="/attributions/agcom-bbmap.jpg" alt="Broadband Map AGCOM · CC BY 4.0" width="281" height="140"/></a><p>Dati: <a href="https://maps.agcom.it/">Broadband Map AGCOM</a> · <a href="https://www.agcom.it/termini-e-condizioni">CC BY 4.0 e condizioni d’uso</a>. Estrazione: Che luogo è?</p></div>;}
