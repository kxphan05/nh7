const $=s=>document.querySelector(s);
const Q=new URLSearchParams(location.search);
const L=STR[Q.get('l')]?Q.get('l'):'en';
const t=(k,v)=>(STR[L][k]||STR.en[k]).replace('{v}',v??'');
const UI={
 en:{greet:'Good morning',sub:'I can help you fill in the form, one small step at a time.',go:'☕ Start',ph:'Type or tap the mic…',priv:'🔒 Kept on this device. Deleted when you finish.',person:'📞 Talk to a person'},
 zh:{greet:'早安',sub:'我可以一步一步帮你填表。',go:'☕ 开始',ph:'输入，或点麦克风…',priv:'🔒 只保存在这台设备上，完成后删除。',person:'📞 联系真人'},
 ms:{greet:'Selamat pagi',sub:'Saya boleh bantu anda isi borang, langkah demi langkah.',go:'☕ Mula',ph:'Taip atau tekan mikrofon…',priv:'🔒 Disimpan pada peranti ini. Dipadam apabila selesai.',person:'📞 Cakap dengan orang'},
 ta:{greet:'காலை வணக்கம்',sub:'படிவத்தை ஒவ்வொரு சிறு படியாக நிரப்ப உதவுவேன்.',go:'☕ தொடங்கு',ph:'தட்டச்சு செய்யவும் அல்லது மைக்…',priv:'🔒 இந்தச் சாதனத்தில் மட்டும். முடிந்ததும் அழிக்கப்படும்.',person:'📞 ஒருவரிடம் பேசுங்கள்'}}[L];
$('#greet').textContent=UI.greet;$('#sub').textContent=UI.sub;$('#go').textContent=UI.go;
$('#txt').placeholder=UI.ph;$('#priv').textContent=UI.priv;$('#person').textContent=UI.person;$('#lang').value=L;$('#bigger').textContent=t('bigger');$('#privnote').textContent=t('privnote');
$('#lang').onchange=e=>location.href='?l='+e.target.value;
let fs=22;$('#bigger').onclick=()=>{fs=fs>=30?20:fs+2;document.documentElement.style.setProperty('--fs',fs+'px')};
$('#dots').onclick=e=>{e.stopPropagation();$('#menu').classList.toggle('open')};
document.addEventListener('click',()=>$('#menu').classList.remove('open'));

/* ---------- voice: pre-rendered neural clips, browser TTS only as fallback ---------- */
let rate=0.9,cur=null;
const EMOJI=/[\u{1F300}-\u{1FAFF}☀-➿⏸️]/gu;
const clean=s=>s.replace(EMOJI,'').replace(/\s+/g,' ').trim();
function speak(text){return new Promise(res=>{
  const est=Math.max(800,text.length*90);let d=0;const f=()=>{if(!d){d=1;res()}};
  if(cur){cur.pause();cur=null}
  if('speechSynthesis' in window)speechSynthesis.cancel();
  const clip=typeof AUDIO!=='undefined'&&AUDIO[L+'|'+clean(text)];
  if(clip){const a=new Audio(clip);cur=a;a.playbackRate=rate/0.9;a.onended=f;a.onerror=f;a.play().catch(f);setTimeout(f,est*3+4000);return}
  if(!('speechSynthesis' in window)){setTimeout(res,est);return}
  const u=new SpeechSynthesisUtterance(text);u.lang=VOICE[L];u.rate=rate;u.onend=f;u.onerror=f;setTimeout(f,est*2+2000);speechSynthesis.speak(u)})}

/* ---------- chat plumbing ---------- */
let idle=null,resume=null,locked=false;
const col=$('#col');
function scroll(){$('#scroll').scrollTo({top:1e6,behavior:'smooth'})}
function clearChips(){document.querySelectorAll('.chips,.cue').forEach(c=>c.remove())}
function setStep(n){const e=$('#steps');e.innerHTML='';if(!n)return;
  e.append(Object.assign(document.createElement('b'),{textContent:t('step',n)}));
  for(let i=1;i<=6;i++){const d=document.createElement('i');d.className=i<n?'done':i===n?'now':'';e.append(d)}}
function userSays(txt){clearChips();const m=document.createElement('div');m.className='m u';m.innerHTML='<div class="tx"></div>';m.firstChild.textContent=txt;col.append(m)}
const showForm=on=>$('#main').classList.toggle('showform',on);
function kopiSays(text,{cls='',chips=[],auto=true,idleMs=25000,cue}={}){
  clearChips();clearTimeout(idle);
  const m=document.createElement('div');m.className='m k '+cls;
  m.innerHTML='<div class="av">☕</div><div class="tx"><div class="body"></div><button class="hear">🔊</button></div>';
  m.querySelector('.body').textContent=text;m.querySelector('.hear').onclick=()=>speak(text);col.append(m);
  const cueTxt=cue||(chips.length>1?t('tap'):'');
  if(cueTxt){const h=document.createElement('div');h.className='cue';h.textContent=cueTxt;col.append(h)}
  if(chips.length){const c=document.createElement('div');c.className='chips';
    chips.forEach(([label,fn])=>{const b=document.createElement('button');b.textContent=label;b.onclick=()=>{clearTimeout(idle);userSays(label);fn()};c.append(b)});col.append(c)}
  scroll();if(auto)speak(text);
  if(idleMs&&chips.length)idle=setTimeout(D.quiet,idleMs);
}
const ask=(key,chips,opts={})=>{resume=()=>ask(key,chips,opts);kopiSays(opts.text||t(key),{...opts,chips})};

