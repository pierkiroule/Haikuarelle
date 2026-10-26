import {APP_NAME} from '../brand';
export type ArtworkDelivery='shared'|'saved'|'cancelled';
/** Sharing requires a user gesture and file support; downloading is the fallback. */
export async function deliverArtwork(png:Blob,filename:string,title:string,mode:'download'|'share'):Promise<ArtworkDelivery>{
  const file=new File([png],filename,{type:'image/png'});
  if(mode==='share'&&navigator.share){
    let supported=false;
    try{supported=navigator.canShare?.({files:[file]})??false;}catch{/* Browser policy can disallow file sharing. */}
    if(supported){
      try{await navigator.share({files:[file],title,text:APP_NAME});return 'shared';}
      catch(cause){if(typeof cause==='object'&&cause!==null&&'name' in cause&&cause.name==='AbortError')return 'cancelled';}
    }
  }
  const url=URL.createObjectURL(png),link=document.createElement('a');
  link.href=url;link.download=filename;
  try{link.click();}finally{setTimeout(()=>URL.revokeObjectURL(url),30000);}
  return 'saved';
}
