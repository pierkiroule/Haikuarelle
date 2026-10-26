import {buildSculpture,type SculptureInput} from './sculpture';
import {extendPigmentColours} from './texture';
self.onmessage=(event:MessageEvent<SculptureInput>)=>{
  try{
    const mesh=buildSculpture(event.data);
    extendPigmentColours(event.data.frame,event.data.paper);
    self.postMessage({mesh,frame:event.data.frame},{transfer:[event.data.frame.pixels.buffer,mesh.positions.buffer,mesh.normals.buffer,mesh.uvs.buffer,mesh.indices.buffer]});
  }catch(error){self.postMessage({error:error instanceof Error?error.message:'La sculpture n’a pas pu se former.'});}
};
