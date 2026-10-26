// Original procedural test recording. No samples, speech or third-party music.
import fs from 'node:fs';
import {signal} from '../tests/audio.fixture';
const audio=signal('music'),rate=audio.sampleRate,count=audio.left.length;
const buffer=Buffer.alloc(44+count*4);
buffer.write('RIFF',0);buffer.writeUInt32LE(buffer.length-8,4);buffer.write('WAVEfmt ',8);buffer.writeUInt32LE(16,16);
buffer.writeUInt16LE(1,20);buffer.writeUInt16LE(2,22);buffer.writeUInt32LE(rate,24);buffer.writeUInt32LE(rate*4,28);
buffer.writeUInt16LE(4,32);buffer.writeUInt16LE(16,34);buffer.write('data',36);buffer.writeUInt32LE(count*4,40);
for(let i=0;i<count;i++){
  buffer.writeInt16LE(Math.round(Math.max(-1,Math.min(1,audio.left[i]))*32767),44+i*4);
  buffer.writeInt16LE(Math.round(Math.max(-1,Math.min(1,audio.right![i]))*32767),46+i*4);
}
fs.writeFileSync(process.argv[2],buffer);
