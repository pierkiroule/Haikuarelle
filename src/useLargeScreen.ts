import {useCallback,useEffect,useRef,useState,type RefObject} from 'react';

/** Native fullscreen when available; an in-page viewing mode otherwise. */
export function useLargeScreen(root:RefObject<HTMLDivElement|null>){
  const [viewing,setViewing]=useState(false),[hud,setHud]=useState(true);
  const native=useRef(false),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  const reveal=useCallback(()=>{
    setHud(true);clearTimeout(timer.current);timer.current=setTimeout(()=>setHud(false),2400);
  },[]);
  const exit=useCallback(()=>{
    setViewing(false);setHud(true);clearTimeout(timer.current);
    if(document.fullscreenElement===root.current)void document.exitFullscreen().catch(()=>{});
  },[root]);
  const enter=useCallback(()=>{
    setViewing(true);reveal();
    const element=root.current;
    if(element?.requestFullscreen&&document.fullscreenEnabled){
      void element.requestFullscreen().then(()=>{native.current=document.fullscreenElement===element;}).catch(()=>{native.current=false;});
    }
  },[root,reveal]);
  useEffect(()=>{
    const change=()=>{
      if(document.fullscreenElement===root.current){native.current=true;setViewing(true);}
      else if(native.current){native.current=false;setViewing(false);setHud(true);}
    };
    document.addEventListener('fullscreenchange',change);
    return()=>{document.removeEventListener('fullscreenchange',change);clearTimeout(timer.current);};
  },[root]);
  return {viewing,hud,reveal,exit,toggle:viewing?exit:enter};
}
