// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {DryingProgress} from '../src/birds/DryingProgress';
let host:HTMLDivElement,root:Root;
beforeEach(()=>{vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);host=document.createElement('div');document.body.append(host);root=createRoot(host);});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.unstubAllGlobals();});
it('shows actual progress updates and lets the visitor resume painting',async()=>{
 const resume=vi.fn();await act(async()=>root.render(<DryingProgress progress={.42} onResume={resume}/>));
 const bar=host.querySelector('progress')!;expect(bar.value).toBe(.42);expect(bar.getAttribute('aria-label')).toBe('Séchage de l’œuvre');expect(host.querySelector('.drying-percent')!.textContent).toBe('42 %');expect(host.querySelector('.drying-sun svg')).not.toBeNull();
 await act(async()=>root.render(<DryingProgress progress={.67} onResume={resume}/>));expect(bar.value).toBe(.67);
 await act(async()=>host.querySelector('button')!.click());expect(resume).toHaveBeenCalledOnce();
});
it.each([[NaN,0,'0 %'],[Infinity,0,'0 %'],[-1,0,'0 %'],[2,1,'100 %'],[.999,.999,'99 %'],[1,1,'100 %']] as const)('bounds progress %s without invalid values or early completion',async(input,value,text)=>{
 await act(async()=>root.render(<DryingProgress progress={input} onResume={()=>{}}/>));expect(host.querySelector('progress')!.value).toBe(value);expect(host.querySelector('.drying-percent')!.textContent).toBe(text);
});
