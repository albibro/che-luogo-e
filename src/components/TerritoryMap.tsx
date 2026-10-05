import { useEffect,useRef,useState } from 'react';
import { Mountain,Maximize2,RotateCcw,Layers,Compass,ChevronDown,Globe2,Satellite,Map as MapIcon,MapPin } from 'lucide-react';
import type { Map as LibreMap,StyleSpecification } from 'maplibre-gl';
import type { BoundaryResponse,DataProvider,MunicipalityReport } from '../domain/model';
import 'maplibre-gl/dist/maplibre-gl.css';
import { createMapProvider,satelliteStyle } from '../maps/provider';
import { boundarySvg } from '../maps/boundary';
import { formatDate } from '../domain/format';
const reduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const safeProvider=()=>{try{return createMapProvider({provider:import.meta.env.VITE_MAP_PROVIDER,key:import.meta.env.VITE_MAPTILER_KEY,usage:import.meta.env.VITE_MAP_USAGE});}catch{return null;}};
export function TerritoryMap({report,provider}:{report:MunicipalityReport;provider:DataProvider}){
 const host=useRef<HTMLDivElement>(null),canvas=useRef<HTMLDivElement>(null),map=useRef<LibreMap|null>(null);
 const [boundary,setBoundary]=useState<BoundaryResponse|null>(null),[geometryError,setGeometryError]=useState(false);
 const [mode,setMode]=useState<'loading'|'static'|'interactive'>('loading');
 const [base,setBase]=useState<'loading'|'ready'|'unavailable'>('loading'),[terrain,setTerrain]=useState<'loading'|'ready'|'unavailable'>('unavailable');
 const [view,setView]=useState<'globe'|'local'>('globe'),[basemap,setBasemap]=useState<'satellite'|'streets'>('satellite');
 const [flat,setFlat]=useState(false),[visible,setVisible]=useState(true),[orbit,setOrbit]=useState(false),[styleReady,setStyleReady]=useState(false),[fullscreenError,setFullscreenError]=useState(false);
 const config=safeProvider(),coarse=config?.id!=='maptiler';
 useEffect(()=>{const c=new AbortController();setBoundary(null);setGeometryError(false);setMode('loading');
  if(!report.boundary)return ()=>c.abort();
  provider.getBoundary(report.municipality.slug,c.signal).then(value=>{if(!c.signal.aborted){setBoundary(value);setGeometryError(!value);}}).catch(()=>{if(!c.signal.aborted)setGeometryError(true);});return ()=>c.abort();
 },[provider,report.municipality.slug,report.boundary]);
 useEffect(()=>{
  if(!boundary||!canvas.current)return;let stopped=false,instance:LibreMap|null=null;
  setMode('loading');setView('globe');setBasemap('satellite');setFlat(false);setVisible(true);setOrbit(false);
  import('maplibre-gl').then(({default:libre})=>{
   if(stopped||!canvas.current)return;
   try{instance=new libre.Map({container:canvas.current,style:{version:8,sources:{},layers:[{id:'background',type:'background',paint:{'background-color':'#081623'}}]},center:boundary.provenance.mapCenter,zoom:1.5,pitch:0,maxPitch:75,attributionControl:false,canvasContextAttributes:{antialias:true}});}
   catch{setMode('static');return;}
   const m=instance;map.current=m;m.addControl(new libre.NavigationControl({visualizePitch:true}),'top-right');m.addControl(new libre.AttributionControl({compact:true}),'bottom-right');
   m.once('load',()=>{if(!stopped)setMode('interactive');});
   m.on('webglcontextlost',()=>{if(!stopped){setMode('static');setOrbit(false);}});
  }).catch(()=>{if(!stopped)setMode('static');});
  return ()=>{stopped=true;instance?.remove();map.current=null;};
 },[boundary]);
 useEffect(()=>{
  const m=map.current,cfg=safeProvider();if(mode!=='interactive'||!boundary||!m)return;
  let stopped=false,failed=false;const abort=new AbortController();let terrainTimer:ReturnType<typeof setTimeout>|undefined;
  setStyleReady(false);setBase('loading');setTerrain('unavailable');setOrbit(false);setVisible(true);setFlat(false);
  const error=(event:unknown)=>{if(stopped)return;const id=(event as {sourceId?:string}).sourceId;
   if(id==='elevation'){setTerrain('unavailable');m.setTerrain(null);}else if(id!=='municipality'&&id!=='place-point'){failed=true;setBase('unavailable');}
  };
  const sourcedata=(event:{sourceId?:string;isSourceLoaded?:boolean})=>{if(stopped)return;if(event.sourceId==='elevation'&&event.isSourceLoaded&&m.getTerrain()){if(terrainTimer)clearTimeout(terrainTimer);setTerrain('ready');}};
  const idle=()=>{if(!stopped&&!failed)setBase('ready');};
  const installed=()=>{
   if(stopped)return;
   m.setProjection({type:view==='globe'?'globe':'mercator'});
   m.setSky({'sky-color':'#091827','horizon-color':'#83bed2','fog-color':'#112638','sky-horizon-blend':.6,'horizon-fog-blend':.5,'atmosphere-blend':view==='globe'?1:0});
   m.addSource('municipality',{type:'geojson',data:boundary.feature,attribution:'Confine statistico: © Istat, CC BY 4.0'});
   m.addLayer({id:'municipality-fill',type:'fill',source:'municipality',paint:{'fill-color':'#b4e582','fill-opacity':.1}});
   m.addLayer({id:'municipality-line',type:'line',source:'municipality',paint:{'line-color':'#d8ff7c','line-width':2.5}});
   m.addSource('place-point',{type:'geojson',data:{type:'Feature',properties:{},geometry:{type:'Point',coordinates:boundary.provenance.mapCenter}}});
   m.addLayer({id:'place-point',type:'circle',source:'place-point',maxzoom:8,paint:{'circle-radius':6,'circle-color':'#e4ff9b','circle-stroke-color':'#16382b','circle-stroke-width':2}});
   const lowResolution=basemap==='satellite'&&cfg?.id!=='maptiler';m.setMaxZoom(lowResolution?8:19);
   if(view==='globe')m.jumpTo({center:boundary.provenance.mapCenter,zoom:1.5,pitch:0,bearing:0});
   else {const b=boundary.provenance.bbox;m.fitBounds([[b[0],b[1]],[b[2],b[3]]],{padding:75,maxZoom:lowResolution?8:13.5,pitch:58,bearing:-20,duration:reduced()?0:1200});
    if(cfg?.terrain){m.addSource('elevation',{type:'raster-dem',url:cfg.terrain.url,encoding:cfg.terrain.encoding,tileSize:cfg.terrain.tileSize,attribution:cfg.attribution});m.setTerrain({source:'elevation',exaggeration:1});setTerrain('loading');terrainTimer=setTimeout(()=>{if(!stopped&&!m.isSourceLoaded('elevation')){m.setTerrain(null);setTerrain('unavailable');}},18000);}
   }
   setStyleReady(true);
  };
  m.on('error',error);m.on('sourcedata',sourcedata);m.on('idle',idle);
  const load=async()=>{
   if(!cfg){setBase('unavailable');return;}
   try{let style:StyleSpecification;if(basemap==='satellite')style=satelliteStyle(cfg);else{const response=await fetch(cfg.styleUrl,{signal:AbortSignal.any([abort.signal,AbortSignal.timeout(15000)])});if(!response.ok)throw new Error();style=await response.json() as StyleSpecification;style.layers=style.layers.filter(l=>l.type!=='fill-extrusion');}
    if(stopped)return;m.once('style.load',installed);m.setStyle(style,{diff:false});
   }catch{if(!stopped)setBase('unavailable');}
  };void load();
  return ()=>{stopped=true;abort.abort();if(terrainTimer)clearTimeout(terrainTimer);m.off('style.load',installed);m.off('error',error);m.off('sourcedata',sourcedata);m.off('idle',idle);};
 },[boundary,mode,view,basemap]);
 useEffect(()=>{if(!orbit||!map.current)return;let frame=0,last=0;const tick=(now:number)=>{const m=map.current;if(!m)return;if(last){if(view==='globe'){const center=m.getCenter();m.jumpTo({center:[center.lng+(now-last)*.0015,center.lat]});}else m.rotateTo(m.getBearing()+(now-last)*.003,{duration:0});}last=now;frame=requestAnimationFrame(tick);};frame=requestAnimationFrame(tick);return ()=>cancelAnimationFrame(frame);},[orbit,view]);
 const reset=()=>{setOrbit(false);const m=map.current;if(!m||!boundary)return;if(view==='globe')m.flyTo({center:boundary.provenance.mapCenter,zoom:1.5,pitch:0,bearing:0,duration:reduced()?0:1000});else{const b=boundary.provenance.bbox;m.fitBounds([[b[0],b[1]],[b[2],b[3]]],{pitch:flat?0:58,bearing:-20,padding:75,maxZoom:basemap==='satellite'&&coarse?8:13.5,duration:reduced()?0:900});}};
 const goLocal=()=>{setView('local');if(coarse)setBasemap('streets');};
 const toggleBoundary=()=>{const next=!visible;setVisible(next);for(const id of ['municipality-fill','municipality-line','place-point'])if(map.current?.getLayer(id))map.current.setLayoutProperty(id,'visibility',next?'visible':'none');};
 return <div className="map-section"><section ref={host} className="territory-map space-map" aria-label={`Globo e territorio di ${report.municipality.name}`}>
  <div ref={canvas} className="real-map"/>
  {boundary&&(mode!=='interactive'||base==='unavailable')&&<svg className="boundary-static" viewBox="0 0 600 380" role="img" aria-label={`Confine ISTAT di ${report.municipality.name}`}><path d={boundarySvg(boundary.feature)} fill="#a8d68122" stroke="#b6e98b" strokeWidth="2" fillRule="evenodd"/></svg>}
  <div className="map-heading"><span className="map-kicker">DAL PIANETA AL TUO COMUNE</span><h2>{report.municipality.name}</h2><span className="map-view-label">{mode==='static'?'Vista statica · WebGL non disponibile':view==='globe'?'Globo 3D · trascina per esplorare':terrain==='ready'&&!flat?'Rilievo 3D · altimetria reale':flat?'Vista 2D':'Vista prospettica · rilievo in verifica'}</span></div>
  {!boundary&&<div className="map-empty"><Mountain size={35}/><p role="status">{!report.boundary?report.boundaryMissingReason:geometryError?'Confine non caricabile.':'Caricamento del confine ufficiale…'}</p></div>}
  {mode==='interactive'&&<>
   <div className="map-modes" aria-label="Vista cartografica"><button aria-pressed={view==='globe'} onClick={()=>{setView('globe');setBasemap('satellite');}}><Globe2 size={17}/> Globo</button><button aria-pressed={view==='local'} onClick={goLocal}><MapPin size={17}/> Comune 3D</button></div>
   <div className="map-bases" aria-label="Sfondo"><button aria-pressed={basemap==='satellite'} onClick={()=>setBasemap('satellite')}><Satellite size={16}/> Satellite</button><button aria-pressed={basemap==='streets'} onClick={()=>setBasemap('streets')}><MapIcon size={16}/> Mappa</button></div>
   <div className="map-toolbar" aria-label="Controlli mappa">
    {view==='local'&&<button disabled={!styleReady} aria-pressed={!flat} onClick={()=>{setFlat(!flat);setOrbit(false);map.current?.easeTo({pitch:flat?58:0,duration:reduced()?0:700});}}><Mountain size={17}/>{flat?'Inclina':'Dall’alto'}</button>}
    <button disabled={!styleReady} aria-pressed={visible} onClick={toggleBoundary}><Layers size={17}/> Confine</button>
    <button aria-pressed={orbit} disabled={!styleReady||reduced()} onClick={()=>setOrbit(!orbit)}><Compass size={17}/>{orbit?'Ferma':'Ruota'}</button>
    <button disabled={!styleReady} aria-label="Ricentra" onClick={reset}><RotateCcw size={17}/></button>
    <button aria-label="Mappa a schermo intero" onClick={()=>{if(!host.current?.requestFullscreen){setFullscreenError(true);return;}host.current.requestFullscreen().catch(()=>setFullscreenError(true));}}><Maximize2 size={17}/></button>
   </div>
  </>}
  {boundary&&<div className="map-foot"><span>{basemap==='satellite'?(coarse?'NASA Blue Marble · mosaico storico · circa 500 m':'MapTiler · immagini satellitari/aeree · epoche variabili'):`Confine ISTAT · ${formatDate(boundary.provenance.referenceDate)}`}</span><span role="status">{base==='unavailable'?'Servizio cartografico non caricabile':base==='loading'?'Caricamento cartografia…':view==='local'&&terrain==='unavailable'?'Rilievo non disponibile':''}</span></div>}
 </section>
 {fullscreenError&&<p role="status" className="map-note">Schermo intero non disponibile nel browser.</p>}
 <p className="map-note">{basemap==='satellite'&&coarse?'Vista satellitare globale storica, non live: lo zoom è limitato alla risoluzione originale. Per strade e confini locali scegli Comune 3D.':'Il 3D rappresenta il terreno. Non è una ricostruzione fotorealistica degli edifici.'}</p>
 {boundary&&<details className="map-provenance"><summary>Fonti, date e limiti della mappa <ChevronDown size={16}/></summary><div><p>Confine: <a href={boundary.provenance.originalUrl}>Istat · CC BY 4.0</a>, riferimento {formatDate(boundary.provenance.referenceDate)}; acquisito {formatDate(boundary.provenance.retrievedAt)}. Statistico, non catastale.</p><p>Il punto luminoso è calcolato all’interno del poligono: non identifica il municipio. Conversione {boundary.provenance.sourceCrs} → {boundary.provenance.outputCrs}. Nessuna ulteriore semplificazione.</p><p>Satellite globale: <a href="https://nasa-gibs.github.io/gibs-api-docs/">NASA GIBS</a> / <a href="https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/">Blue Marble MODIS</a>. Mosaico storico, circa 500 m; data esatta del layer statico non indicata dal servizio. Nessun dato quantitativo ricavato dalle immagini.</p><p>Cartografia: <a href="https://openfreemap.org/">OpenFreeMap</a> / <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>. Rilievo: <a href="https://mapterhorn.com/attribution/">Mapterhorn e fonti DEM</a>, scala altimetrica 1:1. Con provider MapTiler configurato: <a href="https://www.maptiler.com/copyright/">MapTiler e fornitori originali</a>. Epoche e risoluzioni variabili; nessuna altezza di edificio inventata.</p><p className="checksum">Metodo: {boundary.provenance.methodVersion}<br/>SHA-256 geometria: {boundary.provenance.sha256}</p></div></details>}
 </div>;
}
