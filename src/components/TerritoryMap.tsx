import { useEffect,useRef,useState } from 'react';
import { Mountain,Maximize2,RotateCcw,Layers,Compass,ChevronDown } from 'lucide-react';
import type { Map as LibreMap,StyleSpecification } from 'maplibre-gl';
import type { BoundaryResponse,DataProvider,MunicipalityReport } from '../domain/model';
import 'maplibre-gl/dist/maplibre-gl.css';
import { createMapProvider } from '../maps/provider';
import { boundarySvg } from '../maps/boundary';
import { formatDate } from '../domain/format';

export function TerritoryMap({report,provider}:{report:MunicipalityReport;provider:DataProvider}){
 const host=useRef<HTMLDivElement>(null),canvas=useRef<HTMLDivElement>(null),map=useRef<LibreMap|null>(null);
 const [boundary,setBoundary]=useState<BoundaryResponse|null>(null),[geometryError,setGeometryError]=useState(false);
 const [mode,setMode]=useState<'loading'|'static'|'interactive'>('loading');
 const [base,setBase]=useState<'loading'|'ready'|'unavailable'>('loading');
 const [terrain,setTerrain]=useState<'loading'|'ready'|'unavailable'>('loading');
 const [flat,setFlat]=useState(false),[visible,setVisible]=useState(true),[orbit,setOrbit]=useState(false);
 const [fullscreenError,setFullscreenError]=useState(false);
 const mapProvider=createMapProviderSafe();
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 useEffect(()=>{
  const c=new AbortController();setBoundary(null);setGeometryError(false);
  if(!report.boundary)return;
  provider.getBoundary(report.municipality.slug,c.signal).then(value=>{if(!c.signal.aborted){setBoundary(value);setGeometryError(!value);}}).catch(()=>{if(!c.signal.aborted)setGeometryError(true);});
  return ()=>c.abort();
 },[provider,report.municipality.slug,report.boundary]);
 useEffect(()=>{
  if(!boundary||!canvas.current)return;
  let stopped=false,instance:LibreMap|null=null;const controller=new AbortController();let timeout:ReturnType<typeof setTimeout>|undefined,terrainTimeout:ReturnType<typeof setTimeout>|undefined;
  const config=createMapProviderSafe();
  setMode('loading');setBase(config?'loading':'unavailable');setTerrain(config?.terrain?'loading':'unavailable');setFlat(false);setVisible(true);setOrbit(false);
  const {bbox}=boundary.provenance;
  const addBoundary=(m:LibreMap)=>{
   if(!m.getSource('municipality'))m.addSource('municipality',{type:'geojson',data:boundary.feature,attribution:'Confine statistico: © Istat, CC BY 4.0'});
   if(!m.getLayer('municipality-fill'))m.addLayer({id:'municipality-fill',type:'fill',source:'municipality',paint:{'fill-color':'#b4e582','fill-opacity':.12}});
   if(!m.getLayer('municipality-line'))m.addLayer({id:'municipality-line',type:'line',source:'municipality',paint:{'line-color':'#afef68','line-width':3}});
  };
  const localStyle:StyleSpecification={version:8,sources:{},layers:[{id:'background',type:'background',paint:{'background-color':'#173930'}}]};
  import('maplibre-gl').then(async({default:libre})=>{
   if(stopped||!canvas.current)return;
   try{
    instance=new libre.Map({container:canvas.current,style:localStyle,center:boundary.provenance.mapCenter,zoom:11,pitch:0,bearing:-15,maxPitch:75,maxBounds:[[5,35],[20,49]],attributionControl:false,canvasContextAttributes:{antialias:true}});
   }catch{setMode('static');setBase('unavailable');setTerrain('unavailable');return;}
   const m=instance;map.current=m;
   m.addControl(new libre.NavigationControl({visualizePitch:true}),'top-right');
   m.addControl(new libre.AttributionControl({compact:true}),'bottom-right');
   m.once('load',()=>{if(stopped)return;addBoundary(m);m.fitBounds([[bbox[0],bbox[1]],[bbox[2],bbox[3]]],{padding:65,maxZoom:14,duration:0});setMode('interactive');});
   m.on('error',event=>{if(stopped)return;const sourceId='sourceId' in event?event.sourceId:null;if(sourceId==='elevation'){setTerrain('unavailable');m.setTerrain(null);}else if(sourceId!=='municipality'){setBase('unavailable');}});
   m.on('sourcedata',event=>{if(!stopped&&event.sourceId==='elevation'&&event.isSourceLoaded&&m.getTerrain()){if(terrainTimeout)clearTimeout(terrainTimeout);setTerrain('ready');}});
   if(!config)return;
   timeout=setTimeout(()=>controller.abort(),12000);
   try{
    const response=await fetch(config.styleUrl,{signal:controller.signal});
    if(!response.ok)throw new Error('Base map unavailable');
    const style=await response.json() as StyleSpecification;
    if(stopped)return;
    // Default render_height may include inferred/default heights. No building extrusions.
    style.layers=style.layers.filter(layer=>layer.type!=='fill-extrusion');
    m.once('style.load',()=>{
     if(stopped)return;addBoundary(m);setBase('ready');
     if(config.terrain){
      m.addSource('elevation',{type:'raster-dem',url:config.terrain.url,encoding:config.terrain.encoding,tileSize:config.terrain.tileSize,attribution:config.attribution});
      m.setTerrain({source:'elevation',exaggeration:1});
      terrainTimeout=setTimeout(()=>{if(!stopped&&!m.isSourceLoaded('elevation')){m.setTerrain(null);setTerrain('unavailable');}},15000);
      m.easeTo({pitch:58,bearing:-18,duration:reduced()?0:1000});
     }
    });
    m.setStyle(style);
   }catch{if(!stopped){setBase('unavailable');setTerrain('unavailable');}}
   finally{if(timeout)clearTimeout(timeout);}
  }).catch(()=>{if(!stopped){setMode('static');setBase('unavailable');setTerrain('unavailable');}});
  return ()=>{stopped=true;controller.abort();if(timeout)clearTimeout(timeout);if(terrainTimeout)clearTimeout(terrainTimeout);instance?.remove();map.current=null;};
 },[boundary]);
 useEffect(()=>{if(!orbit||!map.current)return;let frame=0;let last=0;
  const tick=(now:number)=>{if(!map.current)return;if(last)map.current.rotateTo(map.current.getBearing()+(now-last)*.003,{duration:0});last=now;frame=requestAnimationFrame(tick);};
  frame=requestAnimationFrame(tick);return ()=>cancelAnimationFrame(frame);
 },[orbit]);
 const toggleBoundary=()=>{const next=!visible;setVisible(next);for(const id of ['municipality-fill','municipality-line'])if(map.current?.getLayer(id))map.current.setLayoutProperty(id,'visibility',next?'visible':'none');};
 const reset=()=>{setOrbit(false);if(!boundary)return;const b=boundary.provenance.bbox;map.current?.fitBounds([[b[0],b[1]],[b[2],b[3]]],{pitch:flat||terrain!=='ready'?0:58,bearing:-18,padding:65,maxZoom:14,duration:reduced()?0:700});};
 return <div className="map-section"><section ref={host} className="territory-map" aria-label={`Mappa di ${report.municipality.name}`}>
  <div ref={canvas} className="real-map"/>
  {boundary&&mode!=='interactive'&&<svg className="boundary-static" viewBox="0 0 600 380" role="img" aria-label={`Confine statistico reale di ${report.municipality.name} al 1 gennaio 2026`}><path d={boundarySvg(boundary.feature)} fill="#a8d68122" stroke="#b6e98b" strokeWidth="2" fillRule="evenodd"/><text x="35" y="45" fill="#b9cfbb" fontSize="12">N ↑</text></svg>}
  <div className="map-heading"><span className="map-kicker">IL TERRITORIO</span><h2>{report.municipality.name}</h2><span className="map-view-label">{mode==='interactive'&&terrain==='ready'&&!flat?'Rilievo 3D · scala altimetrica reale':mode==='interactive'&&base==='ready'?'Cartografia stradale':boundary?'Confine statistico ISTAT':'Geometria non disponibile'}</span></div>
  {!boundary&&<div className="map-empty"><Mountain size={35}/><p role="status">{!report.boundary?report.boundaryMissingReason:geometryError?'Non siamo riusciti a caricare la geometria. Nessuna forma sostitutiva viene mostrata.':'Caricamento del confine ufficiale…'}</p></div>}
  {boundary&&<div className="map-foot"><span className="boundary-legend"><i/> Confine al {formatDate(boundary.provenance.referenceDate)}</span><span>{mode==='static'?'Vista statica · 3D non supportato in questo browser':base==='unavailable'?'Sfondo e rilievi non disponibili':terrain==='loading'?'Caricamento del rilievo…':''}</span></div>}
  {mode==='interactive'&&<div className="map-toolbar" aria-label="Controlli mappa">
   <button disabled={terrain!=='ready'} aria-pressed={!flat} onClick={()=>{const next=!flat;setFlat(next);setOrbit(false);map.current?.easeTo({pitch:next?0:58,duration:reduced()?0:700});}}><Mountain size={17}/>{flat?'Vista 3D':'Vista 2D'}</button>
   <button aria-pressed={visible} onClick={toggleBoundary}><Layers size={17}/> Confine</button>
   <button aria-pressed={orbit} disabled={reduced()} onClick={()=>setOrbit(!orbit)}><Compass size={17}/>{orbit?'Ferma giro':'Esplora'}</button>
   <button aria-label="Ricentra sul comune" onClick={reset}><RotateCcw size={17}/></button>
   <button aria-label="Mappa a schermo intero" onClick={()=>host.current?.requestFullscreen().catch(()=>setFullscreenError(true))}><Maximize2 size={17}/></button>
  </div>}
 </section>
 {fullscreenError&&<p role="status" className="map-note">Schermo intero non disponibile in questo browser.</p>}
 <p className="map-note">{report.boundary?'Confine storico a fini statistici, non catastale. Può differire dal territorio attuale.':'Nessun confine o punto geografico inventato.'}</p>
 {boundary&&<details className="map-provenance"><summary>Fonte, trasformazioni e limiti della mappa <ChevronDown size={16}/></summary><div><p>Confine: <a href={boundary.provenance.originalUrl}>Istat · CC BY 4.0</a>, riferimento {formatDate(boundary.provenance.referenceDate)}. Acquisito {formatDate(boundary.provenance.retrievedAt)}.</p><p>Geometria elaborata: conversione {boundary.provenance.sourceCrs} → {boundary.provenance.outputCrs}. Nessuna ulteriore semplificazione. Il punto di centraggio è calcolato all’interno del poligono e non identifica il municipio.</p><p>Affidabilità: {boundary.provenance.reliability.reason}</p><p>{mapProvider?.id==='maptiler'?<>Cartografia e rilievo: <a href="https://www.maptiler.com/copyright/">MapTiler</a> · <a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a>.</>:<>Cartografia: <a href="https://openfreemap.org/">OpenFreeMap</a>, <a href="https://openmaptiles.org/">OpenMapTiles</a>, <a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors · ODbL</a>. Rilievo: <a href="https://mapterhorn.com/attribution/">Mapterhorn e fonti DEM</a>.</>} Date e risoluzioni variabili, non misure del singolo immobile. Edifici estrusi non attivati: non assegniamo altezze mancanti.</p><p className="checksum">Metodo: {boundary.provenance.methodVersion}<br/>SHA-256 geometria: {boundary.provenance.sha256}<br/>SHA-256 archivio originale: {boundary.provenance.originalSha256}</p></div></details>}
 </div>;
}
function createMapProviderSafe(){try{return createMapProvider({provider:import.meta.env.VITE_MAP_PROVIDER,key:import.meta.env.VITE_MAPTILER_KEY,usage:import.meta.env.VITE_MAP_USAGE});}catch{return null;}}