/* ---------- form panel ---------- */
function spot(id){document.querySelectorAll('.blk').forEach(b=>{b.classList.toggle('spot',b.id===id);const you=id==='b-priv'||id==='b-sub';b.classList.toggle('you',b.id===id&&you);b.dataset.here=b.id!==id?'':id==='b-priv'?t('turn'):id==='b-sub'?t('press'):t('here')});$('#'+id)?.scrollIntoView({block:'center',behavior:'smooth'})}
function setVal(id,v){const e=$('#v-'+id);e.textContent=v||'';e.classList.toggle('done',!!v)}

/* ---------- the guided flow ---------- */
function begin(){$('#hero').remove();help()}
function help(){ask('help_q',[[t('yes'),voice],[t('no'),()=>ask('no_msg',[[t('yes'),help]])]])}
function voice(){setStep(1);ask('voice_q',[[t('slower'),()=>{rate=Math.max(.5,rate-.15);voice()}],[t('ok'),read]])}
function read(){setStep(2);showForm(true);spot('b-title');ask('read_i',[[t('next'),()=>field(0)]])}
const F=[{id:'rel',q:'rel_q',o:[['spouse','Spouse'],['parent','Parent']]},{id:'hrs',q:'hrs_q',o:[['part','About 20 hours'],['all','About 70 hours']]}];
function field(n){
  const f=F[n];setStep(3+n);spot('b-'+f.id);setVal(f.id,'');
  ask(f.q,f.o.map(([k,v])=>[t(k),()=>{
    setVal(f.id,v);
    ask('confirm',[[t('right'),()=>n===0?field(1):priv()],[t('change'),()=>field(n)]],{text:t('confirm',t('v_'+k))})}]))}
function priv(){setStep(5);spot('b-priv');ask('priv',[[t('done'),submit]],{cue:t('cue_type')});$('#b-priv input').focus({preventScroll:true})}
function submit(){spot('b-sub');$('#submit').disabled=false;$('#submit').classList.add('pulse');setStep(6);kopiSays(t('sub'),{cue:t('cue_press')});resume=null}
$('#submit').onclick=()=>{ // always the user's own click
  $('#submit').disabled=true;$('#submit').classList.remove('pulse');$('#submit').textContent=t('sent');setStep(0);kopiSays(t('fin'),{chips:[[t('finish'),()=>location.href='?l='+L]],idleMs:0})};

/* ---------- human in the loop ---------- */
const D={
  quiet(){speechSynthesis?.cancel();clearTimeout(idle);const r=resume;
    kopiSays(t('stop_quiet'),{cls:'note',chips:[[t('carry'),()=>r?r():help()]],idleMs:0})},
  person(){clearTimeout(idle);locked=true;showForm(false);$('#box').classList.add('off');clearChips();
    kopiSays(t('stop_unsure'),{cls:'hand',idleMs:0});$('#b-priv').classList.remove('spot')},
  scam(){
    const p=document.createElement('div');p.className='popup';
    p.innerHTML='<b>URGENT:</b> Pay a $50 fee within 24 hours to release your grant. Send your OTP.';document.body.append(p);
    // Kopi watches the page for scam wording
    if(/(pay|send)[^.]{0,30}(\$|fee|otp)|gift ?card|release your grant/i.test(p.textContent)){
      clearTimeout(idle);const r=resume;
      kopiSays(t('stop_scam'),{cls:'alert',chips:[[t('close'),()=>{p.remove();r?r():help()}]],idleMs:0})}}
};
$('#person').onclick=D.person;

/* ---------- typed / spoken input: simple intents, otherwise hand over ---------- */
function heard(txt){
  txt=txt.trim();if(!txt||locked)return;
  const btn=[...document.querySelectorAll('.chips button')].find(b=>txt.toLowerCase().includes(b.textContent.toLowerCase())||b.textContent.toLowerCase().includes(txt.toLowerCase()));
  if(btn){btn.click();return}
  userSays(txt);
  if(/slow|慢|perlahan|மெதுவ/i.test(txt)){rate=Math.max(.5,rate-.15);kopiSays(t('voice_q'),{chips:[[t('ok'),read]]});return}
  D.person();
}
$('#send').onclick=()=>{heard($('#txt').value);$('#txt').value=''};
$('#txt').onkeydown=e=>{if(e.key==='Enter')$('#send').click()};
$('#mic').onclick=()=>{
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return;
  const r=new SR();r.lang=VOICE[L];$('#mic').classList.add('on');
  r.onresult=e=>heard(e.results[0][0].transcript);r.onend=r.onerror=()=>$('#mic').classList.remove('on');r.start()};
$('#go').onclick=begin;
