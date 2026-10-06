import type { OriginalResponse } from '../src/domain/model';
export const checksum=async(text:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))).map(b=>b.toString(16).padStart(2,'0')).join('');
type ReaderState={memory:Map<string,{data:OriginalResponse;expires:number}>;pending:Map<string,Promise<OriginalResponse>>};
const states=new WeakMap<typeof fetch,ReaderState>();
// Reuse a bounded cache across requests; injected fetchers remain isolated in tests.
export function createJsonReader(fetcher:typeof fetch=fetch,cache?:Cache){
 let state=states.get(fetcher);if(!state){state={memory:new Map(),pending:new Map()};states.set(fetcher,state);}
 const {memory,pending}=state;
 return async function read(url:string,validate:(p:any)=>void,ttl=86400,publicUrl=url):Promise<OriginalResponse>{
  const hit=memory.get(url);if(hit&&hit.expires>Date.now()){validate(hit.data.payload);return hit.data;}
  if(pending.has(url)){const data=await pending.get(url)!;validate(data.payload);return data;}
  const task=(async()=>{
   // Hash prevents credentials from appearing in cache keys. Only redacted URL is persisted.
   const key=new Request('https://che-luogo-e-cache.invalid/indicators-v1/'+await checksum(url));
   const cached=await cache?.match(key).catch(()=>undefined);
   let data:OriginalResponse;
   if(cached){data=await cached.json() as OriginalResponse;validate(data.payload);}
   else{
    const r=await fetcher(url,{signal:AbortSignal.timeout(20000),headers:{Accept:'application/json'}});
    if(!r.ok)throw new Error(`Fonte non disponibile (HTTP ${r.status}).`);
    const text=await r.text();if(text.length>2_000_000)throw new Error('Risposta troppo grande');
    const payload=JSON.parse(text);validate(payload);
    data={payload,text,url:publicUrl,checksum:await checksum(text),retrievedAt:new Date().toISOString()};
    await cache?.put(key,Response.json(data,{headers:{'Cache-Control':`public, max-age=${ttl}`}})).catch(()=>{});
   }
   if(memory.size>=100)memory.delete(memory.keys().next().value!);
   memory.set(url,{data,expires:Date.now()+ttl*1000});return data;
  })();pending.set(url,task);try{return await task;}finally{pending.delete(url);}
 };
}
