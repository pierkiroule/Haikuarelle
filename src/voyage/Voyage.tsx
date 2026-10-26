import {useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {createRng} from '../vendor/pigment-drift/engine/params';
import {flightPose,resumeTime} from './flight';
import {SpatialLandscape} from './SpatialLandscape';
import type {Sculpture,Vec3} from './sculpture';
import type {Journey} from './VoyageDialog';

export default function Voyage({journey}:{journey:Journey}){
  const host=useRef<HTMLDivElement>(null),landscape=useRef<SpatialLandscape|null>(null);
  const reduced=useRef(matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [flying,setFlying]=useState(!reduced.current),[muted,setMuted]=useState(false),[ready,setReady]=useState(false);
  const [error,setError]=useState(''),[audioError,setAudioError]=useState(''),[attempt,setAttempt]=useState(0);
  const [audioAttempt,setAudioAttempt]=useState(0),model=useRef<Sculpture|null>(null);
  const fly=useRef(flying),silent=useRef(muted),restart=useRef(false);
  const rejoin=useRef(()=>{});
  useEffect(()=>{fly.current=flying;landscape.current?.setPaused(!flying);},[flying]);
  useEffect(()=>{silent.current=muted;landscape.current?.setMuted(muted);},[muted]);
  useEffect(()=>{
    let live=true,raf=0,worker:Worker|null=null,renderer:THREE.WebGLRenderer|null=null,controls:OrbitControls|null=null;
    let observer:ResizeObserver|null=null,geometry:THREE.BufferGeometry|null=null,material:THREE.MeshStandardMaterial|null=null,texture:THREE.CanvasTexture|null=null;
    let stars:THREE.Points|null=null,clock=0,last=0,manuallyMoved=false;
    const container=host.current!;setReady(false);setError('');setAudioError('');
    const onBlur=()=>{fly.current=false;setFlying(false);landscape.current?.setPaused(true);};
    const onHidden=()=>{if(document.hidden){onBlur();cancelAnimationFrame(raf);last=0;}else if(live&&renderer)raf=requestAnimationFrame(frame);};
    const contextLost=(event:Event)=>{event.preventDefault();cancelAnimationFrame(raf);fly.current=false;setFlying(false);landscape.current?.setPaused(true);setError('Le ciel graphique a été interrompu. Tu peux réessayer ou revenir à ton œuvre.');};
    const manual=()=>{manuallyMoved=true;fly.current=false;setFlying(false);if(controls)controls.enabled=true;landscape.current?.setPaused(true);};
    let scene:THREE.Scene,camera:THREE.PerspectiveCamera,mesh:Sculpture,locations:Vec3[]=[];
    const frame=(time:number)=>{
      if(!live||!renderer||document.hidden)return;
      const dt=last?Math.min(.06,(time-last)/1000):0;last=time;
      if(restart.current){clock=0;restart.current=false;camera.position.set(0,0,mesh.radius*2.3+1);controls!.target.set(0,0,0);}
      controls!.enabled=!fly.current;
      if(fly.current){
        clock+=dt;const pose=flightPose(clock,mesh.radius,locations),ease=1-Math.exp(-dt*2.2);
        camera.position.lerp(new THREE.Vector3(...pose.position),ease);
        controls!.target.lerp(new THREE.Vector3(...pose.target),ease);
        camera.up.set(Math.sin(clock*.08)*.025,1,0);camera.lookAt(controls!.target);
      }else controls!.update();
      const direction=camera.getWorldDirection(new THREE.Vector3());
      landscape.current?.tick(camera.position.toArray() as Vec3,direction.toArray() as Vec3,camera.up.toArray() as Vec3);
      renderer.render(scene,camera);raf=requestAnimationFrame(frame);
    };
    const start=async(data:Sculpture)=>{
      try{
        mesh=data;model.current=data;scene=new THREE.Scene();scene.background=new THREE.Color('#0b111b');
        camera=new THREE.PerspectiveCamera(53,1,.025,80);camera.position.set(0,0,mesh.radius*2.3+1);
        rejoin.current=()=>{if(manuallyMoved){clock=resumeTime(camera.position.toArray() as Vec3,mesh.radius);manuallyMoved=false;}};
        renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'default'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));
        renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
        renderer.domElement.setAttribute('aria-label','Sculpture aquarelle fermée, avec les vides du papier. Glisse pour tourner autour.');
        renderer.domElement.addEventListener('webglcontextlost',contextLost);renderer.domElement.addEventListener('pointerdown',manual,true);
        container.append(renderer.domElement);
        geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(mesh.positions,3));geometry.setAttribute('normal',new THREE.BufferAttribute(mesh.normals,3));geometry.setAttribute('uv',new THREE.BufferAttribute(mesh.uvs,2));geometry.setIndex(new THREE.BufferAttribute(mesh.indices,1));
        const image=document.createElement('canvas');image.width=journey.frame.width;image.height=journey.frame.height;
        const ctx=image.getContext('2d');if(!ctx)throw new Error('La couleur de cette sculpture ne peut pas être préparée.');
        ctx.putImageData(new ImageData(new Uint8ClampedArray(journey.frame.pixels),image.width,image.height),0,0);
        texture=new THREE.CanvasTexture(image);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
        material=new THREE.MeshStandardMaterial({map:texture,roughness:.88,metalness:0});scene.add(new THREE.Mesh(geometry,material));
        scene.add(new THREE.HemisphereLight('#c9dcf1','#605563',2.4));
        const sun=new THREE.DirectionalLight('#fff0d2',3);sun.position.set(-3,4,6);scene.add(sun);
        const back=new THREE.DirectionalLight('#c0d8ec',2.2);back.position.set(3,-1,-5);scene.add(back);
        const rng=createRng(journey.seed^0x36fe13),points=new Float32Array(600*3);
        for(let i=0;i<600;i++){
          const z=rng()*2-1,angle=rng()*Math.PI*2,r=13+rng()*12,xy=Math.sqrt(1-z*z)*r;
          points.set([Math.cos(angle)*xy,Math.sin(angle)*xy,z*r],i*3);
        }
        const starGeometry=new THREE.BufferGeometry();starGeometry.setAttribute('position',new THREE.BufferAttribute(points,3));
        stars=new THREE.Points(starGeometry,new THREE.PointsMaterial({color:'#dacdb7',size:.026,sizeAttenuation:true,transparent:true,opacity:.65}));scene.add(stars);
        controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.07;controls.minDistance=.36;controls.maxDistance=mesh.radius*5+3;controls.enablePan=false;
        locations=[...mesh.sites.map(s=>s.position),...mesh.landmarks].slice(0,18);setReady(true);
        const resize=()=>{if(!renderer)return;const box=container.getBoundingClientRect();camera.aspect=Math.max(1,box.width)/Math.max(1,box.height);camera.updateProjectionMatrix();renderer.setSize(Math.max(1,box.width),Math.max(1,box.height),false);};
        observer=new ResizeObserver(resize);observer.observe(container);resize();
        document.addEventListener('visibilitychange',onHidden);window.addEventListener('blur',onBlur);
        if(document.hidden)onHidden();raf=requestAnimationFrame(frame);
      }catch(cause){if(live){cancelAnimationFrame(raf);landscape.current?.setPaused(true);setError(cause instanceof Error?cause.message:'Le voyage n’a pas pu s’ouvrir.');}}
    };
    try{
      worker=new Worker(new URL('./sculpture.worker.ts',import.meta.url),{type:'module'});
      worker.onmessage=(event:MessageEvent<{mesh?:Sculpture;error?:string}>)=>{
        worker?.terminate();worker=null;if(!live)return;
        if(event.data.error)setError(event.data.error);else if(event.data.mesh)void start(event.data.mesh);
      };
      worker.onerror=()=>{worker?.terminate();worker=null;if(live)setError('La sculpture n’a pas pu se former. Tu peux réessayer.');};
      const pixels=journey.frame.pixels.slice();worker.postMessage({frame:{...journey.frame,pixels},paper:journey.paper,marks:journey.marks},[pixels.buffer]);
    }catch{worker?.terminate();worker=null;setError('Ce navigateur ne peut pas préparer la sculpture. Ton aquarelle reste disponible.');}
    return()=>{
      live=false;rejoin.current=()=>{};cancelAnimationFrame(raf);worker?.terminate();observer?.disconnect();document.removeEventListener('visibilitychange',onHidden);window.removeEventListener('blur',onBlur);model.current=null;
      landscape.current?.dispose();landscape.current=null;controls?.dispose();
      if(renderer){renderer.domElement.removeEventListener('webglcontextlost',contextLost);renderer.domElement.removeEventListener('pointerdown',manual,true);renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();}
      geometry?.dispose();material?.dispose();texture?.dispose();stars?.geometry.dispose();if(stars)(stars.material as THREE.Material).dispose();
    };
  },[journey,attempt]);
  useEffect(()=>{
    if(!ready||error||!model.current)return;
    let live=true,sound:SpatialLandscape|null=null;const mesh=model.current;
    if(!journey.context){setAudioError('Ce navigateur permet l’exploration visuelle sans écoute spatialisée.');return;}
    void journey.loadAudio().then(audio=>{
      if(!live)return;
      if(audio.buffers.size){
        sound=new SpatialLandscape(journey.context!,mesh.sites,audio.buffers);landscape.current=sound;
        sound.setMuted(silent.current);sound.setPaused(!fly.current||document.hidden);
      }
      setAudioError(audio.failed.length?'Certains chants attendent encore. Tu peux réessayer l’écoute.':journey.context!.state!=='running'?'Active les chants pour écouter le paysage.':'');
    }).catch(()=>{if(live)setAudioError('Les chants n’ont pas pu se préparer. Tu peux réessayer l’écoute.');});
    return()=>{live=false;sound?.dispose();if(landscape.current===sound)landscape.current=null;};
  },[journey,ready,error,audioAttempt]);
  const toggleFlight=()=>{
    const next=!flying;if(next){rejoin.current();void journey.context?.resume().then(()=>setAudioError('')).catch(()=>setAudioError('L’écoute n’a pas pu démarrer.'));}
    setFlying(next);
  };
  const toggleSound=()=>{
    const next=!muted;setMuted(next);
    if(!next)void journey.context?.resume().then(()=>setAudioError('')).catch(()=>setAudioError('L’écoute n’a pas pu démarrer.'));
  };
  return <div className="voyage-world">
    <div ref={host} className="voyage-cosmos"/>
    {!ready&&!error&&<div className="voyage-message" role="status"><span className="voyage-seed" aria-hidden="true">✧</span>Les pigments prennent corps…</div>}
    {error&&<div className="voyage-message" role="alert"><p>{error}</p><button onClick={()=>setAttempt(a=>a+1)}>Réessayer le voyage</button></div>}
    {ready&&!error&&<><p className="voyage-caption">Le blanc est devenu espace.<br/><span>Glisse pour tourner · pince ou dézoome pour prendre du recul.<br/>Au casque, les chants trouvent leur place.</span></p>
      <nav className="voyage-controls" aria-label="Commandes du voyage">
        <button onClick={toggleFlight} aria-pressed={flying}>{flying?'Suspendre le vol':'Reprendre le vol automatique'}</button>
        <button onClick={toggleSound} aria-pressed={!muted}>{muted?'Écouter les chants':'Couper les chants'}</button>
        <button onClick={()=>{restart.current=true;setFlying(true);void journey.context?.resume().catch(()=>setAudioError('Active les chants pour écouter le paysage.'));}}>Recommencer le voyage</button>
      </nav>
      {audioError&&<p className="voyage-audio-note" role="status">{audioError} {journey.context&&<button onClick={()=>{void journey.context!.resume().then(()=>setAudioAttempt(a=>a+1)).catch(()=>setAudioError('L’écoute n’a pas pu démarrer.'));}}>Activer les chants</button>}</p>}
      <span className="sr-only" role="status">{flying?'Vol automatique autour de la sculpture.':'Exploration libre. Le vol et les chants sont suspendus.'}</span>
    </>}
  </div>;
}
