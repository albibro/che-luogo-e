import type { StyleSpecification } from 'maplibre-gl';
export interface MapProvider {id:string;styleUrl:string;terrain:{url:string;encoding:'mapbox'|'terrarium';tileSize:number}|null;attribution:string;esriKey?:string;satelliteAvailable:boolean;satelliteName:string}
const terrain={url:'https://tiles.mapterhorn.com/tilejson.json',encoding:'terrarium' as const,tileSize:512};
const osmAttribution='<a href="https://openfreemap.org">OpenFreeMap</a> · <a href="https://openmaptiles.org">© OpenMapTiles</a> · <a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a>';
// Browser basemap credentials are public: least privilege and domain restrictions required.
export function createMapProvider(config:{provider?:string;key?:string;usage?:string;esriKey?:string}):MapProvider|null {
 const selected=config.provider??'esri';if(selected==='disabled')return null;
 if(selected==='esri'||selected==='openfreemap')return {id:'esri',styleUrl:'https://tiles.openfreemap.org/styles/liberty',terrain,attribution:osmAttribution,esriKey:config.esriKey?.trim(),satelliteAvailable:!!config.esriKey?.trim(),satelliteName:'Esri World Imagery'};
 if(selected!=='maptiler'||!config.key||!['research-development','commercial-plan-verified'].includes(config.usage??''))throw new Error('Cartografia non configurata o condizioni non verificate');
 const key=encodeURIComponent(config.key);
 return {id:'maptiler',styleUrl:`https://api.maptiler.com/maps/streets-v4/style.json?key=${key}`,terrain:{url:`https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${key}`,encoding:'mapbox',tileSize:256},attribution:'<a href="https://www.maptiler.com/copyright/">© MapTiler</a>',satelliteAvailable:true,satelliteName:'MapTiler Satellite'};
}
export const ESRI_IMAGERY='https://ibasemaps-api.arcgis.com/arcgis/rest/services/World_Imagery/MapServer';
export interface ImageryMetadata {copyrightText:string;tileInfo:{rows:number;cols:number;spatialReference:{wkid:number;latestWkid?:number};lods:{level:number}[]};error?:{code:number}}
const escapeHtml=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function esriSatelliteStyle(key:string,meta:ImageryMetadata):{style:StyleSpecification;maxZoom:number}{
 if(!key.trim())throw new Error('Satellite Esri da configurare. La mappa resta disponibile.');
 const t=meta?.tileInfo,wkid=t?.spatialReference?.latestWkid??t?.spatialReference?.wkid;
 if(meta?.error)throw new Error('Esri non ha autorizzato la richiesta. Verificare chiave, privilegi e dominio.');
 if(!meta?.copyrightText?.trim()||!t||![256,512].includes(t.rows)||t.cols!==t.rows||![3857,102100,102113].includes(wkid)||!t.lods?.length||t.lods.some(l=>!Number.isInteger(l.level)||l.level<0||l.level>30))throw new Error('Metadati o attribuzioni Esri non validabili.');
 const maxZoom=Math.min(19,Math.max(...t.lods.map(l=>l.level)));
 const attribution=`Powered by <a href="https://www.esri.com/">Esri</a> | ${escapeHtml(meta.copyrightText)}`;
 return {maxZoom,style:{version:8,sources:{satellite:{type:'raster',tiles:[`${ESRI_IMAGERY}/tile/{z}/{y}/{x}?token=${encodeURIComponent(key)}`],tileSize:t.rows,maxzoom:maxZoom,attribution}},layers:[{id:'satellite',type:'raster',source:'satellite',paint:{'raster-fade-duration':250}}]}};
}
export async function loadSatelliteStyle(config:MapProvider,signal:AbortSignal,fetcher:typeof fetch=fetch):Promise<{style:StyleSpecification;maxZoom:number}>{
 if(!config.satelliteAvailable)throw new Error('Satellite Esri da configurare. Puoi usare la mappa.');
 if(config.id==='esri'){
  const response=await fetcher(`${ESRI_IMAGERY}?f=json&token=${encodeURIComponent(config.esriKey!)}`,{signal});
  if(!response.ok)throw new Error('Esri non raggiungibile o chiave non autorizzata.');
  return esriSatelliteStyle(config.esriKey!,await response.json() as ImageryMetadata);
 }
 const key=new URL(config.styleUrl).searchParams.get('key');
 return {maxZoom:19,style:{version:8,sources:{satellite:{type:'raster',url:`https://api.maptiler.com/tiles/satellite-v2/tiles.json?key=${encodeURIComponent(key!)}`,attribution:config.attribution}},layers:[{id:'satellite',type:'raster',source:'satellite'}]}};
}
