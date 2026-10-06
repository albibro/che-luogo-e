import type { BoundaryFeature } from '../domain/model';
// Mercator projection of actual source vertices, not an illustrative silhouette.
export function boundarySvg(feature:BoundaryFeature):string {
 const polygons=feature.geometry.type==='Polygon'?[feature.geometry.coordinates]:feature.geometry.coordinates;
 const project=([lon,lat]:number[])=>[lon*Math.PI/180,Math.log(Math.tan(Math.PI/4+lat*Math.PI/360))];
 const points=polygons.flat(2).map(project);
 let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
 for(const [x,y] of points){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
 const scale=Math.min(480/(maxX-minX),260/(maxY-minY));
 const cx=(minX+maxX)/2,cy=(minY+maxY)/2;
 return polygons.flatMap(polygon=>polygon.map(ring=>ring.map((p,i)=>{const [x,y]=project(p);return `${i?'L':'M'}${(300+(x-cx)*scale).toFixed(3)},${(190-(y-cy)*scale).toFixed(3)}`;}).join(' ')+' Z')).join(' ');
}
