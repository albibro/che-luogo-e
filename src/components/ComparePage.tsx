import {useEffect,useState} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import {ArrowLeftRight,Link as LinkIcon} from 'lucide-react';
import {Search} from './Search';
import {IndicatorCard} from './IndicatorCard';
import {AgcomCredit} from './DataVisual';
import {categories,indicators} from '../data/catalog';
import type {DataProvider,Observation,MunicipalityReport} from '../domain/model';
import {groups} from '../domain/presentation';
import {compareObservations,displayValue,periodLabel} from '../domain/comparison';
type ReportState={slug:string;report:MunicipalityReport|null;observations:Observation[];sources:Record<string,string>;errors:string[];pending:number;error:string};
const initial=(slug:string):ReportState=>({slug,report:null,observations:[],sources:{},errors:[],pending:slug?9:0,error:''});
function useComparisonReport(provider:DataProvider,slug:string,retry:number){
 const [state,setState]=useState(()=>initial(slug));
 useEffect(()=>{
  const controller=new AbortController();const signal=controller.signal;setState(initial(slug));if(!slug)return ()=>controller.abort();
  provider.getMunicipality(slug,signal).then(async report=>{
   if(signal.aborted)return;
   if(!report){setState({...initial(slug),pending:0,error:'Comune non trovato. Seleziona un risultato della ricerca.'});return;}
   setState(s=>({...s,report}));
   const requests=[{label:'Clima',run:()=>provider.getClimate?.(slug,signal)??Promise.reject(new Error('Provider clima assente'))},...groups.map(group=>({label:group,run:()=>provider.getIndicators?.(slug,group,signal)??Promise.reject(new Error('Provider assente'))}))];
   await Promise.allSettled(requests.map(async request=>{
    try{const data=await request.run();if(signal.aborted)return;setState(s=>({...s,pending:s.pending-1,observations:[...s.observations,...data.observations],sources:{...s.sources,[data.sourceId]:'sourceName' in data?data.sourceName:'NASA POWER / MERRA-2'},errors:'status' in data&&data.status==='configuration-required'?[...s.errors,data.message]:s.errors}));}
    catch(error){if(!signal.aborted)setState(s=>({...s,pending:s.pending-1,errors:[...s.errors,`${request.label}: ${error instanceof Error?error.message:'Errore di caricamento'}`]}));}
   }));
  }).catch(()=>{if(!signal.aborted)setState({...initial(slug),pending:0,error:'Scheda non raggiungibile. Riprova.'});});
  return ()=>controller.abort();
 },[provider,slug,retry]);
 return state.slug===slug?state:initial(slug);
}
export function ComparisonRow({definition:d,a,b,nameA,nameB,sourceA,sourceB}:{definition:typeof indicators[number];a?:Observation;b?:Observation;nameA:string;nameB:string;sourceA?:string;sourceB?:string}){
 const result=compareObservations(a,b);const max=Math.max(a?.value??0,b?.value??0);const bars=result.comparable&&a!.value!>=0&&b!.value!>=0&&d.unit!=='°C';
 const delta=result.difference;const deltaText=delta===null?'Non confrontabile':delta===0?'Valori uguali':`${delta>0?'+':'−'}${Math.abs(delta)<.001?'< 0,001':new Intl.NumberFormat('it-IT',{maximumFractionDigits:3}).format(Math.abs(delta))} ${result.unit}`;
 return <article className="comparison-row"><div className="comparison-row-heading"><h3>{d.name}</h3><span className={`comparison-status ${result.comparable?'compatible':''}`}>{result.comparable?'Confrontabile':'Confronto sospeso'}</span></div><p className="compare-description">{d.description}</p><div className="comparison-pair">{[{o:a,name:nameA,side:'a'},{o:b,name:nameB,side:'b'}].map(({o,name,side})=><div className={`compare-value side-${side}`} key={side}><span>{name}</span><strong>{o?.value!=null?displayValue(o.value,o.unit):'—'} <small>{o?.value!=null?o.unit:'Dato non disponibile'}</small></strong>{bars&&<div className="comparison-track" aria-hidden="true"><i style={{width:`${max>0?o!.value!/max*100:0}%`}}/></div>}<small>{o?`${periodLabel(o)} · ${o.sourceId}`:d.unavailableReason??'Dato non caricato'}</small></div>)}</div><div className="comparison-delta"><strong title={delta!==null?String(delta):undefined}>{deltaText}</strong><span>{delta!==null?'Differenza B − A, arrotondata. ':''}{result.reason}</span></div><details className="panel-details"><summary>Come leggere il confronto · dati e fonti</summary><p>{d.comparability} Le quantità assolute risentono della dimensione dei comuni. Nessun colore indica un vincitore.</p>{bars&&<p>Barre con origine zero e scala comune alla coppia, indipendente dalle altre righe.</p>}<div className="indicator-grid"><div><h4>{nameA}</h4><IndicatorCard definition={d} observation={a} sourceName={sourceA}/></div><div><h4>{nameB}</h4><IndicatorCard definition={d} observation={b} sourceName={sourceB}/></div></div></details></article>;
}
export function ComparePage({provider}:{provider:DataProvider}){
 const [params,setParams]=useSearchParams();const aSlug=params.get('a')??'',bSlug=params.get('b')??'';const [retry,setRetry]=useState(0),[copied,setCopied]=useState('');
 const a=useComparisonReport(provider,aSlug,retry),b=useComparisonReport(provider,bSlug,retry);
 const filter=categories.some(c=>c.id===params.get('categoria'))?params.get('categoria')!:'tutte';const only=params.get('solo')!=='tutti';
 const select=(key:string,value:string)=>{const p=new URLSearchParams(params);if(value)p.set(key,value);else p.delete(key);setCopied('');setParams(p);};
 const same=!!a.report&&a.report.municipality.id===b.report?.municipality.id;
 const rows=indicators.map(d=>({d,a:a.observations.find(o=>o.indicatorId===d.id),b:b.observations.find(o=>o.indicatorId===d.id)}));const count=rows.filter(r=>compareObservations(r.a,r.b).comparable).length;
 const ready=!!a.report&&!!b.report&&!same;const loading=!!(a.pending||b.pending);
 return <div className="page-container compare-page"><div className="breadcrumb"><Link to="/">Esplora</Link><span>/</span><span>Confronta</span></div><span className="eyebrow">DUE LUOGHI, LE STESSE DOMANDE</span><h1>Mettili a confronto.</h1><p className="compare-lead">Differenze leggibili, fonti verificabili. Nessun vincitore assoluto.</p><div className="compare-selectors">{[{state:a,key:'a',slug:aSlug,label:'Comune A'},{state:b,key:'b',slug:bSlug,label:'Comune B'}].map(({state,key,slug,label})=><section className={`compare-picker side-${key}`} key={key}><span className="eyebrow">{label}</span>{state.report?<><h2><Link to={`/comuni/${state.report.municipality.slug}`}>{state.report.municipality.name}</Link></h2><p>{state.report.municipality.province} · {state.report.municipality.region}</p></>:<h2>{slug&&!state.error?'Caricamento…':'Scegli un comune'}</h2>}<Search provider={provider} compact label={`Cerca ${label.toLowerCase()}`} onSelect={place=>select(key,place.slug)}/>{state.error&&<p role="alert">{state.error}</p>}</section>)}</div>
 <div className="compare-toolbar"><button className="secondary" disabled={!aSlug||!bSlug} onClick={()=>{const p=new URLSearchParams(params);p.set('a',bSlug);p.set('b',aSlug);setParams(p);setCopied('');}}><ArrowLeftRight size={17}/> Scambia A e B</button><button className="secondary" disabled={!aSlug||!bSlug} onClick={async()=>{try{await navigator.clipboard.writeText(window.location.href);setCopied('Link copiato');}catch{setCopied('Copia il collegamento dalla barra degli indirizzi.');}}}><LinkIcon size={17}/> Copia link al confronto</button><span role="status">{copied}</span></div>
 {same&&<p className="callout" role="alert">Hai selezionato lo stesso comune. Scegline un altro per confrontare due luoghi.</p>}
 {!ready&&!same&&<div className="compare-empty"><ArrowLeftRight size={32}/><h2>Scegli i tuoi due luoghi.</h2><p>Puoi cercare tutti i comuni dell’anagrafica nazionale. Gli indicatori verranno affiancati con periodi, fonti e differenze.</p></div>}
 {ready&&<><div className="comparison-summary" role="status"><strong>{count} indicatori confrontabili{loading?' · caricamento in corso':''}</strong><p>Compatibilità verificata su fonte, periodo, metodo, natura del dato, unità e risoluzione. La compatibilità non certifica la qualità del luogo.</p></div><div className="category-filters"><button aria-pressed={filter==='tutte'} onClick={()=>select('categoria','')}>Tutte</button>{categories.map(c=><button key={c.id} aria-pressed={filter===c.id} onClick={()=>select('categoria',c.id)}>{c.short}</button>)}</div><label className="compare-toggle"><input type="checkbox" checked={only} onChange={e=>select('solo',e.target.checked?'comparabili':'tutti')}/> Mostra solo indicatori confrontabili</label>
 {categories.filter(c=>filter==='tutte'||filter===c.id).map(c=>{const visible=rows.filter(r=>r.d.category===c.id&&(!only||compareObservations(r.a,r.b).comparable));return visible.length?<details className="comparison-category" key={c.id} open={filter!=='tutte'}><summary>{c.name} · {visible.length} indicatori</summary>{visible.map(r=><ComparisonRow key={r.d.id} definition={r.d} a={r.a} b={r.b} nameA={`A · ${a.report!.municipality.name}`} nameB={`B · ${b.report!.municipality.name}`} sourceA={r.a?a.sources[r.a.sourceId]:undefined} sourceB={r.b?b.sources[r.b.sourceId]:undefined}/>)}{c.id==='connettivita'&&<AgcomCredit/>}</details>:null;})}
 {!rows.some(r=>(filter==='tutte'||r.d.category===filter)&&(!only||compareObservations(r.a,r.b).comparable))&&<p className="panel-empty">Nessun indicatore confrontabile con questi filtri{loading?' per ora: caricamento in corso.':'.'}</p>}
 </>}
 {(aSlug||bSlug)&&<details className="dashboard-sources"><summary>Stato dei caricamenti e problemi delle fonti</summary>{[a,b].map((s,i)=><div key={i}><h3>{i===0?'Comune A':'Comune B'} · {s.report?.municipality.name??'Da selezionare'}</h3><p>{s.error||`${s.pending} richieste in corso`}</p>{s.errors.map((error,i)=><p key={i}>{error}</p>)}</div>)}<button className="secondary" onClick={()=>setRetry(n=>n+1)}>Riprova le fonti</button></details>}
 <p className="comparison-note">Valori mancanti e periodi incompatibili non producono differenze. Le segnalazioni GBIF restano consultabili, ma non sono confrontate come indice di biodiversità.</p>
 </div>;
}
