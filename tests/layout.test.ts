import {describe,expect,it} from 'vitest';
import {SHEETS,PIGMENT_RESOLUTION,paintingQuality,displaySize,exportSize,frameComposition} from '../src/engine/layout';
import {compose} from '../src/engine/composition';
const settings={palette:'estuaire',granulation:.72,wetness:.64,complexity:.52};
describe('portrait and HD presentation',()=>{
  it('has actual portrait 9:16 and Full HD landscape simulation fields',()=>{
    expect(SHEETS.portrait).toEqual({width:1080,height:1920});
    expect(SHEETS.landscape).toEqual({width:1920,height:1080});
    expect(exportSize('portrait')).toEqual({width:2304,height:4096});
    expect(exportSize('landscape')).toEqual({width:4096,height:2304});
  });
  it('turns the complete score and ink together without modifying the source',()=>{
    const score=compose(240106,settings);score.ink=[{points:[{x:.2,y:.3},{x:.7,y:.6}],start:3,duration:2,width:1,opacity:.6,seed:3}];
    const before=JSON.stringify(score),portrait=frameComposition(score,'portrait');
    expect(JSON.stringify(score)).toBe(before);expect(portrait.gestures[0].points[0]).toEqual({x:1-score.gestures[0].points[0].y,y:score.gestures[0].points[0].x});
    expect(portrait.ink![0].points).toEqual([{x:.7,y:.2},{x:.4,y:.7}]);
    expect(portrait.seed).toBe(score.seed);expect(portrait.duration).toBe(score.duration);
  });
  it('displays a Full HD viewport at Full HD and limits oversized mobile buffers',()=>{
    expect(displaySize(1920,1080,1)).toEqual({width:1920,height:1080});
    expect(displaySize(360,640,3,true)).toEqual({width:1080,height:1920});
    const large=displaySize(1440,2560,3,true);
    expect(large.width*large.height).toBeLessThan(4.21e6);
    expect(Math.abs(large.width/large.height-1440/2560)).toBeLessThan(.001);
  });
  it('samples pigments in true QHD and retains high-density phone and 4K display pixels',()=>{
    expect(SHEETS.portrait.width*PIGMENT_RESOLUTION.scale).toBe(1440);
    expect(SHEETS.portrait.height*PIGMENT_RESOLUTION.scale).toBe(2560);
    expect(PIGMENT_RESOLUTION.pixels).toBe(1440*2560);
    expect(displaySize(412,732,3.5,true)).toEqual({width:1442,height:2562});
    expect(displaySize(3840,2160,1)).toEqual({width:3840,height:2160});
  });
  it('keeps all rotated gesture coordinates inside the original white margins',()=>{
    for(let seed=0;seed<10;seed++){
      const score=frameComposition(compose(seed,settings),'portrait');
      expect(score.gestures.every(g=>g.points.every(p=>p.x>=.089&&p.x<=.911&&p.y>=.089&&p.y<=.911))).toBe(true);
    }
  });
});

 describe('automatic painting quality',()=>{
  it('gives well-equipped desktops a finer stable field and a full 4K detail atlas',()=>{
   const q=paintingQuality({coarse:false,memory:8,cores:12});
   expect(q.tier).toBe('studio');expect(q.scale*1080).toBe(1800);expect(q.scale*1920).toBe(3200);
   expect(paintingQuality({memory:8,cores:8}).tier).toBe('fine');
   expect(q.pixels).toBe(1800*3200);expect(q.detailPixels).toBe(2304*4096);
  });
  it('bounds mobile memory without assuming all phones are equally powerful',()=>{
   expect(paintingQuality({coarse:true,memory:2,cores:8}).tier).toBe('light');
   expect(paintingQuality({coarse:true,memory:4,cores:8}).pixels).toBe(1080*1920);
   expect(paintingQuality({coarse:true,memory:8,cores:8}).pixels).toBe(1440*2560);
   const q=paintingQuality({coarse:true,memory:2});const display=displaySize(1440,2560,3,true,q.displayPixels);
   expect(display.width*display.height).toBeLessThan(2.11e6);
  });
  it('keeps the previous QHD default when optional browser hints are unavailable or invalid',()=>{
   for(const hints of [{},{memory:NaN,cores:Infinity},{memory:-1,cores:0},{coarse:true}]){
    expect(paintingQuality(hints).tier).toBe('fine');expect(paintingQuality(hints).pixels).toBe(1440*2560);
   }
  });
 });
