import type {PaintingFrame} from '../birds/artworkPoetry';
import type {BirdMark} from '../birds/haiku';
import type {BirdId} from '../birds/catalog';

export type Vec3=[number,number,number];
export interface SoundSite {bird:BirdId;position:Vec3}
export interface Sculpture {
  positions:Float32Array;normals:Float32Array;uvs:Float32Array;indices:Uint32Array;
  radius:number;sites:SoundSite[];landmarks:Vec3[];
}
export interface SculptureInput {frame:PaintingFrame;paper:string;marks:readonly BirdMark[];resolution?:number}

/** A closed double-sided shell of the actual pigment mask. Front and back
 * share contour vertices: both outside contours AND white holes are sealed.
 * Interior vertices are exact +/- height pairs, never a paper slab or a sphere.
 */
export function buildSculpture({frame,paper,marks,resolution=176}:SculptureInput):Sculpture {
  const {width,height,pixels}=frame;
  if(width<1||height<1||pixels.length!==width*height*4)throw new Error('Cette peinture ne peut pas encore devenir une sculpture.');
  const limit=Math.max(24,Math.min(240,Math.round(resolution)));
  const shrink=limit/Math.max(width,height);
  const nx=Math.max(2,Math.round(width*shrink)),ny=Math.max(2,Math.round(height*shrink)),w=nx+2,h=ny+2,n=w*h;
  const density=new Float32Array(n),mask=new Uint8Array(n),paintU=new Float32Array(n),paintV=new Float32Array(n);
  const white=[1,3,5].map(i=>parseInt(paper.slice(i,i+2),16));
  const sample=(x:number,y:number)=>{
    x=Math.max(0,Math.min(width-1,x));y=Math.max(0,Math.min(height-1,y));
    const i=(y*width+x)*4;if(pixels[i+3]<128)return 0;
    return Math.max(0,(white[0]-pixels[i])/255,(white[1]-pixels[i+1])/255,(white[2]-pixels[i+2])/255);
  };
  let x0=w,y0=h,x1=0,y1=0,count=0;
  // Max pigment per footprint retains thin branches. The threshold excludes
  // the cotton's slight colour variation; the white paper is NOT geometry.
  for(let y=1;y<=ny;y++)for(let x=1;x<=nx;x++){
    let amount=0,best=-1,bestX=0,bestY=0;
    const remember=(px:number,py:number)=>{const value=sample(px,py);if(value>best){best=value;bestX=Math.max(0,Math.min(width-1,px));bestY=Math.max(0,Math.min(height-1,py));}return value;};
    if(shrink>=1){
      // Reconstruct low-resolution captures continuously, rather than turning
      // each source pixel into a large square extrusion.
      const sx=(x-.5)*width/nx-.5,sy=(y-.5)*height/ny-.5,xx=Math.floor(sx),yy=Math.floor(sy),u=sx-xx,v=sy-yy;
      amount=remember(xx,yy)*(1-u)*(1-v)+remember(xx+1,yy)*u*(1-v)+remember(xx,yy+1)*(1-u)*v+remember(xx+1,yy+1)*u*v;
    }else{
      let total=0,samples=0;
      for(let py=Math.floor((y-1)*height/ny);py<Math.ceil(y*height/ny);py++)for(let px=Math.floor((x-1)*width/nx);px<Math.ceil(x*width/nx);px++){
        const value=remember(px,py);amount=Math.max(amount,value);total+=value;samples++;
      }
      amount=.55*amount+.45*total/Math.max(1,samples);
    }
    const i=y*w+x;density[i]=Math.max(0,amount);paintU[i]=(bestX+.5)/width;paintV[i]=1-(bestY+.5)/height;
    if(amount>=17/255){mask[i]=1;count++;x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
  }
  if(!count)throw new Error('Il faut une trace de pigment visible pour faire naître la sculpture.');
  const distance=(target:number)=>{
    const d=new Float32Array(n);for(let i=0;i<n;i++)d[i]=mask[i]===target?0:1e6;
    const relax=(i:number,j:number,c:number)=>{if(j>=0&&j<n)d[i]=Math.min(d[i],d[j]+c);};
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const i=y*w+x;if(x)relax(i,i-1,1);if(y)relax(i,i-w,1);
      if(x&&y)relax(i,i-w-1,Math.SQRT2);if(x+1<w&&y)relax(i,i-w+1,Math.SQRT2);
    }
    for(let y=h-1;y>=0;y--)for(let x=w-1;x>=0;x--){
      const i=y*w+x;if(x+1<w)relax(i,i+1,1);if(y+1<h)relax(i,i+w,1);
      if(x+1<w&&y+1<h)relax(i,i+w+1,Math.SQRT2);if(x&&y+1<h)relax(i,i+w-1,Math.SQRT2);
    }
    return d;
  };
  const outside=distance(0),inside=distance(1),signed=new Float32Array(n),heights=new Float32Array(n);
  const unit=3/Math.max(x1-x0+2,y1-y0+2),cx=(x0+x1)/2,cy=(y0+y1)/2;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=y*w+x;
    let d=Math.abs(outside[i]-inside[i])-.5;
    // Subpixel intersections follow the actual pigment opacity. Binary
    // half-pixel contours were too stair-stepped when viewed close-up in 3D.
    if(d<1.1){
      d=Infinity;
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        const xx=x+dx,yy=y+dy;if(xx<0||xx>=w||yy<0||yy>=h)continue;
        const j=yy*w+xx;if(mask[j]===mask[i])continue;
        const a=Math.abs(density[i]-17/255),b=Math.abs(density[j]-17/255);
        d=Math.min(d,Math.hypot(dx,dy)*a/Math.max(1e-8,a+b));
      }
      if(!Number.isFinite(d))d=.5;
    }
    signed[i]=(mask[i]?1:-1)*Math.max(.02,d)*unit;
    if(!mask[i])continue;
    // Smooth optical density before extrusion: grain colours the surface, but
    // cannot become a forest of spikes or a square embossed height texture.
    let sum=0,weight=0;
    for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
      const xx=x+dx,yy=y+dy;if(xx<0||xx>=w||yy<0||yy>=h)continue;
      const q=1/(1+dx*dx+dy*dy);sum+=density[yy*w+xx]*q;weight+=q;
    }
    heights[i]=(.018+.30*Math.pow(sum/weight,.85))*Math.sqrt(1-Math.exp(-signed[i]/.065));
  }
  const pos:number[]=[],uv:number[]=[],index:number[]=[],vertices=new Map<string,number>();
  const vertex=(key:string,x:number,y:number,z:number,u:number,v:number)=>{
    const found=vertices.get(key);if(found!==undefined)return found;
    const id=pos.length/3;vertices.set(key,id);pos.push((x-cx)*unit,(cy-y)*unit,z);
    uv.push(Math.max(0,Math.min(1,u)),Math.max(0,Math.min(1,v)));return id;
  };
  type V={key:string;x:number;y:number;z:number;u:number;v:number;boundary:boolean};
  const grid=(i:number):V=>({key:`v${i}`,x:i%w,y:Math.floor(i/w),z:heights[i],
    u:outside[i]<=2.1?paintU[i]:(i%w-.5)/nx,v:outside[i]<=2.1?paintV[i]:1-(Math.floor(i/w)-.5)/ny,boundary:false});
  const cross=(a:number,b:number):V=>{
    const t=signed[a]/(signed[a]-signed[b]),p=grid(a),q=grid(b);
    const pigment=mask[a]?a:b;
    // At a cut contour, sample the adjacent pigment, never the white paper
    // just outside it. Otherwise the closed edge looks like a thick white rim.
    return {key:`e${Math.min(a,b)}:${Math.max(a,b)}`,x:p.x+(q.x-p.x)*t,y:p.y+(q.y-p.y)*t,z:0,u:paintU[pigment],v:paintV[pigment],boundary:true};
  };
  const face=(a:number,b:number,c:number)=>{
    const source=[a,b,c],polygon:V[]=[];
    for(let k=0;k<3;k++){
      const p=source[k],q=source[(k+1)%3];
      if(mask[p])polygon.push(grid(p));if(mask[p]!==mask[q])polygon.push(cross(p,q));
    }
    if(polygon.length<3)return;
    const front=polygon.map(v=>vertex(v.key+(v.boundary?'':'+'),v.x,v.y,v.z,v.u,v.v));
    const back=polygon.map(v=>vertex(v.key+(v.boundary?'':'-'),v.x,v.y,-v.z,v.u,v.v));
    // Image Y points down: reverse front winding, preserve it on the back.
    for(let k=1;k+1<front.length;k++){index.push(front[0],front[k+1],front[k]);index.push(back[0],back[k],back[k+1]);}
  };
  for(let y=0;y<h-1;y++)for(let x=0;x<w-1;x++){
    const a=y*w+x,b=a+1,c=a+w,d=c+1;face(a,b,d);face(a,d,c);
  }
  // Gently round only contour chains, within roughly one sampling cell.
  // Connectivity and through-holes are unchanged, and shared zero-Z edges
  // preserve exact front/back symmetry instead of smoothing away thin branches.
  const contour=new Map<number,Set<number>>();
  for(let i=0;i<index.length;i+=3)for(let j=0;j<3;j++){
    const a=index[i+j],b=index[i+(j+1)%3];if(pos[a*3+2]!==0||pos[b*3+2]!==0)continue;
    if(!contour.has(a))contour.set(a,new Set());if(!contour.has(b))contour.set(b,new Set());contour.get(a)!.add(b);contour.get(b)!.add(a);
  }
  for(let pass=0;pass<2;pass++){
    const updates:{id:number;x:number;y:number}[]=[];
    for(const [id,neighbors] of contour){if(neighbors.size!==2)continue;const [a,b]=[...neighbors];updates.push({id,x:pos[id*3]*.5+(pos[a*3]+pos[b*3])*.25,y:pos[id*3+1]*.5+(pos[a*3+1]+pos[b*3+1])*.25});}
    for(const p of updates){pos[p.id*3]=p.x;pos[p.id*3+1]=p.y;}
  }
  const positions=new Float32Array(pos),normals=new Float32Array(pos.length);
  for(let i=0;i<index.length;i+=3){
    const a=index[i]*3,b=index[i+1]*3,c=index[i+2]*3;
    const ax=pos[b]-pos[a],ay=pos[b+1]-pos[a+1],az=pos[b+2]-pos[a+2];
    const bx=pos[c]-pos[a],by=pos[c+1]-pos[a+1],bz=pos[c+2]-pos[a+2];
    const normal=[ay*bz-az*by,az*bx-ax*bz,ax*by-ay*bx];
    for(const p of [a,b,c])for(let j=0;j<3;j++)normals[p+j]+=normal[j];
  }
  for(let i=0;i<normals.length;i+=3){const length=Math.hypot(normals[i],normals[i+1],normals[i+2])||1;for(let j=0;j<3;j++)normals[i+j]/=length;}
  const occupied:number[]=[];for(let i=0;i<n;i++)if(mask[i])occupied.push(i);
  const position=(i:number):Vec3=>[(i%w-cx)*unit,(cy-Math.floor(i/w))*unit,heights[i]];
  const nearest=(x:number,y:number)=>{
    let best=occupied[0],distance=Infinity;
    for(const i of occupied){const d=(i%w-x)**2+(Math.floor(i/w)-y)**2;if(d<distance){distance=d;best=i;}}
    return best;
  };
  const sites:SoundSite[]=[];
  for(const mark of marks){
    const p=position(nearest(mark.point.x*nx+.5,mark.point.y*ny+.5));
    if(sites.filter(s=>s.bird===mark.bird).length>=3||sites.some(s=>s.bird===mark.bird&&Math.hypot(s.position[0]-p[0],s.position[1]-p[1])<.3))continue;
    sites.push({bird:mark.bird,position:[p[0],p[1],0]});
  }
  // Visit every sizeable painted island, including disconnected components.
  const seen=new Uint8Array(n),islands:{size:number;point:Vec3}[]=[];
  for(const root of occupied){
    if(seen[root])continue;const queue=[root];seen[root]=1;let best=root;
    for(let q=0;q<queue.length;q++){
      const i=queue[q];if(heights[i]>heights[best])best=i;
      for(const j of [i-1,i+1,i-w,i+w])if(j>=0&&j<n&&mask[j]&&!seen[j]){seen[j]=1;queue.push(j);}
    }
    islands.push({size:queue.length,point:position(best)});
  }
  const landmarks=islands.sort((a,b)=>b.size-a.size).slice(0,12).map(i=>i.point);
  let radius=0;for(let i=0;i<pos.length;i+=3)radius=Math.max(radius,Math.hypot(pos[i],pos[i+1],pos[i+2]));
  return {positions,normals,uvs:new Float32Array(uv),indices:new Uint32Array(index),radius,sites,landmarks};
}
