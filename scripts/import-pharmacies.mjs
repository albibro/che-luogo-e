// Explicit reviewed snapshot: no automatic URL guessing or download during builds.
// node scripts/import-pharmacies.mjs /absolute/download.json 2026-10-05 https://...json
import {readFile,writeFile,mkdir,rename,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
const [file,referenceDate,originalUrl]=process.argv.slice(2);
if(!file||!/^\d{4}-\d{2}-\d{2}$/.test(referenceDate)||!originalUrl?.startsWith('https://www.dati.salute.gov.it/'))throw new Error('Fornire file, data verificata e URL ufficiale');
const raw=await readFile(file),rows=JSON.parse(raw.toString('utf8'));
if(!Array.isArray(rows)||rows.length<1)throw new Error('Archivio vuoto o non valido');
const groups=new Map();
for(const r of rows){
 if(!/^\d{6}$/.test(r.cod_comune)||typeof r.cod_farmacia!=='string'||typeof r.data_inizio_validita!=='string'||typeof r.data_fine_validita!=='string')throw new Error('Schema ministeriale incompatibile');
 const province=r.cod_comune.slice(0,3);if(!groups.has(province))groups.set(province,{});
 const g=groups.get(province);(g[r.cod_comune]??=[]).push(r);
}
const sha=b=>createHash('sha256').update(b).digest('hex');const target=new URL('../public/data/farmacie/',import.meta.url);const staging=new URL('../public/data/farmacie-next/',import.meta.url);
await mkdir(staging,{recursive:true});const partitions={};
for(const [province,data] of groups){const text=JSON.stringify(data);partitions[province+'.json']=sha(text);await writeFile(new URL(province+'.json',staging),text);}
const manifest={sourceId:'salute',referenceDate,retrievedAt:new Date().toISOString(),originalUrl,sha256:sha(raw),license:'IODL 2.0',rows:rows.length,partitions};
await mkdir(new URL('../data/original/',import.meta.url),{recursive:true});await writeFile(new URL('../data/original/farmacie.json.gz',import.meta.url),gzipSync(raw));
await rm(target,{recursive:true,force:true});await rename(staging,target);
await writeFile(new URL('../server/data/pharmacies-manifest.json',import.meta.url),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({rows:rows.length,partitions:groups.size,sha256:manifest.sha256}));
