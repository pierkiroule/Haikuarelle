"""GPU paper regression (numpy, Pillow, moderngl + EGL required).
Compiles the actual paper shader. Fails on a relief locked to 2x2 GPU quads,
and checks that subpixel grain is filtered without flattening broad cotton.
Use --source to verify an older shaders.ts; diagnostic crops have boosted contrast.
"""
import re,os,json,argparse
from pathlib import Path
import numpy as np
import moderngl
from PIL import Image
parser=argparse.ArgumentParser();parser.add_argument('--source',default='src/vendor/pigment-drift/paint/shaders.ts');args=parser.parse_args()
s=Path(args.source).read_text()
def block(name):
 start=s.index('const '+name+' =');return re.search(r'`([\s\S]*?)`',s[start:]).group(1)
ctx=moderngl.create_standalone_context(backend='egl',require=330)
vertex='#version 330\nin vec2 aPos;void main(){gl_Position=vec4(aPos,0,1);}'
fragment=''.join(block(n) for n in ['HEAD','NOISE','MAPPING','COTTON_NOISE','PAPER']).replace('#version 300 es','#version 330').replace('precision highp float;','').replace('precision highp sampler2D;','')
p=ctx.program(vertex_shader=vertex,fragment_shader=fragment)
b=ctx.buffer(np.array([-1,-1,1,-1,-1,1,1,1],dtype='f4').tobytes());vao=ctx.simple_vertex_array(p,b,'aPos')
size=512;t=ctx.texture((size,size),4,dtype='f4');f=ctx.framebuffer([t]);f.use()
p['uMap'].value=(1,1,0,0);p['uUnit'].value=1024;p['uSeedOff'].value=(3.7,8.1)
vao.render(moderngl.TRIANGLE_STRIP)
a=np.frombuffer(t.read(),dtype='f4').reshape(size,size,4)
result={}
for c,name in [(1,'pigment_grain'),(2,'paper_light'),(3,'paper_grain')]:
 v=a[:,:,c];d=v[0::2,0::2]-v[0::2,1::2]-v[1::2,0::2]+v[1::2,1::2]
 full=v[:-1,:-1]-v[:-1,1:]-v[1:,:-1]+v[1:,1:]
 result[name]={'quad_rms':float(np.sqrt(np.mean(d*d))),'all_rms':float(np.sqrt(np.mean(full*full)))}
 u=v[128:224,128:224];u=(u-u.min())/max(float(u.max()-u.min()),1e-8);Image.fromarray((u*255).astype('uint8')).resize((576,576),Image.Resampling.NEAREST).save('/tmp/'+os.getenv('PROBE_TAG','paper')+'-'+name+'.png')
light=result['paper_light'];ratio=light['quad_rms']/max(light['all_rms'],1e-12)
assert .6<ratio<1.4, f'Embossed GPU quad pattern: within-quad / all-pixel difference = {ratio}'
p['uUnit'].value=128;vao.render(moderngl.TRIANGLE_STRIP)
coarse=np.frombuffer(t.read(),dtype='f4').reshape(size,size,4)
fine_std=float(coarse[:,:,1].std());body_std=float(coarse[:,:,3].std())
assert fine_std<1e-5, f'Unresolved fine grain must be filtered, got std={fine_std}'
assert body_std>1e-5, 'Filtering must retain the broad cotton variation'
print(json.dumps({'channels':result,'quadRatio':ratio,'coarseFineStd':fine_std,'coarseBodyStd':body_std,'status':'PASS'}))
