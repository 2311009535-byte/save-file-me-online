import {inflateSync,deflateSync} from 'node:zlib';
const signature=Buffer.from('89504e470d0a1a0a','hex');
const table=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function crc(b){let n=0xffffffff;for(const v of b)n=table[(n^v)&255]^(n>>>8);return(n^0xffffffff)>>>0;}
function chunk(type,data){const name=Buffer.from(type),out=Buffer.alloc(data.length+12);out.writeUInt32BE(data.length);name.copy(out,4);data.copy(out,8);out.writeUInt32BE(crc(Buffer.concat([name,data])),8+data.length);return out;}
export function encodePNG(width,height,rgba){const header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=6;const raw=Buffer.alloc(height*(width*4+1));for(let y=0;y<height;y++)rgba.copy(raw,y*(width*4+1)+1,y*width*4,(y+1)*width*4);return Buffer.concat([signature,chunk('IHDR',header),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);}
export function decodePNG(png){
 if(png.length>10500000||!png.subarray(0,8).equals(signature))throw Error('Invalid PNG');
 let w,h,channels,ended=false;const parts=[];
 for(let offset=8;offset+12<=png.length;){const n=png.readUInt32BE(offset),end=offset+12+n;if(end>png.length)throw Error('Truncated PNG');const type=png.toString('ascii',offset+4,offset+8),data=png.subarray(offset+8,end-4);if(crc(png.subarray(offset+4,end-4))!==png.readUInt32BE(end-4))throw Error('Invalid PNG checksum');
  if(type==='IHDR'){if(w||n!==13)throw Error('Invalid header');w=data.readUInt32BE();h=data.readUInt32BE(4);channels=data[9]===6?4:data[9]===2?3:0;if(!w||!h||w>4096||h>4096||w*h>5000000||data[8]!==8||!channels||data[10]||data[11]||data[12])throw Error('Unsupported PNG');}
  else if(type==='IDAT')parts.push(data);else if(type==='IEND'){ended=true;break;}offset=end;
 }
 if(!ended||!w||!parts.length)throw Error('Incomplete PNG');const stride=w*channels,raw=inflateSync(Buffer.concat(parts),{maxOutputLength:(stride+1)*h});if(raw.length!==(stride+1)*h)throw Error('Invalid pixels');const rgba=Buffer.alloc(w*h*4),prev=Buffer.alloc(stride),row=Buffer.alloc(stride);
 const paeth=(a,b,c)=>{const p=a+b-c,aa=Math.abs(p-a),bb=Math.abs(p-b),cc=Math.abs(p-c);return aa<=bb&&aa<=cc?a:bb<=cc?b:c;};
 for(let y=0;y<h;y++){const filter=raw[y*(stride+1)];if(filter>4)throw Error('Invalid PNG filter');for(let x=0;x<stride;x++){const a=x>=channels?row[x-channels]:0,b=prev[x],c=x>=channels?prev[x-channels]:0;row[x]=(raw[y*(stride+1)+1+x]+[0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][filter])&255;}for(let x=0;x<w;x++){const src=x*channels,dst=(y*w+x)*4;rgba[dst]=row[src];rgba[dst+1]=row[src+1];rgba[dst+2]=row[src+2];rgba[dst+3]=channels===4?row[src+3]:255;}row.copy(prev);}
 return {width:w,height:h,rgba};
}
// This removes the generated solid green backdrop, not the person's photograph.
// No paid second API, local model download, or original-photo file is involved.
export function prepareSeedreamAvatar(png){
 const {width:w,height:h,rgba}=decodePNG(png);let removed=0,visible=0;
 for(let i=0;i<rgba.length;i+=4){const r=rgba[i],g=rgba[i+1],b=rgba[i+2],excess=g-Math.max(r,b);
  if(g>100&&excess>45){const alpha=Math.round(255*Math.max(0,Math.min(1,(85-excess)/40)));rgba[i+3]=Math.min(rgba[i+3],alpha);if(alpha>0)rgba[i+1]=Math.min(g,Math.max(r,b)+45);}
  if(rgba[i+3]===0)removed++;else visible++;
 }
 if(removed<w*h*.03||visible<w*h*.05)throw Error('Avatar background could not be removed. Retry or use the default avatar.');
 let left=w,top=h,right=0,bottom=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(rgba[(y*w+x)*4+3]>16){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
 const pad=Math.ceil(Math.max(right-left,bottom-top)*.04);left=Math.max(0,left-pad);top=Math.max(0,top-pad);right=Math.min(w-1,right+pad);bottom=Math.min(h-1,bottom+pad);const scale=Math.min(1,1024/Math.max(right-left+1,bottom-top+1)),ow=Math.max(1,Math.round((right-left+1)*scale)),oh=Math.max(1,Math.round((bottom-top+1)*scale)),out=Buffer.alloc(ow*oh*4);
 for(let y=0;y<oh;y++)for(let x=0;x<ow;x++){const sx=left+Math.min(right-left,Math.floor(x/scale)),sy=top+Math.min(bottom-top,Math.floor(y/scale));rgba.copy(out,(y*ow+x)*4,(sy*w+sx)*4,(sy*w+sx)*4+4);}return encodePNG(ow,oh,out);
}
