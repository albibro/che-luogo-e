import { useEffect, useId, useRef, useState } from 'react';
import { Search as SearchIcon, MapPin, X, LoaderCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { DataProvider, Municipality } from '../domain/model';
export function Search({provider,compact=false,onSelect,label="Cerca un comune italiano"}:{provider:DataProvider;compact?:boolean;onSelect?:(place:Municipality)=>void;label?:string}) {
  const [query,setQuery]=useState(''); const [results,setResults]=useState<Municipality[]>([]);
  const [open,setOpen]=useState(false); const [active,setActive]=useState(-1); const [loading,setLoading]=useState(false); const [error,setError]=useState(false);
  const input=useRef<HTMLInputElement>(null); const id=useId(); const navigate=useNavigate();
  useEffect(()=>{const controller=new AbortController();setActive(-1);setError(false);setResults([]);
    if(query.trim().length<2){setResults([]);setLoading(false);return ()=>controller.abort();}
    setLoading(true);const timer=setTimeout(()=>{provider.searchMunicipalities(query,controller.signal).then(r=>{if(!controller.signal.aborted){setResults(r);setLoading(false);}}).catch(()=>{if(!controller.signal.aborted){setError(true);setResults([]);setLoading(false);}});},180);
    return ()=>{clearTimeout(timer);controller.abort();};
  },[query,provider]);
  const choose=(place:Municipality)=>{setOpen(false);setQuery('');if(onSelect)onSelect(place);else navigate(`/comuni/${place.slug}`);};
  const visible=open && query.trim().length>=2;
  return <div className={`search ${compact?'search-compact':''}`} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setOpen(false);}}>
    <form className="search-box" onSubmit={e=>{e.preventDefault();setOpen(true);if(!loading && results.length)choose(results[Math.max(active,0)]);else input.current?.focus();}} role="search">
      <SearchIcon size={23} aria-hidden="true"/>
      <label className="sr-only" htmlFor={`${id}-input`}>{label}</label>
      <input ref={input} id={`${id}-input`} autoComplete="off" placeholder={label} value={query} onChange={e=>{setQuery(e.target.value);setOpen(true);}} onFocus={()=>setOpen(true)} role="combobox" aria-autocomplete="list" aria-expanded={visible} aria-controls={visible?`${id}-list`:undefined} aria-activedescendant={visible && active>=0?`${id}-${active}`:undefined} aria-describedby={`${id}-help`} onKeyDown={e=>{
        if(e.key==='ArrowDown'){e.preventDefault();setOpen(true);setActive(n=>Math.min(n+1,results.length-1));}
        if(e.key==='ArrowUp'){e.preventDefault();setActive(n=>results.length?Math.max(n-1,0):-1);}
        if(e.key==='Escape'){setOpen(false);setActive(-1);}
      }}/>
      {query && <button type="button" className="icon-button clear-search" aria-label="Cancella ricerca" onClick={()=>{setQuery('');input.current?.focus();}}><X size={18}/></button>}
      <button className="primary search-submit" type="submit">Cerca</button>
    </form>
    <p className="search-help" id={`${id}-help`}>Comuni italiani da ISTAT. Indirizzi non ancora disponibili.</p>
    {visible && <div className="search-results"><ul role="listbox" id={`${id}-list`} aria-label="Comuni disponibili">
      {results.map((r,i)=><li role="option" id={`${id}-${i}`} key={r.id} aria-selected={i===active} className={i===active?'active':''} onMouseDown={e=>e.preventDefault()} onMouseEnter={()=>setActive(i)} onClick={()=>choose(r)}><MapPin size={22}/><span><strong>{r.name}</strong><small>{r.province} · {r.region}</small></span><span className="badge">ISTAT</span></li>)}
    </ul><div aria-live="polite">{loading?<p><LoaderCircle size={16} className="spin"/> Ricerca in corso…</p>:error?<p>Ricerca non disponibile. Riprova modificando il testo.</p>:results.length===0?<p>Nessun risultato per “{query}”. Prova con il nome o il codice ISTAT.</p>:<p className="keyboard-hint">Usa ↑ ↓ per selezionare e Invio per aprire.</p>}</div></div>}
  </div>;
}
