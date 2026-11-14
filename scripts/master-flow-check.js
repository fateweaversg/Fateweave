'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
process.env.DATABASE_PATH=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'master-flow-')),'test.db');process.env.NODE_ENV='test';process.env.PROMO_ACCESS_CODE='LEGACY12';
const {app}=require('../src/server'),{db}=require('../src/db'),{issueAccessToken,issueOwnerToken,hashToken}=require('../src/auth'),ai=require('../src/ai-master'),flow=require('../src/master-flow');
const {buildFullReading}=require('../src/readings');const realFetch=global.fetch;let passed=0;
function check(name,value){assert.ok(value,name);passed++;console.log('PASS '+name);}
function buyer(email='flow@example.com',birth='1990-05-14'){const o=db.prepare("INSERT INTO orders(email,birth_date,birth_time,ziwei_gender,name,amount_cents,currency,price_label,provider,status) VALUES(?,?,'08:30','male','Test',100,'usd','promo','stripe','paid')").run(email,birth);return {email,birthDate:birth,token:issueAccessToken(email,birth,o.lastInsertRowid).token};}
const ok=text=>({ok:true,status:200,json:async()=>({candidates:[{content:{parts:[{text}]}}],usageMetadata:{promptTokenCount:200,candidatesTokenCount:70}})});
(async()=>{
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));let base='http://127.0.0.1:'+server.address().port;
 let checkoutServer;
 async function post(route,b,extra={}){const r=await realFetch(base+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...b,...extra})});return {status:r.status,data:await r.json()};}
 async function get(b){const r=await realFetch(base+'/api/master-chat?'+new URLSearchParams(b));return {status:r.status,data:await r.json()};}
 async function ask(b,kind,message,topicId=null,requestId=crypto.randomUUID()){return post('/api/master-chat',b,{kind,message,topicId,requestId,lang:'en'});}
 try{
 const b=buyer();let r=await get(b);check('paid buyer starts with 3 mains, 5 probes, and one add-on purchase',r.data.mainRemaining===3&&r.data.probesRemaining===5&&r.data.purchasesRemaining===1);
 check('unpaid chat blocked',(await get({...b,token:'wrong'})).status===403);
 check('wrong birth date blocked',(await get({...b,birthDate:'1980-01-01'})).status===403);
 check('legacy separate input retired',(await post('/api/live-reader',b,{question:'work?'})).status===410);
 check('anonymous Live Reader API is gone',(await post('/api/live-reader/guest',{}, {question:'work?'})).status===404);
 const liveReaderPage=await realFetch(base+'/live-reader');check('old Live Reader page redirects to paid Master',liveReaderPage.status===200&&liveReaderPage.url.endsWith('/master'));
 const pub=path.join(__dirname,'../public');
 const hook=await post('/api/hook',{}, {birthDate:b.birthDate,birthTime:'08:30',ziweiGender:'male',name:'Test'});check('free glimpse remains teaser only',hook.status===200&&hook.data.teaser===true&&!JSON.stringify(hook.data).includes('synthesis'));
 check('Zi Wei glimpse uses a calculated star and palace',!!hook.data.ziwei?.mainStar?.en&&!!hook.data.ziwei?.lifePalace&&!JSON.stringify(hook.data.ziwei).includes('sample'));
 const hook2=await post('/api/hook',{}, {birthDate:'1985-03-02',birthTime:'22:10',ziweiGender:'female',name:'Another'});check('Zi Wei glimpse changes with another birth profile',hook2.status===200&&JSON.stringify(hook.data.ziwei)!==JSON.stringify(hook2.data.ziwei));
 check('teaser includes reading-grounded previews for all six systems',!!hook.data.bazi.workPreview?.en&&!!hook.data.ziwei.hook?.en&&!!hook.data.horoscope.hook?.en&&!!hook.data.numerology.hook?.en&&hook.data.tarot.cards?.length===3&&!!hook.data.yijing.hook?.en&&hook.data.portrait.previewLines?.en?.length>=2);
 check('English and Chinese unlock copy disclose the same included chats and pack prices',(()=>{const a=fs.readFileSync(path.join(pub,'app.js'),'utf8');return a.includes('3 main Master questions and 5 follow-up chats')&&a.includes('$1.99 for 5 or $3.49 for 10')&&a.includes('3 个掌门主问题和 5 次追问')&&a.includes('$1.99 增加 5 次，或 $3.49 增加 10 次');})());
 check('invite-code admin page is linked through a stable owner route',(await realFetch(base+'/owner/trial-codes')).status===200);
 check('trial-code statistics require owner sign-in',(await realFetch(base+'/api/owner/trial-codes')).status===401);
 const ownerToken=issueOwnerToken().token;
 const generatedResponse=await realFetch(base+'/api/owner/trial-codes',{method:'POST',headers:{'Content-Type':'application/json','X-Owner-Token':ownerToken},body:JSON.stringify({mode:'batch',batchSize:1,label:'Test campaign',accessDays:7})});
 const generated=await generatedResponse.json(),trialCode=generated.created?.[0]?.code;
 check('owner can generate a one-use 7-day trial code once',generatedResponse.status===201&&!!trialCode&&generated.created[0].uses===1);
 check('database stores only a hash of the generated code',db.prepare('SELECT code_hash FROM trial_codes').get()?.code_hash===hashToken(trialCode)&&!JSON.stringify(db.prepare('SELECT * FROM trial_codes').all()).includes(trialCode));
 const trialResponse=await realFetch(base+'/api/redeem-promo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'trial@example.com',birthDate:'1988-04-20',birthTime:'08:30',ziweiGender:'female',promoCode:trialCode})});
 const trialAccess=await trialResponse.json();check('valid invite unlocks a time-limited reading',trialResponse.ok&&trialAccess.trialAccess===true&&new Date(trialAccess.expiresAt)>new Date());
 const trialDb= db.prepare('SELECT * FROM trial_code_redemptions').get(),trialWindow=Date.parse(trialDb?.access_expires_at)-Date.now();check('trial redemption is tied to one profile and records its access window',trialDb?.email==='trial@example.com'&&trialDb.birth_date==='1988-04-20'&&trialWindow>6*86400000&&trialWindow<=7*86400000);
 const repeatTrial=await realFetch(base+'/api/redeem-promo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'trial@example.com',birthDate:'1988-04-20',birthTime:'08:30',ziweiGender:'female',promoCode:trialCode})});check('same email and birth date cannot redeem twice',repeatTrial.status===409);
 const legacyTrial=await realFetch(base+'/api/redeem-promo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'legacy-trial@example.com',birthDate:'1989-04-20',birthTime:'08:30',ziweiGender:'male',promoCode:'LEGACY12'})});check('old shared environment promo code is no longer accepted',legacyTrial.status===403);
 const sharedRes=await realFetch(base+'/api/owner/trial-codes',{method:'POST',headers:{'Content-Type':'application/json','X-Owner-Token':ownerToken},body:JSON.stringify({mode:'shared',maxUses:1,label:'Capped test',accessDays:14})}),sharedData=await sharedRes.json(),sharedCode=sharedData.created?.[0]?.code;
 const sharedOne=await realFetch(base+'/api/redeem-promo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'shared-one@example.com',birthDate:'1991-04-20',birthTime:'08:30',ziweiGender:'male',promoCode:sharedCode})});
 const sharedTwo=await realFetch(base+'/api/redeem-promo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'shared-two@example.com',birthDate:'1992-04-20',birthTime:'08:30',ziweiGender:'female',promoCode:sharedCode})});
 check('capped campaign code stops at its configured one use',sharedRes.status===201&&sharedOne.ok&&sharedTwo.status===409);
 const guestRoute=await realFetch(base+'/api/live-reader/guest');check('retired guest API is a clear 404',guestRoute.status===404);
 const castResults=[];for(let i=0;i<5;i++){const c=await realFetch(base+'/api/yijing/cast',{cache:'no-store'});castResults.push((await c.json()).hexagram.number);}check('five Yi-Jing casts vary',new Set(castResults).size>1);
 const report=await realFetch(base+'/api/report?'+new URLSearchParams(b));const full=await report.json();check('paid report includes all 12 calculated Zi Wei palaces',report.ok&&full.ziwei?.calculated===true&&full.ziwei.palaces.length===12);
 const legacyChart=buyer('legacy-chart@example.com');const legacyOrder=db.prepare('SELECT id FROM orders WHERE email=?').get(legacyChart.email);db.prepare('UPDATE orders SET birth_time=NULL,ziwei_gender=NULL WHERE id=?').run(legacyOrder.id);
 let oldReport=await realFetch(base+'/api/report?'+new URLSearchParams(legacyChart));let oldJson=await oldReport.json();check('old paid orders request missing chart inputs',oldReport.status===409&&oldJson.code==='ziwei_inputs_required');
 r=await post('/api/update-ziwei-inputs',legacyChart,{birthTime:'08:30',ziweiGender:'female'});oldReport=await realFetch(base+'/api/report?'+new URLSearchParams(legacyChart));oldJson=await oldReport.json();check('old paid orders reopen after saving chart inputs',r.status===200&&oldReport.ok&&oldJson.ziwei.palaces.length===12&&oldJson.profile.ziweiGender==='female');
 ai.setGeminiApiKeyForTests('mock');let prompts=[];global.fetch=async(u,o)=>{prompts.push(o.body);return ok('Plain-language answer to the current topic.');};
 let id=crypto.randomUUID();r=await ask(b,'main','What is my career outlook in 2027?',null,id);const career=r.data.activeTopicId;check('main answer is model-backed and uses only main allowance',r.status===200&&r.data.mainUsed===1&&r.data.probesUsed===0);
 check('main has one grouped exchange',r.data.topics.length===1&&r.data.topics[0].messages.length===2);
 r=await ask(b,'main','What is my career outlook in 2027?',null,id);check('duplicate request id consumes nothing',r.data.duplicate===true&&r.data.mainUsed===1&&prompts.length===1);
 r=await ask(b,'main','Another main before Next?');check('cannot silently start a new topic',r.status===409);
 r=await ask(b,'probe','Explain what that means at work.',career);check('probe uses separate shared balance',r.status===200&&r.data.mainUsed===1&&r.data.probesUsed===1&&r.data.probesRemaining===4);
 check('probe prompt includes its current main question',prompts.at(-1).includes('What is my career outlook in 2027?'));
 r=await post('/api/master-chat/next',b,{topicId:career});check('Next closes topic without spending a main',r.status===200&&r.data.activeTopicId===null&&r.data.mainRemaining===2&&r.data.topics[0].closed);
 r=await ask(b,'probe','Explain more?',career);check('closed topic cannot take new probes',r.status===409);
 r=await ask(b,'main','What is my financial outlook in the next six months?');const finance=r.data.activeTopicId;check('second main starts financial thread',r.status===200&&r.data.mainUsed===2&&r.data.topics.length===2);
 check('new main excludes career conversation',!prompts.at(-1).includes('career outlook'));
 r=await ask(b,'probe','What does that mean for my financial outlook?',finance);check('financial probe succeeds',r.status===200&&r.data.probesUsed===2);
 check('financial follow-up anchored to finance, not career',prompts.at(-1).includes('financial outlook in the next six months')&&!prompts.at(-1).includes('career outlook'));
 for(let i=0;i<3;i++)r=await ask(b,'probe','Further finance explanation '+i,finance);
 check('5 probes exhausted across both main questions',r.data.probesRemaining===0&&r.data.mainUsed===2);
 r=await ask(b,'probe','Sixth probe?',finance);check('sixth probe blocked server-side',r.status===429&&r.data.code==='probe_limit');
 await post('/api/master-chat/next',b,{topicId:finance});r=await ask(b,'main','What can my reading tell me about relationships?');const third=r.data.activeTopicId;
 check('third main allowed with zero probes',r.status===200&&r.data.mainUsed===3&&r.data.probesRemaining===0);
 check('no fourth main',(await ask(b,'main','A fourth main?')).status===409);
 r=await get(b);check('reload restores topics and balances',r.data.topics.length===3&&r.data.activeTopicId===third&&r.data.probesUsed===5);
 check('Next cannot create a fourth slot',(await post('/api/master-chat/next',b,{topicId:third})).status===409);
 // Checkout component with a deterministic Stripe fixture: no real keys or payment.
 const express=require('express');const paidSessions=new Map();let checkoutCreates=0;
 const stripe={checkout:{sessions:{create:async args=>{checkoutCreates++;const x={id:'cs_test_'+checkoutCreates,url:'https://checkout.stripe.test/'+checkoutCreates,status:'open',payment_status:'unpaid',args};paidSessions.set(x.id,x);return x;},retrieve:async id=>paidSessions.get(id)}}};
 const cApp=express();cApp.use(express.json());cApp.use('/api',flow.createMasterRouter({stripe,limiter:(_q,_s,n)=>n(),readingFor:()=>({reading:buildFullReading({birthDate:b.birthDate,birthTime:'08:30',ziweiGender:'male'}),personality:null})}));
 checkoutServer=cApp.listen(0,'127.0.0.1');await new Promise(r=>checkoutServer.once('listening',r));const oldBase=base;base='http://127.0.0.1:'+checkoutServer.address().port;
 r=await post('/api/checkout-upgrade',b,{packSize:10});check('one-time 10-chat pack checkout available',r.status===200&&checkoutCreates===1);const firstOrder=db.prepare("SELECT * FROM orders WHERE provider_session_id='cs_test_1'").get();
 await post('/api/checkout-upgrade',b,{packSize:10});check('pending checkout reused instead of duplicate payment',checkoutCreates===1);
 db.prepare("UPDATE orders SET status='paid' WHERE id=?").run(firstOrder.id);flow.grantPurchase(b.email,b.birthDate,firstOrder.id);flow.grantPurchase(b.email,b.birthDate,firstOrder.id);
 r=await get(b);check('10-chat pack adds 10, for 15 total and 10 remaining after use',r.data.probeMax===15&&r.data.probesRemaining===10&&r.data.purchases===1&&r.data.purchasesRemaining===0);
 check('a second pack purchase is blocked',(await post('/api/checkout-upgrade',b,{packSize:5})).status===409&&checkoutCreates===1);
 const anotherProfile=buyer(b.email,'1985-01-01');check('a separately paid profile has its own 5 included chats',(await get(anotherProfile)).data.probesRemaining===5);
 base=oldBase;r=await ask(b,'probe','Can you explain the relationship answer?',third);check('purchased chats remain available on the active question',r.status===200&&r.data.probesRemaining===9);
 const down=buyer('outage@example.com');ai.setGeminiApiKeyForTests(null);r=await ask(down,'main','What about my work?');check('outage returns retry notice without main consumed',r.status===503&&(await get(down)).data.mainUsed===0);
 check('outage stores no question or fake answer',(await get(down)).data.topics.length===0);
 ai.setGeminiApiKeyForTests('mock');let release;global.fetch=async()=>{await new Promise(r=>release=r);return ok('Recovered answer.');};
 const inFlight=ask(down,'main','What about my work?');while(!release)await new Promise(r=>setTimeout(r,1));r=await ask(down,'main','Different concurrent question?');check('parallel tabs cannot use two main slots at once',r.status===409);release();await inFlight;
 check('one successful concurrent request consumes one main',(await get(down)).data.mainUsed===1);
 // Final shared probe slot is server-enforced, including concurrent tabs.
 db.prepare('UPDATE master_sessions_v3 SET probes_used=14 WHERE email=? AND birth_date=?').run(b.email,b.birthDate);
 global.fetch=async()=>ok('Final follow-up answer.');
 r=await ask(b,'probe','One final explanation?',third);check('15th probe consumes the final slot',r.status===200&&r.data.probesUsed===15&&r.data.probesRemaining===0);
 check('16th probe is blocked',(await ask(b,'probe','One beyond the maximum?',third)).status===429);
 // Each paid order owns its own thread and allowance; same-email orders do
 // not restore a different reading's messages into this profile.
 const legacy=buyer('legacy@example.com');const fresh=await get(legacy);
 check('new paid order starts with an isolated Master thread',fresh.status===200&&fresh.data.topics.length===0&&fresh.data.mainUsed===0&&fresh.data.probesRemaining===5);
 for(const f of ['index.html','app.js','success.html'])check('no provider name in customer page '+f,!/Gemini/i.test(fs.readFileSync(path.join(pub,f),'utf8')));
 check('single visible conversation and Next control',fs.readFileSync(path.join(pub,'index.html'),'utf8').includes('id="mc-next"'));
 const cfg=await realFetch(base+'/api/config');check('public config remains available',cfg.ok);
 console.log(`Unified Master: ${passed} checks passed.`);
 }finally{global.fetch=realFetch;for(const s of [server,checkoutServer])if(s){s.closeAllConnections();await new Promise(r=>s.close(r));}db.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
