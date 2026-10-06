import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import type {Map} from 'maplibre-gl';
import {createMapProvider,esriSatelliteStyle,loadSatelliteStyle,type ImageryMetadata} from '../src/maps/provider';
import {flyToGlobe,flyToMunicipality,shouldUseTerrain} from '../src/maps/navigation';
import {getBoundarySummary} from '../server/national';
const realMetadata=JSON.parse(readFileSync(new URL('./fixtures/esri-world-imagery-metadata.json',import.meta.url),'utf8')) as ImageryMetadata;
// The credential below is an inert test input, never sent to a service or placed in the app.
const testToken='TEST_ONLY_NOT_A_CREDENTIAL';
test('Esri imagery uses authenticated tiles and retains real provider credits',()=>{
 const {style,maxZoom}=esriSatelliteStyle(testToken,realMetadata);const source=style.sources.satellite as any;
 assert.equal(maxZoom,19);assert.ok(source.tiles[0].includes('ibasemaps-api.arcgis.com'));assert.ok(source.tiles[0].includes('token='+testToken));assert.equal(source.tileSize,realMetadata.tileInfo.rows);
 assert.ok(source.attribution.includes('Powered by'));assert.ok(source.attribution.includes('Earthstar'));assert.ok(source.attribution.includes('Vantor'));assert.ok(!JSON.stringify(style).includes('nasa.gov'));
});
test('Missing key, denied access and missing credit metadata fail explicitly',async()=>{
 assert.throws(()=>esriSatelliteStyle('',realMetadata));
 const denied=structuredClone(realMetadata);denied.error={code:498};assert.throws(()=>esriSatelliteStyle(testToken,denied));
 const noCredits=structuredClone(realMetadata);noCredits.copyrightText='';assert.throws(()=>esriSatelliteStyle(testToken,noCredits));
 let calls=0;const fetcher=(async()=>{calls++;throw new Error('Should not reach network');}) as typeof fetch;
 await assert.rejects(loadSatelliteStyle(createMapProvider({})!,new AbortController().signal,fetcher),/configurare/);assert.equal(calls,0);
 const html=structuredClone(realMetadata);html.copyrightText='<script>bad()</script>';assert.ok((esriSatelliteStyle(testToken,html).style.sources.satellite as any).attribution.includes('&lt;script&gt;'));
});
test('Globe and local camera moves never replace the style or switch satellite to streets',()=>{
 const actions:{name:string;options?:any}[]=[];
 const m={stop:()=>actions.push({name:'stop'}),flyTo:(options:any)=>actions.push({name:'flyTo',options}),fitBounds:(_bounds:any,options:any)=>actions.push({name:'fitBounds',options}),getMaxZoom:()=>19} as unknown as Map;
 const b=getBoundarySummary('013046')!;flyToMunicipality(m,b,false);flyToGlobe(m,b,false);
 assert.deepEqual(actions.map(a=>a.name),['stop','fitBounds','stop','flyTo']);assert.ok(actions[1].options.maxZoom>8);assert.ok(actions[3].options.zoom<2);
 flyToGlobe(m,b,true);assert.equal(actions.at(-1)!.options.duration,0);
 assert.equal(shouldUseTerrain(2),false);assert.equal(shouldUseTerrain(13),true);
});
