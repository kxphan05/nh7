const $=s=>document.querySelector(s);
/* KOPI_QS is set when the page is inlined into Streamlit (no real URL there) */
const Q=new URLSearchParams(window.KOPI_QS??location.search);
const INLINE=window.KOPI_QS!==undefined; // inside Streamlit: language is picked by Streamlit's own bar, restart = reload
const reload=l=>INLINE?location.reload():(location.href='?l='+l);
if(INLINE){document.getElementById('lang').style.display='none';document.getElementById('toSite').style.display='none'}
const L=STR[Q.get('l')]?Q.get('l'):'en';
const t=(k,v)=>(STR[L][k]||STR.en[k]).replace('{v}',v??'');
const UI={
 en:{greet:'Good morning',sub:'I can help you fill in the form, one small step at a time.',go:'☕ Start',ph:'Type or tap the mic…',priv:'🔒 Kept on this device. Deleted when you finish.',person:'📞 Talk to a person'},
 zh:{greet:'早安',sub:'我可以一步一步帮你填表。',go:'☕ 开始',ph:'输入，或点麦克风…',priv:'🔒 只保存在这台设备上，完成后删除。',person:'📞 联系真人'},
 ms:{greet:'Selamat pagi',sub:'Saya boleh bantu anda isi borang, langkah demi langkah.',go:'☕ Mula',ph:'Taip atau tekan mikrofon…',priv:'🔒 Disimpan pada peranti ini. Dipadam apabila selesai.',person:'📞 Cakap dengan orang'},
 ta:{greet:'காலை வணக்கம்',sub:'படிவத்தை ஒவ்வொரு சிறு படியாக நிரப்ப உதவுவேன்.',go:'☕ தொடங்கு',ph:'தட்டச்சு செய்யவும் அல்லது மைக்…',priv:'🔒 இந்தச் சாதனத்தில் மட்டும். முடிந்ததும் அழிக்கப்படும்.',person:'📞 ஒருவரிடம் பேசுங்கள்'}}[L];
$('#greet').textContent=UI.greet;$('#sub').textContent=UI.sub;$('#go').textContent=UI.go;
$('#txt').placeholder=UI.ph;$('#priv').textContent=UI.priv;$('#person').textContent=UI.person;$('#lang').value=L;$('#bigger').textContent=t('bigger');$('#privnote').textContent=t('privnote');
$('#lang').onchange=e=>reload(e.target.value);
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


const X=(k,v)=>(XS[L][k]||XS.en[k]).replace('{v}',v??'');
$('#txt').placeholder=X('ph');$('#disc').textContent=X('disc');
['s1','s2','s3'].forEach(k=>$('#'+k).textContent=X(k));$('#sub').textContent=X('herosub');

/* ---------- chat plumbing: typing dots, then the reply streams in word by word ---------- */
let idle=null,resume=null,locked=false,st='hero' /* hero/chat = open ELIZA-style listening; the rest = the form flow */,strikes=0,lastAsk=null,lastText='',stream=null,rid=0;
const col=$('#col');
const seg=window.Intl&&Intl.Segmenter?new Intl.Segmenter(L==='zh'?'zh':L,{granularity:'word'}):null;
const tokens=s=>seg?[...seg.segment(s)].map(x=>x.segment):(s.match(/\S+\s*|\s+/g)||[s]);
function scroll(){$('#scroll').scrollTo({top:1e6,behavior:'smooth'})}
function clearChips(){document.querySelectorAll('.chips,.cue').forEach(c=>c.remove())}
function setStep(n){const e=$('#steps');e.innerHTML='';if(!n)return;
  e.append(Object.assign(document.createElement('b'),{textContent:t('step',n)}));
  for(let i=1;i<=6;i++){const d=document.createElement('i');d.className=i<n?'done':i===n?'now':'';e.append(d)}}
