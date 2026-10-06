import type {IndicatorBundle,IndicatorGroup} from './model';
export type GroupState={data:IndicatorBundle|null;loading:boolean;error:string};
export const groups:IndicatorGroup[]=['territory','services','nature','air','income','soil','schools','broadband'];
export const groupLabels:Record<IndicatorGroup,string>={territory:'Territorio, rischi e demografia',services:'Farmacie e dispensari',nature:'Segnalazioni naturalistiche',air:'Previsioni sulla qualità dell’aria',income:'Redditi dichiarati',soil:'Consumo di suolo',schools:'Scuole e istruzione',broadband:'Copertura fibra FTTH'};
export const freshGroups=()=>Object.fromEntries(groups.map(g=>[g,{data:null,loading:true,error:''}])) as Record<IndicatorGroup,GroupState>;
export function downloadJson(text:string,filename:string){const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
