import { nationalProvider } from '../server/national';
interface Env { ASSETS: { fetch(request:Request):Promise<Response> }; DATA_PROVIDER?:string }
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export async function handleApi(request:Request,providerId='istat',readAsset?:(path:string)=>Promise<Response>):Promise<Response>{
 const url=new URL(request.url);const path=url.pathname.replace(/\/$/,'');
 if(request.method!=='GET')return json({error:'Metodo non consentito'},405);
 if(providerId!=='istat')return json({error:'Provider non disponibile'},503);
 try{
  if(path==='/api/v1/municipalities'){
   const query=url.searchParams.get('q')??'';if(query.length>100)return json({error:'Ricerca troppo lunga'},400);
   return json({mode:'live',data:await nationalProvider.searchMunicipalities(query,request.signal)});
  }
  if(path==='/api/v1/status')return json({data:await nationalProvider.getStatus()});
  if(path==='/api/v1/sources')return json({data:await nationalProvider.getSources()});
  const geometryMatch=path.match(/^\/api\/v1\/municipalities\/([a-z0-9-]+)\/geometry$/);
  if(geometryMatch){
   const report=await nationalProvider.getMunicipality(geometryMatch[1],request.signal);
   if(!report||!report.boundary)return json({error:report?.boundaryMissingReason??'Comune non trovato'},404);
   if(!readAsset)return json({error:'Archivio geometrie non disponibile'},503);
   const asset=await readAsset(`/geodata/istat-2026/${report.municipality.id}.json`);
   if(!asset.ok)return json({error:'Geometria non caricabile'},503);
   const feature=await asset.json();return json({data:{feature,provenance:report.boundary}});
  }
  const match=path.match(/^\/api\/v1\/municipalities\/([a-z0-9-]+)$/);
  if(match){const data=await nationalProvider.getMunicipality(match[1],request.signal);return data?json({mode:'live',data}):json({error:'Comune non trovato'},404);}
  return json({error:'Endpoint non disponibile'},404);
 }catch{return json({error:'Provider non disponibile'},503);}
}
export default {
 async fetch(request:Request,env:Env):Promise<Response>{
  const url=new URL(request.url);
  if(url.pathname.startsWith('/api/'))return handleApi(request,env.DATA_PROVIDER,path=>env.ASSETS.fetch(new Request(new URL(path,url))));
  if(request.method!=='GET'&&request.method!=='HEAD')return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD'}});
  const match=url.pathname.match(/^\/comuni\/([a-z0-9-]+)\/?$/);
  if(match){
   const report=await nationalProvider.getMunicipality(match[1]);
   if(report){
    if(match[1]!==report.municipality.slug)return Response.redirect(new URL(`/comuni/${report.municipality.slug}${url.search}`,url),308);
    const page=await env.ASSETS.fetch(new Request(new URL('/comuni/_shell/',url)));
    return new Response(request.method==='HEAD'?null:page.body,{status:page.status,headers:page.headers});
   }
  }
  const asset=match?new Response(null,{status:404}):await env.ASSETS.fetch(request);
  if(asset.status===404){const page=await env.ASSETS.fetch(new Request(new URL('/404.html',url)));return new Response(request.method==='HEAD'?null:page.body,{status:404,headers:page.headers});}
  return asset;
 }
};
