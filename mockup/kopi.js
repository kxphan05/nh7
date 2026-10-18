const Q=new URLSearchParams(location.search);
const L=STR[Q.get('l')]?Q.get('l'):'en';
const RATE=parseFloat(Q.get('r'))||0.9;
const $=s=>document.querySelector(s);
const t=(k,v)=>(STR[L][k]||STR.en[k]).replace('{v}',v??'');
const url=(page,extra={})=>page+'?'+new URLSearchParams({l:L,r:RATE,...extra});
const here=()=>location.pathname.split('/').pop()+location.search;
const go=(page,extra)=>{location.href=url(page,extra)};

let spoken=false,cur=null;
// Pre-rendered neural voices (audio/, made with Azure en-SG-Luna, ta-SG-Venba etc.).
// Browser TTS is only a fallback for text that has no clip.
const EMOJI=/[\u{1F300}-\u{1FAFF}\u2600-\u27BF\u23F8\uFE0F]/gu;
const clean=s=>s.replace(EMOJI,'').replace(/\s+/g,' ').trim();
function speak(text,lang=VOICE[L]){return new Promise(res=>{
  const est=Math.max(800,text.length*90);
  const short=Object.keys(VOICE).find(k=>VOICE[k]===lang)||'en';
  const clip=typeof AUDIO!=='undefined'&&AUDIO[short+'|'+clean(text)];
  if(cur){cur.pause();cur=null}
  if('speechSynthesis' in window)speechSynthesis.cancel();
  let d=0;const f=()=>{if(!d){d=1;res()}};
  if(clip){
    const a=new Audio(clip);cur=a;a.playbackRate=RATE/0.9;a.onended=f;a.onerror=f;
    a.play().then(()=>{spoken=true}).catch(f); // blocked before first tap: first pointerdown replays it
    setTimeout(f,est*3+4000);return}
  if(!('speechSynthesis' in window)){setTimeout(res,est);return}
  const u=new SpeechSynthesisUtterance(text);u.lang=lang;u.rate=RATE;
  u.onstart=()=>{spoken=true};u.onend=f;u.onerror=f;setTimeout(f,est*2+2000);
  speechSynthesis.speak(u)})}

// Mock agency form (stays English). Blocks are dimmed unless spotlit.
function renderForm(sub){
  $('#form').innerHTML=`<small>Sample Agency · Caregiver Support Portal (mock)</small>
  <div class="blk" id="b-title"><h1 id="title">Caregiver Support Grant: Application</h1><p>This grant helps care recipients and their caregivers with costs. Applications are means-tested.</p></div>
  <div class="blk" id="b-rel"><label>Who do you care for?</label><span class="val" id="v-rel"></span></div>
  <div class="blk" id="b-hrs"><label>Hours of care per week</label><span class="val" id="v-hrs"></span></div>
  <div class="blk" id="b-priv"><label>Your private details</label>
    <label class="f">NRIC number<input type="text" autocomplete="off"></label>
    <label class="f">Monthly household income<input type="text" autocomplete="off"></label>
    <label class="f">Bank account number<input type="text" autocomplete="off"></label>
    <small class="note">${t('privnote')}</small></div>
  ${sub?'<div class="blk" id="b-sub"><button class="submit" id="sub">Submit</button></div>':''}`}
function spot(id){document.querySelectorAll('.blk').forEach(b=>{b.classList.toggle('spot',b.id===id);b.classList.toggle('you',b.id===id&&(id==='b-priv'||id==='b-sub'));
  b.dataset.here=b.id!==id?'':id==='b-priv'?t('turn'):id==='b-sub'?t('press'):t('here')});
  $('#'+id)?.scrollIntoView({block:'center',behavior:'smooth'})}
function setVal(id,v){const e=$('#v-'+id);e.textContent=v||'';e.classList.toggle('done',!!v)}

// Kopi card: one sentence, at most 2 buttons.
function show(key,btns=[],{auto=true,text,cue}={}){
  const msg=text||t(key);
  $('#say').textContent=msg;
  const b=$('#btns');b.innerHTML='';
  let c=$('#cue');if(!c){c=document.createElement('div');c.id='cue';c.className='cue';b.before(c)}
  c.textContent=cue||(btns.length>1?t('tap'):'');c.hidden=!c.textContent;
  btns.forEach(([label,fn])=>{const x=document.createElement('button');x.textContent=label;x.onclick=fn;b.append(x)});
  clearTimeout(window._q);
  if(!document.body.dataset.noidle)window._q=setTimeout(()=>go('stop.html',{why:'quiet',from:here()}),25000);
  if(auto)speak(msg);
  return msg}
function boot(step){
  if(step){const e=document.createElement('div');e.className='steps';
    e.innerHTML=`<b>${t('step',step)}</b>`+[1,2,3,4,5,6].map(i=>`<i class="${i<step?'done':i===step?'now':''}"></i>`).join('');$('#say').before(e)}
  $('#say').onclick=()=>speak($('#say').textContent);
  const p=$('#person');if(p){p.textContent=t('person');p.href=url('stop.html',{why:'unsure',from:here()})}
  // browsers may block speech until the first tap on a new page
  document.addEventListener('pointerdown',()=>{if(!spoken)speak($('#say').textContent)},{once:true})}
