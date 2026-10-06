import type { DataProvider } from '../domain/model';
async function get<T>(path:string, signal?:AbortSignal):Promise<T>{
 const response=await fetch(`/api/v1/${path}`,{signal,headers:{Accept:'application/json'}});
 if(!response.ok){const body=await response.json().catch(()=>({}));throw new Error(body.error??`API non disponibile (${response.status})`);}
 return (await response.json() as {data:T}).data;
}
export const httpProvider:DataProvider={
 id:'http',mode:'live',
 searchMunicipalities:(query,signal)=>get(`municipalities?q=${encodeURIComponent(query)}`,signal),
 getMunicipality:async(slug,signal)=>{
  const response=await fetch(`/api/v1/municipalities/${encodeURIComponent(slug)}`,{signal});
  if(response.status===404)return null;
  if(!response.ok)throw new Error('Scheda non disponibile');
  return (await response.json()).data;
 },
 getBoundary:async(slug,signal)=>{
  const r=await fetch(`/api/v1/municipalities/${encodeURIComponent(slug)}/geometry`,{signal});
  if(r.status===404)return null;
  if(!r.ok)throw new Error('Geometria non disponibile');
  return (await r.json()).data;
 },
 getIndicators:(slug,group,signal)=>get(`municipalities/${encodeURIComponent(slug)}/indicators/${group}`,signal),
 getClimate:(slug,signal)=>get(`municipalities/${encodeURIComponent(slug)}/climate`,signal),
 getSources:signal=>get('sources',signal),getStatus:signal=>get('status',signal),
};