function userSays(txt){clearChips();const m=document.createElement('div');m.className='m u';m.innerHTML='<div class="tx"></div>';m.firstChild.textContent=txt;col.append(m);scroll()}
const showForm=on=>$('#main').classList.toggle('showform',on);
function kopiSays(text,{cls='',chips=[],auto=true,idleMs=25000,cue}={}){
  clearChips();clearTimeout(idle);if(stream)stream();
  lastText=text;
  const m=document.createElement('div');m.className='m k '+cls;
  m.innerHTML='<div class="av">☕</div><div class="tx"><div class="body"><span class="dots"><i></i><i></i><i></i></span></div></div>';
  const body=m.querySelector('.body');col.append(m);scroll();
  let done=false,spoke=false,tm;
  const say=()=>{if(auto&&!spoke){spoke=true;speak(text)}};
  const finish=()=>{if(done)return;done=true;clearTimeout(tm);stream=null;say();
    body.textContent=text;
    const h=document.createElement('button');h.className='hear';h.textContent='🔊';h.setAttribute('aria-label','Listen');h.onclick=()=>speak(text);m.querySelector('.tx').append(h);
    const cueTxt=cue||(chips.length>1?t('tap'):'');
    if(cueTxt){const c=document.createElement('div');c.className='cue';c.textContent=cueTxt;col.append(c)}
    if(chips.length){const c=document.createElement('div');c.className='chips';
      chips.forEach(([label,fn])=>{const b=document.createElement('button');b.textContent=label;b.onclick=()=>{clearTimeout(idle);userSays(label);fn()};c.append(b)});col.append(c)}
    scroll();
    if(idleMs&&chips.length)idle=setTimeout(D.quiet,idleMs)};
  stream=finish;
  tm=setTimeout(()=>{say();body.textContent='';
    const tk=tokens(text);let i=0;
    const step=()=>{if(done)return;body.textContent+=tk[i++];scroll();if(i<tk.length)tm=setTimeout(step,/\s/.test(tk[i-1])?10:38);else finish()};step()},600);
}
const ask=(key,chips,opts={})=>{resume=()=>ask(key,chips,opts);lastAsk={chips};kopiSays(opts.text||t(key),{...opts,chips})};
// answer a side question, then put the current question's buttons back
const reply=(key,cls='')=>kopiSays(X(key),{cls,chips:lastAsk?.chips||[],idleMs:st==='chat'||st==='hero'?0:25000});

/* ---------- form panel ---------- */
function spot(id){document.querySelectorAll('.blk').forEach(b=>{b.classList.toggle('spot',b.id===id);const you=id==='b-priv'||id==='b-sub';b.classList.toggle('you',b.id===id&&you);b.dataset.here=b.id!==id?'':id==='b-priv'?t('turn'):id==='b-sub'?t('press'):t('here')});$('#'+id)?.scrollIntoView({block:'center',behavior:'smooth'})}
function setVal(id,v){const e=$('#v-'+id);e.textContent=v||'';e.classList.toggle('done',!!v)}


/* ---------- the guided flow (buttons are suggested replies; typing works for every step too) ---------- */
function begin(){$('#hero').remove();help()}
function help(){st='help';ask('help_q',[[t('yes'),voice],[t('no'),()=>ask('no_msg',[[t('yes'),help]])]])}
function voice(){st='voice';setStep(1);ask('voice_q',[[t('slower'),()=>{rate=Math.max(.5,rate-.15);voice()}],[t('ok'),read]])}
function read(){st='read';setStep(2);showForm(true);spot('b-title');ask('read_i',[[t('next'),()=>field(0)]])}
const F=[{id:'rel',q:'rel_q',o:[['spouse','Spouse'],['parent','Parent']]},{id:'hrs',q:'hrs_q',o:[['part','About 20 hours'],['all','About 70 hours']]}];
function field(n){
  const f=F[n];st=f.id;setStep(3+n);spot('b-'+f.id);setVal(f.id,'');
  ask(f.q,f.o.map(([k,v])=>[t(k),()=>pick(n,k,v)]))}
