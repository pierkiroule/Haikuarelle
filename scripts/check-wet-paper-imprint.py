"""Actual PAPER + RENDER shaders: fresh wash must not inherit dry paper embossing.
Requires numpy/moderngl (EGL). --source can verify the previous shader.
"""
import re,argparse,json
from pathlib import Path
import numpy as np
import moderngl
parser=argparse.ArgumentParser();parser.add_argument('--source',default='src/vendor/pigment-drift/paint/shaders.ts');args=parser.parse_args();s=Path(args.source).read_text()
def block(name):return re.search(r'`([\s\S]*?)`',s[s.index('const '+name+' ='):]).group(1)
def glsl(names):return ''.join(block(n) for n in names).replace('#version 300 es','#version 330').replace('precision highp float;','').replace('precision highp sampler2D;','')
ctx=moderngl.create_standalone_context(backend='egl',require=330);vertex='#version 330\nin vec2 aPos;void main(){gl_Position=vec4(aPos,0,1);}'
b=ctx.buffer(np.array([-1,-1,1,-1,-1,1,1,1],dtype='f4').tobytes());size=512
paper=ctx.texture((size,size),4,dtype='f4');paper.filter=(moderngl.LINEAR,moderngl.LINEAR);f=ctx.framebuffer([paper]);f.use();p=ctx.program(vertex_shader=vertex,fragment_shader=glsl(['HEAD','NOISE','MAPPING','COTTON_NOISE','PAPER']))
for name,value in {'uMap':(1,1,0,0),'uUnit':1024.,'uSeedOff':(3.7,8.1),'uPx':1.}.items():
 if name in p:p[name].value=value
ctx.simple_vertex_array(p,b,'aPos').render(moderngl.TRIANGLE_STRIP)
r=ctx.program(vertex_shader=vertex,fragment_shader=glsl(['HEAD','MAPPING','HEIGHT','RENDER']));out=ctx.texture((size,size),4,dtype='f4');f=ctx.framebuffer([out]);f.use()
field=ctx.texture((8,8),4,dtype='f4');field.filter=(moderngl.LINEAR,moderngl.LINEAR);field.repeat_x=False;field.repeat_y=False
flat=ctx.texture((8,8),4,np.zeros((8,8,4),dtype='f4').tobytes(),dtype='f4');flat.filter=(moderngl.LINEAR,moderngl.LINEAR)
field.use(0);paper.use(1);flat.use(2)
for name,value in {'uField':0,'uPaperTex':1,'uFlow0':2,'uFlow1':2,'uFlow2':2,'uDryingTex':2,'uMap':(8/size,8/size,0,0),'uUnit':8.,'uFieldSize':(8,8),'uRes':(size,size),'uPaper':(.93,.90,.84),'uDetail':1.,'uOptical':1.,'uTexture':.84,'uLayers':6,'uDensity':.83}.items():
 if name in r:r[name].value=value
vao=ctx.simple_vertex_array(r,b,'aPos');result={}
for name,wet in [('wet',.45),('settling',.04),('dry',0.)]:
 a=np.zeros((8,8,4),dtype='f4');a[:]=[.22,wet,.044,.011];field.write(a.tobytes());vao.render(moderngl.TRIANGLE_STRIP)
 rgb=np.frombuffer(out.read(),dtype='f4').reshape(size,size,4)[:,:,:3];lum=rgb.mean(axis=2);result[name]={'std':float(lum.std()),'mean':float(lum.mean())}
result['wetToDryGrain']=result['wet']['std']/result['dry']['std'];print(json.dumps(result),flush=True)
assert result['wetToDryGrain']<.3, result
assert result['wet']['std']<result['settling']['std']<result['dry']['std'],result
assert result['dry']['std']>.001, 'Dry mineral/cotton detail must survive'
assert abs(result['wet']['mean']-result['dry']['mean'])<.08, 'Do not erase the fresh pigment'
