// @vitest-environment jsdom
import {StrictMode,act} from 'react';
import {createRoot} from 'react-dom/client';
import {afterEach,it,expect,vi} from 'vitest';
const h=vi.hoisted(()=>({create:vi.fn(),draw:vi.fn(),dispose:vi.fn()}));
vi.mock('../src/dance/renderer',()=>({DanceRenderer:{create:h.create}}));
import DanceStudio from '../src/dance/DanceStudio';
import type {BirdSound} from '../src/birds/BirdAudioBank';
import type {ArtworkPoetry} from '../src/birds/artworkPoetry';
import type {DanceAudio} from '../src/dance/media';
afterEach(()=>{vi.unstubAllGlobals();vi.restoreAllMocks();});
it('starts a single automatic flight in StrictMode and releases audio only on actual exit',async()=>{
 vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);vi.stubGlobal('matchMedia',()=>({matches:false}));vi.stubGlobal('requestAnimationFrame',()=>1);vi.stubGlobal('cancelAnimationFrame',()=>{});
 Object.defineProperty(HTMLDialogElement.prototype,'showModal',{configurable:true,value:vi.fn()});
 h.draw.mockClear();h.dispose.mockClear();h.create.mockImplementation(async()=>({draw:h.draw,dispose:h.dispose}));
 const audio={context:{currentTime:0},unlock:vi.fn(async()=>{}),play:vi.fn(),stop:vi.fn(),dispose:vi.fn(async()=>{})};
 const host=document.createElement('div');document.body.append(host);const root=createRoot(host),close=vi.fn();
 await act(async()=>root.render(<StrictMode><DanceStudio painting={new Blob()} sound={{document:{buffer:{duration:1}}} as unknown as BirdSound} poetry={{title:'Un vol',verses:['Un','Deux','Trois']} as ArtworkPoetry} paper="#f7f4ec" seed={1} credit={{author:'Auteur',license:'CC0',source:'https://example.org'}} audio={audio as unknown as DanceAudio} onClose={close}/></StrictMode>));
 expect(audio.play).toHaveBeenCalledOnce();expect(audio.dispose).not.toHaveBeenCalled();expect(host.querySelector('.flight-status')).not.toBeNull();expect(host.querySelector('.dance-tools')).toBeNull();expect(host.textContent).not.toContain('Enregistrer');
 await act(async()=>host.querySelector<HTMLButtonElement>('[aria-label="Revenir à mon œuvre"]')!.click());expect(close).toHaveBeenCalledOnce();
 await act(async()=>root.unmount());expect(audio.dispose).toHaveBeenCalledOnce();host.remove();
});
