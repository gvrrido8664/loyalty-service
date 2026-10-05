// Integration check against a new, disposable local SQLite database.
import assert from 'node:assert/strict';
import {mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawn} from 'node:child_process';
import {createClient} from '@libsql/client';

const dir=mkdtempSync(join(tmpdir(),'loyalty-demo-'));
const env={...process.env,DATABASE_URL:`file:${join(dir,'demo.db').replaceAll('\\','/')}`,PORT:'3012'};
let server;
try {
  const db=createClient({url:env.DATABASE_URL});
  // Only this disposable demo DB. Mirrors prisma/schema.prisma.
  await db.execute('CREATE TABLE Customer (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, email TEXT UNIQUE, phone TEXT, dni TEXT, createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt DATETIME NOT NULL)');
  db.close();
  server=spawn(process.execPath,['dist/main.js'],{env,stdio:'inherit'});
  const base='http://127.0.0.1:3012';
  let ready=false;
  for(let i=0;i<60;i++) {
    assert(server.exitCode===null,'La API terminó antes de arrancar');
    try { ready=(await fetch(base)).ok; } catch {}
    if(ready)break;
    await new Promise(resolve=>setTimeout(resolve,250));
  }
  assert(ready,'La API no arrancó');
  const post=body=>fetch(base+'/customers',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const customer={name:'Cliente Sintético',email:'demo@example.com',dni:'DEMO-001'};
  const created=await post(customer);assert.equal(created.status,201);
  const record=await created.json();assert(record.id);
  assert.equal((await post(customer)).status,409);
  assert.equal((await post({name:'',email:'incorrecto'})).status,400);
  const result=await (await fetch(base+'/customers?search=DEMO-001')).json();
  assert.equal(result.length,1);assert.equal(result[0].id,record.id);
  const resultByEmail=await (await fetch(base+'/customers?search=demo%40example.com')).json();
  assert.equal(resultByEmail.length,1);
  writeFileSync('demo-result.json',JSON.stringify({synthetic:true,create:201,duplicate:409,invalid:400,search_matches:result.length},null,2));
  console.log('PASS: creación, validación, duplicado, búsqueda y persistencia local.');
} finally {
  if(server && server.exitCode===null){server.kill();await new Promise(resolve=>server.once('exit',resolve));}
  rmSync(dir,{recursive:true,force:true});
}
