import type {Map as LibreMap} from 'maplibre-gl';
import type {BoundarySummary} from '../domain/model';
export const GLOBE_ZOOM=1.1;
// Camera-only actions: never replace a style or reset a map instance.
export function flyToGlobe(map:LibreMap,b:BoundarySummary,reduced:boolean){map.stop();map.flyTo({center:b.mapCenter,zoom:GLOBE_ZOOM,pitch:0,bearing:0,duration:reduced?0:1800});}
export function flyToMunicipality(map:LibreMap,b:BoundarySummary,reduced:boolean){map.stop();const box=b.bbox;map.fitBounds([[box[0],box[1]],[box[2],box[3]]],{padding:70,maxZoom:Math.min(14.5,map.getMaxZoom()),pitch:60,bearing:-20,duration:reduced?0:2100});}
export function shouldUseTerrain(zoom:number){return zoom>=10;}
