import { useEffect,useRef,useState } from 'react';
import { Mountain,Maximize2,RotateCcw,Layers,Compass,ChevronDown,Globe2,Satellite,Map as MapIcon,MapPin,Plus,Minus,AlertCircle } from 'lucide-react';
import type { Map as LibreMap,StyleSpecification } from 'maplibre-gl';
import type { BoundaryResponse,DataProvider,MunicipalityReport } from '../domain/model';
import 'maplibre-gl/dist/maplibre-gl.css';
import { createMapProvider,loadSatelliteStyle } from '../maps/provider';
import { flyToGlobe,flyToMunicipality,shouldUseTerrain,GLOBE_ZOOM } from '../maps/navigation';
import { boundarySvg } from '../maps/boundary';
import { formatDate } from '../domain/format';
const reduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const safeProvider=()=>{try{return createMapProvider({provider:import.meta.env.VITE_MAP_PROVIDER,key:import.meta.env.VITE_MAPTILER_KEY,usage:import.meta.env.VITE_MAP_USAGE,esriKey:import.meta.env.VITE_ESRI_API_KEY});}catch{return null;}};
export function TerritoryMap({report,provider}:{report:MunicipalityReport;provider:DataProvider}){
 const host=useRef<HTMLDivElement>(null),canvas=useRef<HTMLDivElement>(null),map=useRef<LibreMap|null>(null);
 const [boundary,setBoundary]=useState<BoundaryResponse|null>(null),[geometryError,setGeometryError]=useState(false);
 const [mode,setMode]=useState<'loading'|'static'|'interactive'>('loading');
 const [base,setBase]=useState<'loading'|'ready'|'error'>('loading'),[terrain,setTerrain]=useState<'loading'|'ready'|'unavailable'|'off'>('off');
 const [basemap,setBasemap]=useState<'satellite'|'streets'>(()=>safeProvider()?.satelliteAvailable?'satellite':'streets');
 const [loadedBase,setLoadedBase]=useState<'satellite'|'streets'|null>(null),[zoom,setZoom]=useState(GLOBE_ZOOM),[pitch,setPitch]=useState(0);
 const [visible,setVisible]=useState(true),[orbit,setOrbit]=useState(false),[styleReady,setStyleReady]=useState(false),[fullscreenError,setFullscreenError]=useState(false),[mapError,setMapError]=useState(''),[retry,setRetry]=useState(0);
 const config=safeProvider();const visibility=useRef(true);const globe=zoom<6;
 useEffect(()=>{const c=new AbortController();setBoundary(null);setGeometryError(false);setMode('loading');
  if(!report.boundary)return ()=>c.abort();
  provider.getBoundary(report.municipality.slug,c.signal).then(value=>{if(!c.signal.aborted){setBoundary(value);setGeometryError(!value);}}).catch(()=>{if(!c.signal.aborted)setGeometryError(true);});return ()=>c.abort();
 },[provider,report.municipality.slug,report.boundary]);
 useEffect(()=>{
  if(!boundary||!canvas.current)return;let stopped=false,instance:LibreMap|null=null,resize:ResizeObserver|undefined;
  setMode('loading');setLoadedBase(null);setOrbit(false);setZoom(GLOBE_ZOOM);setPitch(0);setVisible(true);visibility.current=true;
  import('maplibre-gl').then(({default:libre})=>{
   if(stopped||!canvas.current)return;
   try{instance=new libre.Map({container:canvas.current,style:{version:8,projection:{type:'globe'},sources:{},layers:[{id:'background',type:'background',paint:{'background-color':'#102631'}}]},center:boundary.provenance.mapCenter,zoom:GLOBE_ZOOM,minZoom:0,maxZoom:19,pitch:0,maxPitch:75,attributionControl:false,canvasContextAttributes:{antialias:true},scrollZoom:true,touchZoomRotate:true,dragPan:true,doubleClickZoom:true});}
   catch{setMode('static');return;}
   const m=instance;map.current=m;m.addControl(new libre.AttributionControl({compact:false}),'bottom-right');m.addControl(new libre.ScaleControl({unit:'metric',maxWidth:110}),'bottom-left');
   const camera=()=>{if(!stopped){setZoom(m.getZoom());setPitch(m.getPitch());}};
   m.on('move',camera);m.on('dragstart',()=>setOrbit(false));m.on('zoomstart',()=>setOrbit(false));
   m.once('load',()=>{if(!stopped)setMode('interactive');});
   m.on('webglcontextlost',()=>{if(!stopped){setMode('static');setOrbit(false);setStyleReady(false);}});
   resize=new ResizeObserver(()=>m.resize());resize.observe(canvas.current);
  }).catch(()=>{if(!stopped)setMode('static');});
  return ()=>{stopped=true;resize?.disconnect();instance?.remove();map.current=null;};
 },[boundary]);
 // Basemap changes preserve camera, zoom, projection and municipal context.
 // Globe/local buttons below only animate the camera, never reload a style.
 useEffect(()=>{
  const m=map.current,cfg=safeProvider();if(mode!=='interactive'||!boundary||!m)return;
  let stopped=false,terrainFailed=false;const abort=new AbortController();let terrainTimer:ReturnType<typeof setTimeout>|undefined;
  setBase('loading');setMapError('');setStyleReady(false);setOrbit(false);
  const syncTerrain=()=>{
   if(stopped||!m.getSource('elevation')||terrainFailed)return;
   if(shouldUseTerrain(m.getZoom())){if(!m.getTerrain()){m.setTerrain({source:'elevation',exaggeration:1});setTerrain('loading');if(terrainTimer)clearTimeout(terrainTimer);terrainTimer=setTimeout(()=>{if(!stopped&&m.getTerrain()&&!m.isSourceLoaded('elevation')){terrainFailed=true;m.setTerrain(null);setTerrain('unavailable');}},20000);}}
   else{if(terrainTimer)clearTimeout(terrainTimer);if(m.getTerrain())m.setTerrain(null);setTerrain('off');}
  };
  const error=(event:unknown)=>{if(stopped)return;const id=(event as {sourceId?:string}).sourceId;
   if(id==='elevation'){terrainFailed=true;setTerrain('unavailable');m.setTerrain(null);}else if(id!=='municipality'&&id!=='place-point'){setMapError('Alcune tessere non sono state caricate. Puoi continuare a muovere la mappa o riprovare.');}
  };
  const sourcedata=(event:{sourceId?:string;isSourceLoaded?:boolean})=>{if(stopped)return;if(event.sourceId==='elevation'&&event.isSourceLoaded&&m.getTerrain()){if(terrainTimer)clearTimeout(terrainTimer);setTerrain('ready');}};
  const idle=()=>{if(!stopped&&m.getLayer('municipality-line'))setBase('ready');};
  const installed=()=>{
   if(stopped)return;
   m.setProjection({type:'globe'});
   m.setSky({'sky-color':'#07121f','horizon-color':'#7ebed6','fog-color':'#c2d7dc','sky-horizon-blend':.5,'horizon-fog-blend':.4,'atmosphere-blend':['interpolate',['linear'],['zoom'],0,1,4,1,7,0]});
   m.addSource('municipality',{type:'geojson',data:boundary.feature,attribution:'Confine statistico: © Istat, CC BY 4.0'});
   m.addLayer({id:'municipality-fill',type:'fill',source:'municipality',layout:{visibility:visibility.current?'visible':'none'},paint:{'fill-color':'#c9f9ad','fill-opacity':.04}});
   m.addLayer({id:'municipality-glow',type:'line',source:'municipality',layout:{visibility:visibility.current?'visible':'none'},paint:{'line-color':'#113a2d','line-width':7,'line-opacity':.55}});
   m.addLayer({id:'municipality-line',type:'line',source:'municipality',layout:{visibility:visibility.current?'visible':'none'},paint:{'line-color':'#d8ff99','line-width':2}});
   m.addSource('place-point',{type:'geojson',data:{type:'Feature',properties:{},geometry:{type:'Point',coordinates:boundary.provenance.mapCenter}}});
   m.addLayer({id:'place-point',type:'circle',source:'place-point',maxzoom:10,layout:{visibility:visibility.current?'visible':'none'},paint:{'circle-radius':6,'circle-color':'#e4ff9b','circle-stroke-color':'#2d594a','circle-stroke-width':5,'circle-stroke-opacity':.5}});
   if(cfg?.terrain){m.addSource('elevation',{type:'raster-dem',url:cfg.terrain.url,encoding:cfg.terrain.encoding,tileSize:cfg.terrain.tileSize,attribution:'<a href="https://mapterhorn.com/attribution/">Mapterhorn e fonti DEM</a>'});syncTerrain();}
   setStyleReady(true);setLoadedBase(basemap);setBase('ready');
  };
  m.on('error',error);m.on('sourcedata',sourcedata);m.on('idle',idle);m.on('zoomend',syncTerrain);
  const load=async()=>{
   if(!cfg){setBase('error');setMapError('Servizio cartografico non configurato.');return;}
   try{let style:StyleSpecification;let maxZoom=19;
    if(basemap==='satellite'){const result=await loadSatelliteStyle(cfg,AbortSignal.any([abort.signal,AbortSignal.timeout(15000)]));style=result.style;maxZoom=result.maxZoom;}
    else{const response=await fetch(cfg.styleUrl,{signal:AbortSignal.any([abort.signal,AbortSignal.timeout(15000)])});if(!response.ok)throw new Error('Cartografia non raggiungibile.');style=await response.json() as StyleSpecification;style.layers=style.layers.filter(l=>l.type!=='fill-extrusion');}
    if(stopped)return;m.once('style.load',installed);m.setStyle({...style,projection:{type:'globe'}},{diff:false});m.setMaxZoom(maxZoom);
   }catch(err){if(!stopped){setBase('error');setMapError(err instanceof Error&&err.name==='TimeoutError'?'Il servizio cartografico non ha risposto. Riprova.':err instanceof Error?err.message:'Cartografia non disponibile.');setStyleReady(!!m.getLayer('municipality-line'));}}
  };void load();
  return ()=>{stopped=true;abort.abort();if(terrainTimer)clearTimeout(terrainTimer);m.off('style.load',installed);m.off('error',error);m.off('sourcedata',sourcedata);m.off('idle',idle);m.off('zoomend',syncTerrain);};
 },[boundary,mode,basemap,retry]);
 useEffect(()=>{if(!orbit||!map.current)return;let frame=0,last=0;const tick=(now:number)=>{const m=map.current;if(!m)return;if(last){if(m.getZoom()<6){const center=m.getCenter();m.jumpTo({center:[center.lng+(now-last)*.0018,center.lat]});}else m.rotateTo(m.getBearing()+(now-last)*.003,{duration:0});}last=now;frame=requestAnimationFrame(tick);};frame=requestAnimationFrame(tick);return ()=>cancelAnimationFrame(frame);},[orbit]);
 const goLocal=()=>{setOrbit(false);if(map.current&&boundary)flyToMunicipality(map.current,boundary.provenance,reduced());};
 const goGlobe=()=>{setOrbit(false);if(map.current&&boundary)flyToGlobe(map.current,boundary.provenance,reduced());};
 const toggleBoundary=()=>{const next=!visible;visibility.current=next;setVisible(next);for(const id of ['municipality-fill','municipality-glow','municipality-line','place-point'])if(map.current?.getLayer(id))map.current.setLayoutProperty(id,'visibility',next?'visible':'none');};
 const satelliteMissing=!config?.satelliteAvailable;
 return <div className="map-section earth-explorer"><section ref={host} className="territory-map earth-stage" aria-label={`Esplora ${report.municipality.name} dal globo al territorio`}>
  <div ref={canvas} className="real-map"/>
  {boundary&&mode==='static'&&<svg className="boundary-static" viewBox="0 0 600 380" role="img" aria-label={`Confine ISTAT di ${report.municipality.name}`}><path d={boundarySvg(boundary.feature)} fill="#a8d68122" stroke="#b6e98b" strokeWidth="2" fillRule="evenodd"/></svg>}
  <div className="earth-title"><span>ATLANTE DEI LUOGHI</span><h2>{report.municipality.name}</h2><p>{mode==='static'?'Vista statica · cartografia interattiva non disponibile':globe?'Una prospettiva più grande.':terrain==='ready'&&pitch>10?'Dentro il territorio.':'Ogni luogo, da vicino.'}</p></div>
  {!boundary&&<div className="map-empty"><Mountain size={35}/><p role="status">{!report.boundary?report.boundaryMissingReason:geometryError?'Confine non caricabile.':'Caricamento del confine ufficiale…'}</p></div>}
  {mode==='interactive'&&<>
   <div className="earth-basemaps" aria-label="Sfondo cartografico"><button aria-pressed={loadedBase==='satellite'} onClick={()=>{if(satelliteMissing){setMapError('Satellite Esri non ancora configurato per questo sito. La mappa è disponibile.');return;}setBasemap('satellite');}}><Satellite size={16}/> Satellite {satelliteMissing&&<span>Da attivare</span>}</button><button aria-pressed={loadedBase==='streets'} onClick={()=>setBasemap('streets')}><MapIcon size={16}/> Mappa</button></div>
   <div className="earth-zoom" aria-label="Zoom e orientamento"><button aria-label="Aumenta zoom" onClick={()=>map.current?.zoomIn({duration:reduced()?0:300})}><Plus size={20}/></button><button aria-label="Riduci zoom" onClick={()=>map.current?.zoomOut({duration:reduced()?0:300})}><Minus size={20}/></button><button aria-label="Orienta a nord" onClick={()=>map.current?.easeTo({bearing:0,duration:reduced()?0:500})}><Compass size={20}/></button><button aria-label="Schermo intero" onClick={()=>{if(!host.current?.requestFullscreen){setFullscreenError(true);return;}host.current.requestFullscreen().catch(()=>setFullscreenError(true));}}><Maximize2 size={19}/></button></div>
   <div className="earth-journey"><button disabled={!styleReady} aria-pressed={globe} onClick={goGlobe}><Globe2 size={20}/><span>Globo</span></button><span className="journey-line"/><button disabled={!styleReady} onClick={goLocal} className="journey-destination"><MapPin size={19}/><span>Vola a {report.municipality.name}</span></button></div>
   <div className="earth-tools" aria-label="Controlli del territorio"><button disabled={!styleReady} aria-pressed={pitch>10} onClick={()=>{setOrbit(false);if(globe)goLocal();else map.current?.easeTo({pitch:pitch>10?0:60,duration:reduced()?0:600});}}><Mountain size={16}/>{pitch>10?'Dall’alto':'Inclina'}</button><button disabled={!styleReady} aria-pressed={visible} onClick={toggleBoundary}><Layers size={16}/> Confine</button><button aria-pressed={orbit} disabled={!styleReady||reduced()} onClick={()=>setOrbit(!orbit)}><RotateCcw size={16}/>{orbit?'Ferma':'Orbita'}</button></div>
   <div className="earth-status" role="status">{base==='loading'?'Caricamento della cartografia…':loadedBase==='satellite'?config?.satelliteName:'OpenStreetMap · cartografia'}{!globe&&terrain==='loading'?' · caricamento rilievo':!globe&&terrain==='unavailable'?' · rilievo non disponibile':''}</div>
   {mapError&&<div className="earth-error" role="status"><AlertCircle size={16}/><span>{mapError}</span><button onClick={()=>{setMapError('');setRetry(n=>n+1);}}>Riprova</button></div>}
  </>}
 </section>
 <div className="earth-caption"><span>Trascina per esplorare · rotella o +/− per zoomare · due dita su mobile</span><span>Confine ISTAT {report.boundary?formatDate(report.boundary.referenceDate):'non disponibile'}</span></div>
 {fullscreenError&&<p role="status" className="map-note">Schermo intero non disponibile nel browser.</p>}
 {satelliteMissing&&<p className="map-note">Satellite Esri World Imagery in attivazione. La cartografia resta navigabile; nessuna immagine NASA viene usata in sostituzione.</p>}
 {boundary&&<details className="map-provenance"><summary>Fonti, date e limiti della mappa <ChevronDown size={16}/></summary><div><p>Confine: <a href={boundary.provenance.originalUrl}>Istat · CC BY 4.0</a>, riferimento {formatDate(boundary.provenance.referenceDate)}. Il punto è calcolato all’interno del poligono e non identifica il municipio.</p><p>Satellite: <a href="https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9">Esri World Imagery</a>, mosaico di fornitori tra cui Maxar/Vantor, Earthstar Geographics e GIS User Community. I crediti correnti del servizio sono riportati sulla mappa. Date e risoluzioni cambiano per area: nessuna immagine live, nessuna data unica attribuita al comune. Le fotografie non forniscono un modello 3D degli edifici.</p><p>Rilievo: <a href="https://mapterhorn.com/attribution/">Mapterhorn e fonti DEM</a>, scala altimetrica 1:1. In pianura può essere poco visibile. Senza DEM resta una vista prospettica, non un rilievo simulato. Cartografia: <a href="https://openfreemap.org/">OpenFreeMap</a> / <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>. MapTiler resta un provider alternativo opzionale.</p><p className="checksum">Metodo confine: {boundary.provenance.methodVersion}<br/>SHA-256: {boundary.provenance.sha256}</p></div></details>}
 </div>;
}