function pick(n,k,v,say){ // k: option key; v: text for the green box; say: how Kopi reads it back
  strikes=0;st='confirm';setVal(F[n].id,v);
  ask('confirm',[[t('right'),()=>n===0?field(1):priv()],[t('change'),()=>field(n)]],{text:t('confirm',say||t('v_'+k))})}
function priv(){st='priv';setStep(5);spot('b-priv');ask('priv',[[t('done'),submit]],{cue:t('cue_type')});$('#b-priv input').focus({preventScroll:true})}
function submit(){st='submit';spot('b-sub');$('#submit').disabled=false;$('#submit').classList.add('pulse');setStep(6);lastAsk={chips:[]};kopiSays(t('sub'),{cue:t('cue_press')});resume=null}
$('#submit').onclick=()=>{ // always the user's own click
  st='done';$('#submit').disabled=true;$('#submit').classList.remove('pulse');$('#submit').textContent=t('sent');setStep(0);lastAsk=null;kopiSays(t('fin'),{chips:[[t('finish'),()=>reload(L)]],idleMs:0})};

/* ---------- human in the loop ---------- */
const D={
  quiet(){speechSynthesis?.cancel();clearTimeout(idle);const r=resume;
    kopiSays(t('stop_quiet'),{cls:'note',chips:[[t('carry'),()=>r?r():help()]],idleMs:0})},
  person(){clearTimeout(idle);locked=true;st='locked';showForm(false);$('#box').classList.add('off');clearChips();
    kopiSays(t('stop_unsure'),{cls:'hand',idleMs:0});$('#b-priv').classList.remove('spot')},
  scam(){
    const p=document.createElement('div');p.className='popup';
    p.innerHTML='<b>URGENT:</b> Pay a $50 fee within 24 hours to release your grant. Send your OTP.';document.body.append(p);
    // Kopi watches the page for scam wording
    if(SCAM.test(p.textContent)){
      clearTimeout(idle);const r=resume;
      kopiSays(t('stop_scam'),{cls:'alert',chips:[[t('close'),()=>{p.remove();r?r():help()}]],idleMs:0})}}
};
$('#person').onclick=D.person;

/* ---------- understanding what was typed or spoken ----------
   A small rule-based stand-in for the language model: order matters, safety first.
   1 hand-over request  2 scam wording  3 private numbers (never kept)  4 side questions  5 the current step
   Not understood twice in a row -> a person takes over (Kopi never guesses). */
