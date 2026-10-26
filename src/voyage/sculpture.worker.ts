import {buildSculpture,type SculptureInput} from './sculpture';
self.onmessage=(event:MessageEvent<SculptureInput>)=>{
  try{
    const mesh=buildSculpture(event.data);
    self.postMessage({mesh},{transfer:[mesh.positions.buffer,mesh.normals.buffer,mesh.uvs.buffer,mesh.indices.buffer]});
  }catch(error){self.postMessage({error:error instanceof Error?error.message:'La sculpture n’a pas pu se former.'});}
};
