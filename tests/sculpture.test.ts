import {describe,it,expect} from 'vitest';
import {buildSculpture,type Sculpture} from '../src/voyage/sculpture';
import {flightPose,resumeTime} from '../src/voyage/flight';
import type {PaintingFrame} from '../src/birds/artworkPoetry';
const paper='#f7f4ec';
function painting(painted:(x:number,y:number)=>boolean,strong=(x:number)=>true):PaintingFrame{
  const width=48,height=48,pixels=new Uint8Array(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)pixels.set([...(painted(x,y)?strong(x)?[40,100,150]:[180,195,210]:[247,244,236]),255],(y*width+x)*4);
  return {width,height,pixels};
}
function closed(mesh:Sculpture){
  const edges=new Map<string,number>();let volume=0;
  for(let i=0;i<mesh.indices.length;i+=3){
    const ids=[...mesh.indices.slice(i,i+3)];expect(new Set(ids).size).toBe(3);
    for(let j=0;j<3;j++){const a=ids[j],b=ids[(j+1)%3],key=`${Math.min(a,b)}:${Math.max(a,b)}`;edges.set(key,(edges.get(key)??0)+1);}
    const [a,b,c]=ids.map(id=>[...mesh.positions.slice(id*3,id*3+3)]);
    volume+=(a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;
  }
  expect([...edges.values()].every(count=>count===2)).toBe(true);expect(volume).toBeGreaterThan(0);
}
describe('symmetric pigment sculpture',()=>{
  it('produces a truly closed shell with exact front/back symmetry and valid normals',()=>{
    const frame=painting((x,y)=>Math.hypot(x-24,y-24)<17),mesh=buildSculpture({frame,paper,marks:[],resolution:48});
    closed(mesh);expect(mesh.indices.length).toBeGreaterThan(1000);
    const points=new Set<string>();for(let i=0;i<mesh.positions.length;i+=3)points.add([...mesh.positions.slice(i,i+3)].map(v=>v.toFixed(5)).join(','));
    for(let i=0;i<mesh.positions.length;i+=3){
      const [x,y,z]=mesh.positions.slice(i,i+3);expect(points.has([x,y,-z].map(v=>(v===0?0:v).toFixed(5)).join(','))).toBe(true);
      expect(Math.hypot(...mesh.normals.slice(i,i+3))).toBeCloseTo(1,4);
    }
    expect(mesh.uvs.every(v=>v>=0&&v<=1)).toBe(true);
  });
  it('retains a white interior as a through-hole, not a filled cap or paper slab',()=>{
    const mesh=buildSculpture({frame:painting((x,y)=>{const d=Math.hypot(x-23.5,y-23.5);return d<18&&d>9;}),paper,marks:[],resolution:48});
    closed(mesh);
    for(let i=0;i<mesh.indices.length;i+=3){
      const [a,b,c]=[...mesh.indices.slice(i,i+3)].map(id=>[...mesh.positions.slice(id*3,id*3+2)]);
      const cross=(p:number[],q:number[])=>p[0]*q[1]-p[1]*q[0];
      const signs=[cross(a,b),cross(b,c),cross(c,a)];
      expect(signs.every(s=>s>1e-8)||signs.every(s=>s< -1e-8)).toBe(false);
    }
  });
  it('leaves separate pigment islands separate and thickens denser pigment',()=>{
    const mesh=buildSculpture({frame:painting((x,y)=>y>12&&y<35&&(x>4&&x<19||x>29&&x<44),x=>x<24),paper,marks:[],resolution:48});
    closed(mesh);expect(mesh.landmarks).toHaveLength(2);
    let left=0,right=0;
    for(let i=0;i<mesh.positions.length;i+=3){
      const x=mesh.positions[i],z=Math.abs(mesh.positions[i+2]);if(x<0)left=Math.max(left,z);else right=Math.max(right,z);
      expect(Math.abs(x)).toBeGreaterThan(.25);
    }
    expect(left).toBeGreaterThan(right*1.3);
  });
  it('anchors only painted bird samples to actual material, even when a gesture starts in a white hole',()=>{
    const mesh=buildSculpture({frame:painting((x,y)=>Math.hypot(x-23.5,y-23.5)>10&&Math.hypot(x-23.5,y-23.5)<18),paper,
      marks:[{bird:'mesange',point:{x:.5,y:.5},seed:1},{bird:'pie',point:{x:.1,y:.1},seed:2}],resolution:48});
    expect(mesh.sites.map(s=>s.bird)).toEqual(['mesange','pie']);
    mesh.sites.forEach(s=>expect(Math.hypot(s.position[0],s.position[1])).toBeGreaterThan(.5));
  });
  it('rejects empty paper and does not mutate the captured work',()=>{
    const frame=painting(()=>false),before=frame.pixels.slice();
    expect(()=>buildSculpture({frame,paper,marks:[]})).toThrow(/pigment/);expect(frame.pixels).toEqual(before);
  });
  it('colours closed cut edges from adjacent pigment rather than extruding a white paper rim',()=>{
    const frame=painting((x,y)=>Math.hypot(x-24,y-24)<17),mesh=buildSculpture({frame,paper,marks:[],resolution:24});
    for(let i=0;i<mesh.positions.length/3;i++)if(mesh.positions[i*3+2]===0){
      const x=Math.min(frame.width-1,Math.floor(mesh.uvs[i*2]*frame.width));
      const y=Math.min(frame.height-1,Math.floor((1-mesh.uvs[i*2+1])*frame.height));
      expect(frame.pixels[(y*frame.width+x)*4]).toBeLessThan(100);
    }
  });
});
it('rejoins the automatic flight on the manually viewed side instead of crossing the object',()=>{
  for(const position of [[0,0,-2],[2.4,0,-.1],[-2.4,0,.1],[.1,0,2]] as [number,number,number][]){
    const pose=flightPose(resumeTime(position,1.6),1.6,[[0,0,0]]);
    expect(Math.sign(pose.position[2])).toBe(Math.sign(position[2]));
    expect(pose.position[0]*position[0]+pose.position[2]*position[2]).toBeGreaterThan(0);
  }
});
it('visits front, sides and back continuously, keeping grazing passes outside the solid',()=>{
  const positions=Array.from({length:801},(_,i)=>flightPose(i/10,1.6,[[.6,.3,0],[-.5,-.4,0]]).position);
  expect(Math.min(...positions.map(p=>p[2]))).toBeLessThan(-.8);expect(Math.max(...positions.map(p=>p[0]))).toBeGreaterThan(2.5);
  expect(Math.min(...positions.map(p=>p[0]))).toBeLessThan(-2.5);
  positions.forEach((p,i)=>{expect(p.every(Number.isFinite)).toBe(true);if(Math.abs(p[2])<.4)expect(Math.abs(p[0])).toBeGreaterThan(1.6);
    if(i)expect(Math.hypot(...p.map((v,j)=>v-positions[i-1][j]))).toBeLessThan(.15);
  });
});
