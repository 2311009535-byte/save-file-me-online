import {stat} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
export function byteRange(header,size){
 const match=/^bytes=(\d*)-(\d*)$/.exec(header||'');if(!match||!size||(!match[1]&&!match[2]))return null;
 let start=match[1]?Number(match[1]):Math.max(0,size-Number(match[2]));
 let end=match[1]?(match[2]?Math.min(size-1,Number(match[2])):size-1):size-1;
 return Number.isSafeInteger(start)&&Number.isSafeInteger(end)&&start>=0&&start<size&&end>=start?{start,end}:null;
}
export async function sendVideo(req,res,file,type){
 const {size}=await stat(file),headers={'Content-Type':type,'Cache-Control':'no-cache','Accept-Ranges':'bytes'};
 let start=0,end=size-1,status=200;
 if(req.headers.range){const range=byteRange(req.headers.range,size);if(!range){res.writeHead(416,{...headers,'Content-Range':`bytes */${size}`,'Content-Length':0});res.end();return;}({start,end}=range);status=206;headers['Content-Range']=`bytes ${start}-${end}/${size}`;}
 headers['Content-Length']=Math.max(0,end-start+1);res.writeHead(status,headers);
 if(req.method==='HEAD'||!size){res.end();return;}
 const stream=createReadStream(file,{start,end});stream.on('error',error=>res.destroy(error));res.on('close',()=>stream.destroy());stream.pipe(res);
}
