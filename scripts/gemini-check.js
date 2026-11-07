'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
process.env.DATABASE_PATH = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'fateweave-gemini-')), 'test.db');
process.env.NODE_ENV = 'test';
const { app } = require('../src/server');
const { db } = require('../src/db');
const { issueAccessToken } = require('../src/auth');
const ai = require('../src/ai-master');
const { config } = require('../src/config');
const realFetch = global.fetch;
let checks = 0;
function check(label, value) { assert.ok(value, label); checks++; console.log('PASS ' + label); }
function buyer(email) {
  const order = db.prepare("INSERT INTO orders (email,birth_date,name,amount_cents,currency,price_label,provider,status) VALUES (?,'1990-05-14','Test',100,'usd','promo','stripe','paid')").run(email);
  return { email, birthDate: '1990-05-14', token: issueAccessToken(email,'1990-05-14',order.lastInsertRowid).token, sessionId: 'test' };
}
function seed(b, n) {
  for(let i=0;i<n;i++) db.prepare("INSERT INTO master_chat_messages (token_hash,session_id,email,birth_date,role,content,lang,source) VALUES ('test','test',?,?,'master',?,'en','ai')").run(b.email,b.birthDate,'Earlier AI reply '+i);
}
function upgrade(b) { db.prepare("INSERT INTO chat_upgrades(email,birth_date,expires_at) VALUES (?,?,datetime('now','+90 days'))").run(b.email,b.birthDate); }
function ok(text) { return {ok:true,status:200,json:async()=>({candidates:[{content:{parts:[{text}]}}],usageMetadata:{promptTokenCount:100,candidatesTokenCount:30}})}; }
(async()=>{
  const server=app.listen(0,'127.0.0.1');
  await new Promise(r=>server.once('listening',r));
  const base='http://127.0.0.1:'+server.address().port;
  async function post(b,message){const res=await realFetch(base+'/api/master-chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...b,message,lang:'en'})});return {status:res.status,data:await res.json()};}
  async function get(b){return (await realFetch(base+'/api/master-chat?'+new URLSearchParams(b))).json();}
  try {
    const b=buyer('limits@example.com');
    ai.setGeminiApiKeyForTests('mock');
    let modelCalls=[];
    global.fetch=async(url,opts)=>{modelCalls.push(url); return ok('Question-specific Gemini response.');};
    let data=await get(b);
    check('normal unlock starts with 5 Gemini follow-ups', data.max===5&&data.questionsRemaining===5);
    seed(b,4);
    let result=await post(b,'How does my Taurus Sun affect how I handle work changes?');
    check('fifth answer uses Gemini and decrements 1 to 0', result.status===200&&result.data.source==='ai'&&result.data.questionsUsed===5&&result.data.questionsRemaining===0&&modelCalls.length===1);
    result=await post(b,'Another question about work?');
    check('sixth answer blocked without a Gemini call',result.status===429&&result.data.code==='master_limit_reached'&&modelCalls.length===1);
    upgrade(b);data=await get({...b,sessionId:'reload'});
    check('upgrade includes earlier 5: 30 total and 25 left after reload',data.max===30&&data.questionsUsed===5&&data.questionsRemaining===25);
    const lrRes=await realFetch(base+'/api/live-reader?'+new URLSearchParams(b));const lr=await lrRes.json();
    check('upgrade retains independent 3 regular questions',lr.max===3&&lr.questionsRemaining===3);
    seed(b,24);
    let release;global.fetch=async()=>{await new Promise(r=>release=r);return ok('Final Gemini response.');};
    const pending=post(b,'How do my tarot cards relate to a change at work?');
    while(!release)await new Promise(r=>setTimeout(r,1));
    const competing=await post(b,'Different question while the last slot is pending?');
    check('two tabs cannot spend the last slot twice',competing.status===409&&competing.data.code==='master_busy');
    release();result=await pending;
    check('last Extended answer decrements 1 to 0',result.status===200&&result.data.questionsUsed===30&&result.data.questionsRemaining===0);
    result=await post(b,'A thirty-first question?');
    check('31st Gemini question is blocked',result.status===429&&result.data.code==='master_limit_reached');
    const f=buyer('failover@example.com');let models=[];
    global.fetch=async(url)=>{models.push(url);return url.includes('flash-lite')?ok('A real Gemini fallback answer about your question.'): {ok:false,status:503};};
    ai.resetAiCooldownForTests();result=await post(f,'What does my Moon sign suggest about relationships?');
    check('primary overload falls back to another Gemini model',result.status===200&&result.data.ai&&result.data.questionsRemaining===4&&models.length===3&&models[2].includes('flash-lite'));
    check('fallback consumes exactly one reply, not three attempts', (await get(f)).questionsUsed===1);
    const down=buyer('down@example.com');global.fetch=async()=>({ok:false,status:503});ai.resetAiCooldownForTests();
    result=await post(down,'What can I learn from my reading about work?');
    check('both models down returns 503 without generic answer',result.status===503&&result.data.code==='gemini_unavailable'&&!result.data.answer);
    data=await get(down);
    check('failed request stores no fake exchange and consumes no allowance',data.messages.length===0&&data.questionsRemaining===5&&data.aiResting===false);
    check('overload retry delay is seconds, not five minutes',ai.aiCooldownState().msLeft>0&&ai.aiCooldownState().msLeft<=15000);
    ai.resetAiCooldownForTests();global.fetch=async()=>ok('Recovered Gemini response tailored to the question.');
    result=await post(down,'What can I learn from my reading about work?');
    check('same question can retry immediately after recovery',result.status===200&&result.data.questionsRemaining===4);
    const historyBuyer=buyer('history@example.com');
    for(let i=0;i<110;i++)db.prepare("INSERT INTO master_chat_messages(token_hash,session_id,email,birth_date,role,content,lang,source) VALUES('test','test',?,?,'user',?,'en','master')").run(historyBuyer.email,historyBuyer.birthDate,'History question '+i);
    data=await get(historyBuyer);
    check('long chat keeps latest messages in chronological order',data.messages.length===100&&data.messages[0].content==='History question 10'&&data.messages[99].content==='History question 109');
    let prompt='';global.fetch=async(url,opts)=>{prompt=opts.body;return ok('I am answering the latest question.');};
    result=await post(historyBuyer,'Explain the most recent question with a new example.');
    check('Gemini sees recent history rather than oldest messages',prompt.includes('History question 109')&&!prompt.includes('History question 0'));
    ai.setGeminiApiKeyForTests(null);result=await post(buyer('nokey@example.com'),'Explain my Sun sign.');
    check('missing API key fails honestly without generic reply',result.status===503&&result.data.questionsRemaining===5&&!result.data.answer);
    console.log('Gemini regression: '+checks+' checks passed.');
  } finally {global.fetch=realFetch;server.closeAllConnections();await new Promise(r=>server.close(r));db.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