const SCAM=/(pay|send|transfer)[^.]{0,30}(\$|fee|otp|money)|gift ?card|release your grant|\botp\b|one.?time pass|验证码|付款|bayar yuran|கடவுச்சொல்/i;
const PERSON=/(talk|speak|call|connect|get|want|need|bring)[^.]{0,25}(person|human|someone|somebody|officer|staff|hotline)|联系真人|找真人|人工|真人|cakap dengan orang|orang sebenar|ஒருவரிடம்|மனிதரிடம்/i;
const SENSITIVE=/\b[STFGM]\d{7}[A-Z]\b|\d[\d -]{6,}\d|\$\s?\d{3,}|\d{3,}\s?(dollars?|sgd|元|ringgit)/gi;
const YES=/^\s*(?:(?:yes|yeah|yep|ya|ok|okay|sure|please|right|correct|alright|boleh|baik|betul|next|continue|done|finished)\b|y\s*$|好|是|对|行|可以|嗯|继续|填好|ஆம்|சரி|ஆமாம்|முடிந்தது)/i;
const NO=/^\s*(?:(?:no|nope|not|wrong|change|tak|tidak|bukan|jangan)\b|n\s*$|不|没|别|错|இல்லை|வேண்டாம்|தவறு)/i;
const SPOUSE=/husband|wife|spouse|hubby|partner|老公|老婆|丈夫|妻子|先生|太太|爱人|suami|isteri|கணவ|மனைவி/i;
const PARENT=/mother|father|mum|mom|dad|parent|mama|papa|ma\b|妈|爸|母亲|父亲|老人|ibu|bapa|ayah|emak|அம்மா|அப்பா|தாய்|தந்தை|பெற்றோ/i;
const ALLDAY=/all day|whole day|full.?time|24|round the clock|整天|全天|一整天|sepanjang|முழு/i;
const SOMEDAY=/some|part|few|half|little|一部分|几个小时|半天|sebahagian|sikit|கொஞ்ச|சில|பகுதி/i;
const FAQ=[ // [pattern, key]
 [/^\s*(hi|hello|hey|good (morning|afternoon|evening))\b|你好|早安|您好|^\s*helo|selamat (pagi|petang)|வணக்கம்/i,'hi'],
 [/thank|thx|谢谢|多谢|terima kasih|நன்றி/i,'thx'],
 [/are you (a )?(robot|human|real|ai|bot|machine)|who are you|robot|chatgpt|你是谁|机器人|你是真人|siapa (awak|kamu|anda)|நீ யார்|நீங்கள் யார்/i,'ai'],
 [/\b(nric|ic)\b|identity card|身份证|kad pengenalan|அடையாள அட்டை/i,'nric'],
 [/safe|secure|privacy|private|who (sees|can see|reads)|see my|keep my|delete|安全|隐私|保密|privasi|keselamatan|selamatkah|பாதுகாப்பு|தனியுரிமை/i,'safe'],
 [/how much|eligible|qualify|will i get|能拿|多少钱|能不能拿|berapa banyak|layak|எவ்வளவு கிடைக்கும்|தகுதி/i,'money'],
 [/how long|how many (steps|minutes)|多久|多长时间|几步|berapa lama|எவ்வளவு நேரம்/i,'time'],
 [/what('?s| is) (this|the|that)|about (this|the)|explain|grant|什么|津贴|apa (itu|ini)|geran|borang ini|மானியம்|என்ன/i,'grant'],
 [/bigger|larger|too small|can'?t see|font|字太小|大一点|大字|besar|tulisan kecil|பெரிதா|சிறிய/i,'bigger'],
 [/louder|volume|can'?t hear|cannot hear|听不到|听不见|大声|kuat sikit|tak dengar|சத்தமாக|கேட்கவில்லை/i,'loud'],
 [/slow|慢|perlahan|மெதுவ/i,'slow'],
 [/again|repeat|pardon|come again|再说|重复|再读|ulang|மீண்டும்/i,'again']];

function heard(txt){
  txt=txt.trim();if(!txt||locked)return;
  // private numbers never go into the chat log
  const redacted=txt.replace(SENSITIVE,'••••');
  if(redacted!==txt){userSays(redacted);if(st==='hero')openChat();return reply('sens','alert')}
  // a typed answer that matches a button label acts like tapping it
  const btn=[...document.querySelectorAll('.chips button')].find(b=>txt.toLowerCase()===b.textContent.toLowerCase());
  if(btn){btn.click();return}
  userSays(txt);
  if(PERSON.test(txt))return D.person();
  if(SCAM.test(txt)){clearTimeout(idle);const r=resume;return kopiSays(t('stop_scam'),{cls:'alert',chips:[[t('close'),()=>r?r():help()]],idleMs:0})}
  const open=st==='hero'||st==='chat';
  if(open&&st==='hero')openChat();
  // asking for the form is the only way into the guided flow
  if(open&&FORMREQ.test(txt)){strikes=0;return help()}
  for(const [re,k] of FAQ){ if(!re.test(txt))continue;
    if(k==='again'&&txt.length>25)continue;
    if(k==='again'){strikes=0;return kopiSays(lastText,{chips:lastAsk?.chips||[]})}
    if(k==='slow'){rate=Math.max(.5,rate-.15);if(st==='voice')return voice();return reply('slow')}
    if(k==='loud'){lastText&&speak(lastText);return reply('loud')}
    if(k==='grant'&&!/grant|form|津贴|表|geran|borang|மானியம்|படிவ/i.test(txt)&&st!=='help')break; // plain "what" mid-step isn't a question about the grant
    strikes=0;return reply(k)}
  if(!open&&stepAnswer(txt))return;
  // everything else: Kopi listens ELIZA-style, then offers the form again
  const r=listen(txt);
  if(r.hand){locked=true;st='locked';showForm(false);$('#box').classList.add('off');return kopiSays(r.text||t('stop_unsure'),{cls:'hand',idleMs:0})}
  if(!open&&++strikes>=3)return D.person(); // lost inside the form flow: hand over, never guess
  kopiSays(r.text,{chips:lastAsk?.chips||[],idleMs:open?0:25000});
}
// ELIZA-style listening (eliza.js): validates and asks gently; never advises
const listen=txt=>ELIZA.respond(txt,L);
const FORMREQ=/(help|assist|show|teach|guide)[^.]{0,25}(form|apply|application|grant)|(fill|apply)[^.]{0,25}(form|grant|application)?|^\s*(the )?form\b|帮.{0,6}(填|表|申请)|填表|申请|isi borang|bantu.{0,15}borang|mohon|படிவ[^.]{0,10}(நிரப்|உதவ)|விண்ணப்/i;
function openChat(){$('#hero').remove();st='chat';lastAsk={chips:[[X('s1'),help]]}}
function stepAnswer(txt){
  const yes=YES.test(txt),no=NO.test(txt);
  switch(st){
   case 'help': if(yes){strikes=0;voice();return true} if(no){strikes=0;ask('no_msg',[[t('yes'),help]]);return true} return false;
   case 'voice': if(yes||/hear|clear|ok|听得|dengar/i.test(txt)){strikes=0;read();return true} return false;
   case 'read': if(yes){strikes=0;field(0);return true} return false;
   case 'rel': {const k=SPOUSE.test(txt)?'spouse':PARENT.test(txt)?'parent':null;
     if(k){pick(0,k,F[0].o.find(o=>o[0]===k)[1]);return true} return false}
   case 'hrs': {const n=+(txt.match(/\d+/)||[])[0];
     if(n>0&&n<=168){const known=n===20?'part':n===70?'all':null;
       pick(1,known,known?F[1].o.find(o=>o[0]===known)[1]:n+' hours',known?null:X('hrs_n',n));return true}
     const k=ALLDAY.test(txt)?'all':SOMEDAY.test(txt)?'part':null;
     if(k){pick(1,k,F[1].o.find(o=>o[0]===k)[1]);return true} return false}
   case 'confirm': {const c=lastAsk.chips; if(yes){strikes=0;c[0][1]();return true} if(no){strikes=0;c[1][1]();return true} return false}
   case 'priv': if(yes){strikes=0;submit();return true} strikes=0;reply('pvr');return true;
   case 'submit': strikes=0;reply('sbr');return true;
  } return false}

$('#send').onclick=()=>{const v=$('#txt').value;$('#txt').value='';$('#send').disabled=true;heard(v)};
$('#txt').oninput=()=>{$('#send').disabled=!$('#txt').value.trim()};$('#send').disabled=true;
$('#txt').onkeydown=e=>{if(e.key==='Enter')$('#send').click()};
$('#mic').onclick=()=>{
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return;
  const r=new SR();r.lang=VOICE[L];$('#mic').classList.add('on');
  r.onresult=e=>heard(e.results[0][0].transcript);r.onend=r.onerror=()=>$('#mic').classList.remove('on');r.start()};
$('#go').onclick=begin;
$('#s1').onclick=begin;
const side=k=>{userSays(X(k==='grant'?'s2':'s3'));openChat();reply(k)};
$('#s2').onclick=()=>side('grant');
$('#s3').onclick=()=>side('safe');
