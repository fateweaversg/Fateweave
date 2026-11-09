'use strict';
const express = require('express');
const crypto = require('crypto');
const { db } = require('./db');
const { config } = require('./config');
const { verifyAccessToken } = require('./auth');
const { resolveAiMaster, validateMasterMessage } = require('./ai-master');

db.exec(`
CREATE TABLE IF NOT EXISTS master_sessions_v2(email TEXT,birth_date TEXT,main_used INTEGER NOT NULL DEFAULT 0,probes_used INTEGER NOT NULL DEFAULT 0,active_topic INTEGER,PRIMARY KEY(email,birth_date));
CREATE TABLE IF NOT EXISTS master_topics_v2(id INTEGER PRIMARY KEY,email TEXT,birth_date TEXT,ordinal INTEGER NOT NULL,question TEXT NOT NULL,closed INTEGER NOT NULL DEFAULT 0,UNIQUE(email,birth_date,ordinal));
CREATE TABLE IF NOT EXISTS master_messages_v2(id INTEGER PRIMARY KEY,topic_id INTEGER NOT NULL,role TEXT NOT NULL,content TEXT NOT NULL,kind TEXT NOT NULL,request_id TEXT,created_at TEXT NOT NULL DEFAULT(datetime('now')));
CREATE TABLE IF NOT EXISTS master_probe_purchases(order_id INTEGER UNIQUE,email TEXT NOT NULL,birth_date TEXT,slot INTEGER NOT NULL CHECK(slot BETWEEN 1 AND 2),status TEXT NOT NULL,expires_at TEXT,additional_probes INTEGER NOT NULL DEFAULT 15);
CREATE TABLE IF NOT EXISTS master_sessions_v3(order_id INTEGER PRIMARY KEY,email TEXT NOT NULL,birth_date TEXT NOT NULL,main_used INTEGER NOT NULL DEFAULT 0,probes_used INTEGER NOT NULL DEFAULT 0,active_topic INTEGER);
CREATE TABLE IF NOT EXISTS master_topics_v3(id INTEGER PRIMARY KEY,order_id INTEGER NOT NULL,ordinal INTEGER NOT NULL,question TEXT NOT NULL,closed INTEGER NOT NULL DEFAULT 0,UNIQUE(order_id,ordinal));
CREATE TABLE IF NOT EXISTS master_messages_v3(id INTEGER PRIMARY KEY,topic_id INTEGER NOT NULL,role TEXT NOT NULL,content TEXT NOT NULL,kind TEXT NOT NULL,request_id TEXT,created_at TEXT NOT NULL DEFAULT(datetime('now')));
`);
// Existing 15-question purchases keep their purchased allowance. New buyers
// may buy one 5- or 10-question pack, once. Older rows receive the default 15.
if (!db.prepare('PRAGMA table_info(master_probe_purchases)').all().some((col) => col.name === 'additional_probes')) {
  db.exec('ALTER TABLE master_probe_purchases ADD COLUMN additional_probes INTEGER NOT NULL DEFAULT 15');
}
if (!db.prepare('PRAGMA table_info(master_probe_purchases)').all().some((col) => col.name === 'reading_order_id')) db.exec('ALTER TABLE master_probe_purchases ADD COLUMN reading_order_id INTEGER');
db.exec('DROP INDEX IF EXISTS master_probe_slot; CREATE UNIQUE INDEX IF NOT EXISTS master_probe_slot ON master_probe_purchases(reading_order_id,slot) WHERE status IN (\'pending\',\'paid\') AND reading_order_id IS NOT NULL;');
db.exec(`UPDATE master_probe_purchases SET reading_order_id=(SELECT id FROM orders WHERE email=master_probe_purchases.email AND birth_date=master_probe_purchases.birth_date AND price_label!='master-chat-upgrade' AND status='paid' AND id<master_probe_purchases.order_id ORDER BY id DESC LIMIT 1) WHERE reading_order_id IS NULL;`);
db.exec(`CREATE TABLE IF NOT EXISTS promo_redemptions(email TEXT NOT NULL,birth_date TEXT NOT NULL,order_id INTEGER NOT NULL UNIQUE,redeemed_at TEXT NOT NULL DEFAULT(datetime('now')),PRIMARY KEY(email,birth_date));`);
function purchases(orderId) { return db.prepare("SELECT COUNT(*) n FROM master_probe_purchases WHERE reading_order_id=? AND status='paid'").get(Number(orderId)||0).n; }
function purchasedProbeTotal(orderId) { return db.prepare("SELECT COALESCE(SUM(additional_probes),0) n FROM master_probe_purchases WHERE reading_order_id=? AND status='paid'").get(Number(orderId)||0).n; }
function ensureSession(access) {
  const orderId=Number(access.order_id);
  if(!orderId)throw new Error('Paid reading order is missing.');
  db.prepare('INSERT OR IGNORE INTO master_sessions_v3(order_id,email,birth_date) VALUES(?,?,?)').run(orderId,access.email.toLowerCase(),access.birth_date);
}
function snapshot(access) {
  ensureSession(access);
  const orderId=Number(access.order_id), session=db.prepare('SELECT * FROM master_sessions_v3 WHERE order_id=?').get(orderId);
  const packs=purchases(orderId),max=5+purchasedProbeTotal(orderId),probesUsed=session.probes_used;
  const topics=db.prepare('SELECT * FROM master_topics_v3 WHERE order_id=? ORDER BY ordinal').all(orderId).map(t=>({id:t.id,number:t.ordinal,question:t.question,closed:!!t.closed,messages:db.prepare('SELECT role,content,kind FROM master_messages_v3 WHERE topic_id=? ORDER BY id').all(t.id)}));
  return {topics,activeTopicId:session.active_topic,mainUsed:session.main_used,mainRemaining:Math.max(0,3-session.main_used),mainMax:3,probesUsed,probesRemaining:Math.max(0,max-probesUsed),probeMax:max,purchases:packs,purchasesRemaining:Math.max(0,1-packs),purchaseOptions:[{probes:5,amountCents:config.masterProbe5PriceCents},{probes:10,amountCents:config.masterProbe10PriceCents}]};
}
function grantPurchase(email,birthDate,orderId) {
  const order=db.prepare('SELECT * FROM orders WHERE id=?').get(orderId);
  if(!order||order.status!=='paid'||order.email.toLowerCase()!==email.toLowerCase())throw new Error('Upgrade order mismatch');
  const readingOrder=db.prepare("SELECT id FROM orders WHERE email=? AND birth_date=? AND price_label!='master-chat-upgrade' AND status='paid' AND id<? ORDER BY id DESC LIMIT 1").get(email.toLowerCase(),birthDate,orderId);
  const reserved=db.prepare('SELECT * FROM master_probe_purchases WHERE order_id=?').get(orderId);
  if(reserved) {
    if(reserved.status==='paid'&&reserved.reading_order_id)return;
    db.prepare("UPDATE master_probe_purchases SET status='paid',reading_order_id=COALESCE(reading_order_id,?) WHERE order_id=?").run(readingOrder?.id||null,orderId);
  } else {
    // Reconcile an old, already-created Checkout Session during deployment.
    if(!readingOrder||purchases(readingOrder.id)>=1)return;
    db.prepare("INSERT INTO master_probe_purchases(order_id,email,birth_date,slot,status,additional_probes,reading_order_id) VALUES(?,?,?,1,'paid',15,?)").run(orderId,email.toLowerCase(),birthDate,readingOrder.id);
  }
}
const busy=new Set();
function createMasterRouter({stripe,readingFor,limiter}) {
  const router=express.Router();
  function access(req,res,next) {
    const args=req.method==='GET'?req.query:req.body||{};
    req.paid=verifyAccessToken(args.token,args.email,args.birthDate);
    if(!req.paid)return res.status(403).json({error:'Unlock your reading to chat with the Master.'});
    next();
  }
  router.all('/live-reader',(_req,res)=>res.status(410).json({error:'Please refresh and use the single Master conversation.',code:'master_flow_updated'}));
  router.get('/master-chat',access,(req,res)=>res.json(snapshot(req.paid)));
  router.post('/master-chat/next',access,(req,res)=>{
    const a=req.paid,key=`${a.email.toLowerCase()}:${a.order_id}`;
    if(busy.has(key))return res.status(409).json({error:'Please wait for the current answer.'});
    const s=snapshot(a);
    if(!s.activeTopicId||Number(req.body.topicId)!==s.activeTopicId)return res.status(409).json({error:'This question has changed. Refresh the conversation.'});
    if(!s.mainRemaining)return res.status(409).json({error:'All three main questions have been started. You can keep following up on question 3.'});
    db.exec('BEGIN');
    try {db.prepare('UPDATE master_topics_v3 SET closed=1 WHERE id=?').run(s.activeTopicId);db.prepare('UPDATE master_sessions_v3 SET active_topic=NULL WHERE order_id=?').run(a.order_id);db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}
    res.json(snapshot(a));
  });
  router.post('/master-chat',limiter,access,async(req,res)=>{
    const a=req.paid,key=`${a.email.toLowerCase()}:${a.order_id}`,zh=req.body.lang==='zh';
    const fail=(status,code,en,cn)=>res.status(status).json({code,error:zh?cn:en});
    const valid=validateMasterMessage(req.body.message,zh?'zh':'en');
    if(!valid.ok)return res.status(400).json({error:valid.error});
    const kind=req.body.kind, requestId=String(req.body.requestId||'');
    if(!['main','probe'].includes(kind)||!/^[-\w]{8,100}$/.test(requestId))return fail(400,'invalid_request','Please refresh the page and try again.','请刷新后重试。');
    const previous=db.prepare('SELECT m.content FROM master_messages_v3 m JOIN master_topics_v3 t ON m.topic_id=t.id WHERE t.order_id=? AND m.role=\'master\' AND m.request_id=?').get(a.order_id,requestId);
    if(previous)return res.json({...snapshot(a),answer:previous.content,duplicate:true});
    if(busy.has(key))return fail(409,'master_busy','Please wait for the current answer.','请等待当前回答。');
    const s=snapshot(a);
    if(kind==='main'&&(s.activeTopicId||!s.mainRemaining))return fail(409,'main_limit','Use Next question before starting another main question. Three main questions are included.','请先点击下一题。共包含 3 个主要问题。');
    if(kind==='probe'&&(!s.activeTopicId||Number(req.body.topicId)!==s.activeTopicId))return fail(409,'topic_changed','This question has changed. Refresh the conversation.','当前问题已改变，请刷新。');
    if(kind==='probe'&&!s.probesRemaining)return fail(429,'probe_limit',s.purchasesRemaining?'Your follow-ups are used up. Choose one add-on pack of 5 or 10, or continue to your next main question.':'Your follow-up allowance is used. You can still start any remaining main questions.','追问次数已用完。可一次加购 5 次或 10 次，或继续尚未使用的主要问题。');
    busy.add(key);
    try {
      const current=s.topics.find(t=>t.id===s.activeTopicId);
      const topicQuestion=kind==='main'?valid.text:current.question;
      const history=kind==='main'?[]:current.messages.filter(m=>m.kind!=='legacy-probe').slice(-6);
      const {reading,personality}=readingFor(a);
      const message=kind==='main'?valid.text:`Active main question: ${topicQuestion}\nUser's follow-up question: ${valid.text}`;
      const ai=await resolveAiMaster({email:a.email,birthDate:a.birth_date,extended:false,reading,personality,message,lang:zh?'zh':'en',history});
      if(ai.status!=='ai'){res.set('Retry-After',String(ai.retryAfterSeconds||30));return fail(503,'master_unavailable','The Master could not answer right now. Your question and allowance are kept; please retry shortly.','掌门暂时无法回答，问题和次数均已保留，请稍后重试。');}
      db.exec('BEGIN');
      try {
        let topicId=s.activeTopicId;
        if(kind==='main')topicId=Number(db.prepare('INSERT INTO master_topics_v3(order_id,ordinal,question) VALUES(?,?,?)').run(a.order_id,s.mainUsed+1,valid.text).lastInsertRowid);
        const ins=db.prepare('INSERT INTO master_messages_v3(topic_id,role,content,kind,request_id) VALUES(?,?,?,?,?)');
        ins.run(topicId,'user',valid.text,kind,requestId);ins.run(topicId,'master',ai.answer,kind,requestId);
        db.prepare('UPDATE master_sessions_v3 SET main_used=main_used+?,probes_used=probes_used+?,active_topic=? WHERE order_id=?').run(kind==='main'?1:0,kind==='probe'?1:0,topicId,a.order_id);
        db.exec('COMMIT');
      }catch(e){db.exec('ROLLBACK');throw e;}
      res.json({...snapshot(a),answer:ai.answer});
    }catch(e){console.error('Master conversation failed:',e.message);return fail(503,'master_unavailable','The answer could not be saved. Please retry.','回答暂时无法保存，请重试。');}finally{busy.delete(key);}
  });
  router.post('/checkout-upgrade',access,async(req,res)=>{
    if(!stripe)return res.status(503).json({error:'Payments are not configured.'});
    const a=req.paid,email=a.email.toLowerCase(),s=snapshot(a);
    const packSize=Number(req.body?.packSize);
    if(![5,10].includes(packSize))return res.status(400).json({error:'Choose either 5 or 10 additional follow-ups.'});
    if(!s.purchasesRemaining)return res.status(409).json({error:'You have already purchased your one follow-up add-on.'});
    const amountCents=packSize===5?config.masterProbe5PriceCents:config.masterProbe10PriceCents;
    const key=`checkout|${email}:${a.order_id}`;if(busy.has(key))return res.status(409).json({error:'Checkout is already being prepared.'});busy.add(key);
    let createdOrderId=null;
    try {
      const pending=db.prepare("SELECT p.*,o.provider_session_id FROM master_probe_purchases p JOIN orders o ON o.id=p.order_id WHERE p.reading_order_id=? AND p.status='pending'").get(a.order_id);
      if(pending){
        const existing=pending.provider_session_id?await stripe.checkout.sessions.retrieve(pending.provider_session_id):null;
        if(existing?.status==='open'){
          if(Number(pending.additional_probes)!==packSize)return res.status(409).json({error:'A different add-on checkout is already open. Finish or cancel it before choosing another pack.'});
          return res.json({checkoutUrl:existing.url});
        }
        if(existing?.payment_status==='paid'){grantPurchase(email,a.birth_date,pending.order_id);return res.status(409).json({error:'Your previous pack is paid. Refresh the chat before buying another.'});}
        db.prepare("UPDATE master_probe_purchases SET status='expired' WHERE order_id=?").run(pending.order_id);
      }
      if(purchases(a.order_id)>=1)return res.status(409).json({error:'You have already purchased your one follow-up add-on for this reading.'});
      const slot=1;
      const order=db.prepare("INSERT INTO orders(email,birth_date,amount_cents,currency,price_label,provider,status) VALUES(?,?,?,?,'master-chat-upgrade','stripe','pending')").run(email,a.birth_date,amountCents,config.currency);
      const orderId=Number(order.lastInsertRowid);
      createdOrderId=orderId;
      // Reserve the selected allowance before Stripe can emit a webhook;
      // otherwise an unusually fast payment could be granted the legacy
      // 15-question fallback before this pack size is saved.
      db.prepare("INSERT INTO master_probe_purchases(order_id,email,birth_date,slot,status,additional_probes,reading_order_id) VALUES(?,?,?,?,'pending',?,?)").run(orderId,email,a.birth_date,slot,packSize,a.order_id);
      const session=await stripe.checkout.sessions.create({mode:'payment',customer_email:email,line_items:[{price_data:{currency:config.currency,product_data:{name:`FateWeave — ${packSize} additional Master follow-ups`},unit_amount:amountCents},quantity:1}],metadata:{orderId:String(orderId),upgrade:'1',packSize:String(packSize)},success_url:`${config.baseUrl}/master?upgraded=1&session_id={CHECKOUT_SESSION_ID}`,cancel_url:`${config.baseUrl}/master?upgrade_cancelled=1`});
      db.prepare('UPDATE orders SET provider_session_id=? WHERE id=?').run(session.id,orderId);
      res.json({checkoutUrl:session.url});
    }catch(e){
      if(createdOrderId){db.prepare("UPDATE master_probe_purchases SET status='expired' WHERE order_id=? AND status='pending'").run(createdOrderId);db.prepare("UPDATE orders SET status='failed' WHERE id=? AND status='pending'").run(createdOrderId);}
      console.error('Follow-up checkout failed:',e.message);res.status(502).json({error:'Could not start checkout. Please retry.'});
    }finally{busy.delete(key);}
  });
  return router;
}
module.exports={createMasterRouter,grantPurchase,snapshot,purchases};
