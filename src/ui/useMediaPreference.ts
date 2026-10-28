import {useCallback,useSyncExternalStore} from 'react';
/** No animation loop or device sensor; react only when the system preference changes. */
export function useMediaPreference(query:string){
 const subscribe=useCallback((changed:()=>void)=>{
  const media=window.matchMedia(query);
  if(media.addEventListener){media.addEventListener('change',changed);return()=>media.removeEventListener('change',changed);}
  media.addListener?.(changed);return()=>media.removeListener?.(changed);
 },[query]);
 const snapshot=useCallback(()=>typeof window!=='undefined'&&typeof matchMedia==='function'?window.matchMedia(query).matches:false,[query]);
 return useSyncExternalStore(subscribe,snapshot,()=>false);
}
