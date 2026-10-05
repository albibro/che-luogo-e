import { defineConfig } from 'vite';
import { readFile } from 'node:fs/promises';
import react from '@vitejs/plugin-react';
import { handleApi } from './worker';
export default defineConfig({plugins:[react(),{
 name:'local-data-api',configureServer(server){server.middlewares.use(async(req,res,next)=>{
  if(!req.url?.startsWith('/api/'))return next();
  const response=await handleApi(new Request(new URL(req.url,'http://localhost'),{method:req.method}),'istat',async path=>{
   try{return new Response(await readFile(new URL(`./public${path}`,import.meta.url),'utf8'),{headers:{'Content-Type':'application/json'}});}
   catch{return new Response(null,{status:404});}
  });
  res.statusCode=response.status;response.headers.forEach((value,key)=>res.setHeader(key,value));res.end(await response.text());
 });},
}],server:{host:'0.0.0.0',port:4173,allowedHosts:['terminal.local']},build:{chunkSizeWarningLimit:1200}});
