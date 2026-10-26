"""Replays recorded engine GL calls on Mesa EGL for visual QA, without a browser.
Install optional QA deps: python3 -m pip install moderngl glcontext pillow numpy
Usage: python3 scripts/replay-egl.py trace.jsonl output-directory
"""
import json,sys,time,hashlib,io
from pathlib import Path
import moderngl,numpy as np
from PIL import Image
ctx=moderngl.create_standalone_context(require=330,backend='egl')
print('Renderer:',ctx.info['GL_RENDERER'],flush=True)
out=Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
textures={};attachments={};fbos={};programs={};vaos={};results=[];buffers={};attributes={};versions={}
vbo=ctx.buffer(np.array([-1,-1,3,-1,-1,3],dtype='f4').tobytes())
screen_tex=ctx.texture((512,384),4);screen=ctx.framebuffer([screen_tex]);begin=time.time()
def shader(src):
    return src.replace('#version 300 es','#version 330').replace('precision highp float;','').replace('precision highp sampler2D;','')
def fbo(id):
    if id not in fbos:
        a=attachments[id];fbos[id]=ctx.framebuffer([textures[a[i]] for i in sorted(a)])
    return fbos[id]
for line_number,line in enumerate(open(sys.argv[1])):
    c=json.loads(line);op=c['op']
    try:
        if op=='program':
            p=ctx.program(vertex_shader=shader(c['vertex']),fragment_shader=shader(c['fragment']));programs[c['id']]=p
            if 'aPos' in p:vaos[(c['id'],None)]=ctx.simple_vertex_array(p,vbo,'aPos')
        elif op=='buffer':
            data=np.array(c['data'],dtype='f4').tobytes()
            if c['id'] in buffers:buffers[c['id']].release()
            buffers[c['id']]=ctx.buffer(data) if data else ctx.buffer(reserve=max(4,c.get('size') or 4))
            versions[c['id']]=versions.get(c['id'],0)+1
        elif op=='bufferSubData':buffers[c['id']].write(np.asarray(c['data'],dtype='f4').tobytes(),offset=c['offset'])
        elif op=='attribute':attributes.setdefault(c['vao'],{})[c['index']]=c
        elif op=='texture':
            n={6403:1,33319:2,6408:4}[c['format']];dtype='f1' if c['type']==5121 else 'f2'
            data=bytes(c['data']) if c.get('data') else None
            t=ctx.texture((c['w'],c['h']),n,data=data,dtype=dtype);t.repeat_x=False;t.repeat_y=False;textures[c['id']]=t
        elif op=='parameter':
            if c['key'] in (10240,10241):
                t=textures[c['id']];mn,mg=t.filter
                t.filter=(c['value'] if c['key']==10241 else mn,c['value'] if c['key']==10240 else mg)
        elif op=='attachment':
            attachments.setdefault(c['fbo'],{})[c['attachment']]=c['tex']
            if c['fbo'] in fbos:fbos.pop(c['fbo']).release()
        elif op=='draw':
            p=programs[c['program']];target=screen if c['fbo'] is None else fbo(c['fbo']);target.use()
            ctx.viewport=tuple(c['viewport'])
            for unit,tid in c['textures'].items():
                if tid in textures:textures[tid].use(int(unit))
            for name,value in c['uniforms'].items():
                if name not in p:continue
                u=p[name]
                if len(value)>4:
                    # GL ignores unused trailing array elements; ModernGL requires exact length.
                    size=u.array_length*u.dimension
                    u.write(np.asarray(value[:size],dtype='f4').tobytes())
                else:u.value=value[0] if len(value)==1 else tuple(value)
            if c.get('blend'):
                ctx.enable(moderngl.BLEND);ctx.blend_func=(moderngl.SRC_ALPHA,moderngl.ONE_MINUS_SRC_ALPHA,moderngl.ONE,moderngl.ONE_MINUS_SRC_ALPHA)
            else:ctx.disable(moderngl.BLEND)
            attrs=attributes.get(c.get('vao'),{})
            if attrs:
                version=tuple((a['buffer'],versions[a['buffer']]) for _,a in sorted(attrs.items()))
                key=(c['program'],c['vao'],version)
                if key not in vaos:
                    names={p[name].location:name for name in p if isinstance(p[name],moderngl.Attribute)}
                    active=[(i,a) for i,a in sorted(attrs.items()) if i in names]
                    buf=active[0][1]['buffer']
                    fmt=' '.join(str(a['size'])+'f' for _,a in active)
                    vaos[key]=ctx.vertex_array(p,[(buffers[buf],fmt,*[names[i] for i,_ in active])])
                vaos[key].render(moderngl.TRIANGLES,vertices=c.get('count',3))
            else:vaos[(c['program'],None)].render(moderngl.TRIANGLES)
        elif op=='capture':
            target=fbo(c['fbo']);raw=target.read(components=4,alignment=1)
            im=Image.frombytes('RGBA',(c['w'],c['h']),raw).transpose(Image.Transpose.FLIP_TOP_BOTTOM)
            path=out/(c['name']+'.png')
            encoded=io.BytesIO();im.save(encoded,format='PNG');path.write_bytes(encoded.getvalue())
            with Image.open(path) as check:check.load()
            h=hashlib.sha256(im.tobytes()).hexdigest();a=np.asarray(im)
            white=float(np.mean(np.min(a[:,:,:3],axis=2)>220)*100)
            result={'name':c['name'],'width':c['w'],'height':c['h'],'sha256':h,'clear_percent':round(white,2),'elapsed_s':round(time.time()-begin,2)}
            results.append(result);print(json.dumps(result),flush=True)
            (out/'validation-egl.json').write_text(json.dumps({'renderer':ctx.info['GL_RENDERER'],'results':results},indent=2))
        elif op=='deleteTexture':
            t=textures.pop(c['id'],None)
            if t:t.release()
        elif op=='deleteFramebuffer':
            f=fbos.pop(c['id'],None)
            if f:f.release()
            attachments.pop(c['id'],None)
        elif op=='deleteProgram':
            for key in list(vaos):
                if key[0]==c['id']:vaos.pop(key).release()
            if c['id'] in programs:programs.pop(c['id']).release()
        elif op=='deleteBuffer':
            b=buffers.pop(c['id'],None)
            if b:b.release()
        elif op=='deleteVao':attributes.pop(c['id'],None)
        elif op=='begin':print('Begin',c['seed'],c['palette'],flush=True)
    except Exception as e:
        raise RuntimeError(f'Line {line_number+1}, {op}: {e}') from e
