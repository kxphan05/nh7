// ELIZA engine (keyword ranking, reflection, memory). Shared by eliza.html and the main Kopi chat.
const ELIZA=(()=>{
// ---- reflection: swap viewpoint so the echo reads naturally ----
const REFL={am:'are',was:'were',i:'you',"i'd":'you would',"i've":'you have',"i'll":'you will',my:'your',are:'am',"you've":'I have',"you'll":'I will',your:'my',yours:'mine',you:'me',me:'you',myself:'yourself',yourself:'myself',mum:'mum'};
const reflect=s=>s.replace(/[.!?]+$/,'').split(/\s+/).map(w=>REFL[w.toLowerCase()]??w).join(' ');

// ---- script: [keyword, rank, [[decomposition regex, [reassembly...]], ...]] ; (1) = captured part, reflected ----
const S=[
 ['sorry',0,[[/./,['Please don\'t apologise. You are doing your best.','No need to be sorry. What made you say that?']]]],
 ['remember',5,[[/i remember (.*)/i,['Do you often think of (1)?','What else comes to mind when you think of (1)?']],[/./,['What do you remember?']]]],
 ['dream',3,[[/./,['What does that dream suggest to you?','Do you dream often?']]]],
 ['tired',6,[[/./,['Caring for someone is tiring. How long have you been this tired?','When did you last get a proper rest?','Is there anyone who can take over for a few hours?']]]],
 ['exhausted',6,[[/./,['Caring for someone is tiring. How long have you been this tired?','Is there anyone who can take over for a few hours?']]]],
 ['alone',6,[[/./,['Do you feel alone in looking after them?','Who else knows how hard this has been for you?']]]],
 ['lonely',6,[[/./,['Do you feel alone in looking after them?','Who else knows how hard this has been for you?']]]],
 ['form',5,[[/./,['What is it about the form that troubles you?','Which part of the form do you find hardest?','How do you feel when you look at the screen?']]]],
 ['phone',4,[[/./,['Tell me more about how the phone makes you feel.','What happens when you try to use it?']]]],
 ['app',4,[[/./,['What is difficult about the app for you?','Has anyone shown you how to use it?']]]],
 ['grant',5,[[/./,['What do you hope the grant would help with?','Have you tried to apply before? What happened?']]]],
 ['money',5,[[/./,['Are money worries part of what is on your mind?','How does that affect your caring?']]]],
 ['hospital',4,[[/./,['What happens when you go to the hospital?','How do you feel about those visits?']]]],
 ['husband',7,[[/./,['Tell me more about your husband.','How long have you looked after him?','How does looking after your husband make you feel?']]]],
 ['wife',7,[[/./,['Tell me more about your wife.','How long have you looked after her?','How does looking after your wife make you feel?']]]],
 ['mother',7,[[/./,['Tell me more about your mother.','What is your mother like these days?','How does looking after your mother make you feel?']]]],
 ['father',7,[[/./,['Tell me more about your father.','What is your father like these days?','How does looking after your father make you feel?']]]],
 ['son',3,[[/./,['Does your son know how you feel?','Does your son help you?']]]],
 ['daughter',3,[[/./,['Does your daughter know how you feel?','Does your daughter help you?']]]],
 ['family',3,[[/./,['Tell me more about your family.','Who in your family do you talk to?']]]],
 ['i am',1,[[/i am (.*)/i,['How long have you been (1)?','Do you believe it is normal to be (1)?','Do you enjoy being (1)?','Why do you tell me you are (1)?']]]],
 ['i\'m',1,[[/i'?m (.*)/i,['How long have you been (1)?','Why do you tell me you are (1)?']]]],
 ['i feel',2,[[/i feel (.*)/i,['Tell me more about feeling (1).','Do you often feel (1)?','When you feel (1), what do you do?']]]],
 ['i can\'t',2,[[/i can'?t (.*)/i,['What makes you think you can\'t (1)?','Have you tried to (1)?','Perhaps you could (1) with some help. What kind of help?']]]],
 ['i don\'t',2,[[/i don'?t (.*)/i,['Why don\'t you (1)?','Do you wish you could (1)?']]]],
 ['i want',2,[[/i want (.*)/i,['What would it mean to you if you got (1)?','Why do you want (1)?','What if you never got (1)?']]]],
 ['i need',2,[[/i need (.*)/i,['Why do you need (1)?','Would it really help you to get (1)?','Are you sure you need (1)?']]]],
 ['i have',2,[[/i have (.*)/i,['How do you feel about having (1)?','Why do you tell me you have (1)?']]]],
 ['because',1,[[/./,['Is that the real reason?','What other reasons come to mind?']]]],
 ['why',1,[[/why don'?t you (.*)/i,['Do you believe I don\'t (1)?','Perhaps I will (1) in good time.']],[/why can'?t i (.*)/i,['Do you think you should be able to (1)?','What would it take for you to (1)?']],[/./,['Why do you ask?','What do you think?']]]],
 ['yes',0,[[/./,['You seem quite sure.','I see. Can you say more?']]]],
 ['no',0,[[/./,['Why not?','Are you saying no just to be safe?']]]],
 ['always',1,[[/./,['Can you think of a specific time?','Really, always?']]]],
 ['computer',2,[[/./,['Do computers worry you?','What do you think machines have to do with this?']]]],
 ['you',0,[[/you are (.*)/i,['What makes you think I am (1)?','Does it please you to believe I am (1)?']],[/./,['We were talking about you, not me.','Let\'s keep to you. Please go on.']]]],
 ['hello',0,[[/./,['Hello. I am Kopi. What is on your mind today?']]]],
 ['hi',0,[[/^hi\b/i,['Hello. I am Kopi. What is on your mind today?']]]],
 ['thank',0,[[/./,['You are welcome. Is there more you want to say?']]]],
 ['bye',9,[[/./,['QUIT:Goodbye. Take care of yourself too, not only them.']]]],
];
const FALLBACK=['Please go on.','Tell me more about that.','I see. How does that make you feel?','Can you say more about that?','What does that suggest to you?'];
const MEMORY_KEYS=['my'];
// ---- safety first: this is a listener, not a counsellor ----
const CRISIS=/suicid|kill myself|end it all|hurt myself|want to die|don'?t want to live|abuse|hit (him|her|me)|can'?t go on/i;
const SCAM=/\botp\b|gift ?card|pay.{0,20}(fee|\$)|release your grant/i;

const used={};let mem=[];
function pick(key,i,list){used[key+i]=((used[key+i]??-1)+1)%list.length;return list[used[key+i]]}
function respond(raw){
  const txt=raw.trim();
  if(CRISIS.test(txt))return{hand:true,text:'I am only a simple program, and this is too important for me to guess. Please talk to a real person now: call the Samaritans of Singapore 24-hour hotline at 1767, or the Caregivers Hotline. A human will take over from here.'};
  if(SCAM.test(txt))return{hand:true,text:'Please stop. Don\'t pay anything or share any code. This looks like a scam. Real agencies never ask for that. Call the ScamShield helpline 1799 to check.'};
  const low=' '+txt.toLowerCase().replace(/[^\w\s']/g,' ').replace(/\s+/g,' ')+' ';
  // collect keywords that appear, highest rank first
  const hits=S.filter(k=>low.includes(' '+k[0]+' ')||(k[0].includes(' ')&&low.includes(k[0]))).sort((a,b)=>b[1]-a[1]);
  // memory: remember something said with "my ..." for later
  const my=txt.match(/\bmy ([\w' ]{3,40})/i);
  for(const [kw,,rules] of hits){
    for(const [re,answers] of rules){
      const m=txt.match(re);if(!m)continue;
      let a=pick(kw+re,0,answers);
      if(a.startsWith('QUIT:'))return{text:a.slice(5),quit:true};
      a=a.replace('(1)',m[1]?reflect(m[1].trim()):'that');
      if(my&&kw!=='i am')mem.push(reflect(my[1]).replace(/^your /,''));
      return{text:a}}}
  // nothing matched: use something they said earlier, else a neutral prompt
  if(mem.length&&Math.random()<.5)return{text:'Earlier you spoke of your '+mem.shift()+'. Tell me more about that.'};
  if(my)mem.push(reflect(my[1]));
  return{text:pick('fb',0,FALLBACK)};
}


return{respond}})();
