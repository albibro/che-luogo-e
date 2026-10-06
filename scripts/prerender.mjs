import { createServer } from 'vite';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
// Prerender navigation and route shells; noindex until complete municipal content is available.
const routes=[['/confronta','Confronta comuni | Che luogo è?','dist/confronta/index.html'],['/','Che luogo è? — Conosci il tuo prossimo luogo','dist/index.html'],['/comuni/_shell','Scheda comune | Che luogo è?','dist/comuni/_shell/index.html'],['/fonti-e-metodologia','Fonti e metodologia | Che luogo è?','dist/fonti-e-metodologia/index.html'],['/404','Pagina non trovata | Che luogo è?','dist/404.html']];
const template=await readFile('dist/index.html','utf8');
const server=await createServer({cacheDir:'node_modules/.vite-prerender',server:{middlewareMode:true,hmr:false,ws:false},appType:'custom'});
try{const {render}=await server.ssrLoadModule('/src/entry-server.tsx');for(const [url,title,file] of routes){const html=template.replace('<div id="root"></div>',`<div id="root">${render(url)}</div>`).replace(/<title>.*?<\/title>/,`<title>${title}</title>`);await mkdir(dirname(file),{recursive:true});await writeFile(file,html);console.log(`Prerendered ${url}`);}}finally{await server.close();}
