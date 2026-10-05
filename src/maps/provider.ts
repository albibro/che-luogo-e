export interface MapProvider {id:string;styleUrl:string;terrain:{url:string;encoding:'mapbox'|'terrarium';tileSize:number}|null;attribution:string}
// Browser tile keys, where used, are public and must be origin-restricted.
export function createMapProvider(config:{provider?:string;key?:string;usage?:string}):MapProvider|null {
 const selected=config.provider??'openfreemap';
 if(selected==='disabled')return null;
 if(selected==='openfreemap')return {
  id:'openfreemap',styleUrl:'https://tiles.openfreemap.org/styles/liberty',
  terrain:{url:'https://tiles.mapterhorn.com/tilejson.json',encoding:'terrarium',tileSize:512},
  attribution:'<a href="https://openfreemap.org">OpenFreeMap</a> · <a href="https://openmaptiles.org">© OpenMapTiles</a> · <a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a> · <a href="https://mapterhorn.com/attribution/">© Mapterhorn e fonti DEM</a>',
 };
 if(selected!=='maptiler'||!config.key||!['research-development','commercial-plan-verified'].includes(config.usage??''))throw new Error('Cartografia non configurata o condizioni non verificate');
 const key=encodeURIComponent(config.key);
 return {id:'maptiler',styleUrl:`https://api.maptiler.com/maps/streets-v4/style.json?key=${key}`,terrain:{url:`https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${key}`,encoding:'mapbox',tileSize:256},attribution:'<a href="https://www.maptiler.com/copyright/">© MapTiler</a> · <a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a>'};
}
