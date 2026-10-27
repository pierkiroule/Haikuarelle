"""Real water-tool shader: a wet shoreline should have broad organic lobes,
not the pigment brush's fine, cell-sized serrations. --source checks old code.
"""
import re,argparse,json
from pathlib import Path
import numpy as np
import moderngl
parser=argparse.ArgumentParser();parser.add_argument('--source',default='src/vendor/pigment-drift/paint/shaders.ts');args=parser.parse_args()
s=Path(args.source).read_text()
def block(name):return re.search(r'`([\s\S]*?)`',s[s.index('const '+name+' ='):]).group(1)
ctx=moderngl.create_standalone_context(backend='egl',require=330)
fragment=''.join(block(n) for n in ['HEAD','NOISE','COTTON_NOISE','SEGMENTS','FIELD_STEP']).replace('#version 300 es','#version 330').replace('precision highp float;','').replace('precision highp sampler2D;','')
p=ctx.program(vertex_shader='#version 330\nin vec2 aPos;void main(){gl_Position=vec4(aPos,0,1);}',fragment_shader=fragment)
size=256;empty=np.zeros((size,size,4),dtype='f4');src=ctx.texture((size,size),4,empty.tobytes(),dtype='f4');src.filter=(moderngl.LINEAR,moderngl.LINEAR);src.repeat_x=False;src.repeat_y=False;src.use(0)
vel=ctx.texture((size,size),2,dtype='f4');vel.use(1)
out=ctx.texture((size,size),4,dtype='f4');f=ctx.framebuffer([out]);f.use()
for name,value in {'uField':0,'uVel':1,'uSize':(size,size),'uUnit':size,'uDt':1/30,'uDryKeep':1.,'uMaterial':1.,'uSegCount':1,'uSeedOff':(3.7,8.1),'uBreathShape':(1.,0.)}.items():
 if name in p:p[name].value=value
seg=np.zeros((16,4),dtype='f4');seg[0]=[128,128,128,128];p['uSeg'].write(seg.tobytes());params=np.zeros((16,4),dtype='f4');radius=size*.12;params[0]=[radius,1,.45,513];p['uSegP'].write(params.tobytes())
b=ctx.buffer(np.array([-1,-1,1,-1,-1,1,1,1],dtype='f4').tobytes());vao=ctx.simple_vertex_array(p,b,'aPos');vao.render(moderngl.TRIANGLE_STRIP)
a=np.frombuffer(out.read(),dtype='f4').reshape(size,size,4);water=a[:,:,1]
angles=np.arange(1024)*2*np.pi/1024
# Bilinear read in texel-center coordinates, matching the moisture guide.
def sample(r):
 x=128+np.cos(angles)*r-.5;y=128+np.sin(angles)*r-.5;ix=np.floor(x).astype(int);iy=np.floor(y).astype(int);fx=x-ix;fy=y-iy
 return (water[iy,ix]*(1-fx)+water[iy,ix+1]*fx)*(1-fy)+(water[iy+1,ix]*(1-fx)+water[iy+1,ix+1]*fx)*fy
lo=np.zeros(1024);hi=np.ones(1024)*radius*2
for _ in range(20):
 mid=(lo+hi)/2;wet=sample(mid)>.006;lo=np.where(wet,mid,lo);hi=np.where(wet,hi,mid)
r=(lo+hi)/2;spectrum=np.fft.rfft(r-r.mean())/len(r);roughness=float(np.sqrt(np.sum(np.abs(spectrum[24:])**2)*2)/radius)
result={'fineShoreRoughness':roughness,'radiusRange':[float(r.min()/radius),float(r.max()/radius)],'water':float(water.sum()),'pigment':float(a[:,:,0].sum())};print(json.dumps(result),flush=True)
assert roughness<.008,result
assert result['water']>0 and result['pigment']==0,result
assert np.isfinite(a).all()
