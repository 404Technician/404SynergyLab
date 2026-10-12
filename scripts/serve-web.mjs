import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { buildWeb } from './build-web.mjs';
import { fileURLToPath } from 'node:url';
import { resolve, sep, extname } from 'node:path';
const root=fileURLToPath(await buildWeb());
const port=Number(process.env.PORT || 4173);
if(!Number.isInteger(port)||port<0||port>65535)throw new Error('Invalid PORT');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8'};
const server=createServer(async(req,res)=>{
  try {
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
    const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const target=resolve(root,'.'+(path==='/'?'/index.html':path));
    if(!target.startsWith(resolve(root)+sep)){res.writeHead(403);res.end();return;}
    const body=await readFile(target);
    res.writeHead(200,{'Content-Type':types[extname(target)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"});
    res.end(req.method==='HEAD'?undefined:body);
  }catch(error){res.writeHead(error.code==='ENOENT'?404:400);res.end('File unavailable.');}
});
server.on('error',error=>{console.error(error.code==='EADDRINUSE'?`Port ${port} is already in use. Close the other lab window or set PORT.`:error.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log(`404 Synergy Lab: http://127.0.0.1:${server.address().port}\nPress Ctrl+C to stop.`));
