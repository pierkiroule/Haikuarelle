import {analyzePCM} from './analyze';
import type {AnalysisInput} from './types';
self.onmessage=(event:MessageEvent<AnalysisInput>)=>{
  try {self.postMessage({analysis:analyzePCM(event.data)});}
  catch(error){self.postMessage({error:error instanceof Error?error.message:String(error)});}
};