if any(r['name']=='etude-240109' for r in results):
    a=next(r for r in results if r['name']=='etude-240109');b=next(r for r in results if r['name']=='replay-240109')
    assert a['sha256']==b['sha256'],'Seed replay differs'
    assert next(r for r in results if r['name']=='texture-0')['sha256']!=next(r for r in results if r['name']=='texture-100')['sha256']
    print('PASS: deterministic replay, texture sensitivity, 4096 PNG.',flush=True)

if any(r['name']=='audio-replay' for r in results):
    initial=next(r for r in results if r['name']=='audio-0')
    replay=next(r for r in results if r['name']=='audio-replay')
    noink=next(r for r in results if r['name']=='audio-without-ink')
    assert initial['sha256']==replay['sha256'],'Audio replay differs'
    assert replay['sha256']!=noink['sha256'],'Fine ink has no visible effect'
    assert next(r for r in results if r['name']=='audio-4096')['width']==4096
    print('PASS: audio replay, fine ink contribution, 4096 PNG.',flush=True)

if any(r['name']=='hd-replay' for r in results):
    wide=next(r for r in results if r['name']=='hd-landscape')
    portrait=next(r for r in results if r['name']=='hd-portrait')
    assert (wide['width'],wide['height'])==(1920,1080)
    assert (portrait['width'],portrait['height'])==(1080,1920)
    assert wide['sha256']==next(r for r in results if r['name']=='hd-replay')['sha256']
    assert next(r for r in results if r['name']=='hd-landscape-4096')['height']==2304
    assert next(r for r in results if r['name']=='hd-portrait-4096')['width']==2304
    print('PASS: real HD fields, portrait/landscape exports, deterministic replay after a format change.',flush=True)
