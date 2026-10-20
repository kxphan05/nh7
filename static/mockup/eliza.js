// ELIZA-style listener for Kopi: keyword ranking, rotating replies and a memory of who is being cared for.
// Every reply is a fixed sentence (nothing is echoed back), so each one can be pre-recorded with a natural voice.
// Replies aim at emotional support for older caregivers: validate, normalise, gently ask, never give medical advice.
// Shared by eliza.html and the main Kopi chat (app.js). tools/make_audio.py reads ELIZA.lines().
const ELIZA=(()=>{
// ---------------------------------------------------------------- English
const EN={
 cats:[ // [name, rank, pattern, replies]
  ['grief',9,/died|passed away|passed on|funeral|miss him|miss her|widow|late husband|late wife|bereave|lost my/i,[
   'I am so sorry for your loss. Grief takes its own time.',
   'Missing someone is a sign of how much you loved them.',
   'Would you like to tell me about them?',
   'There is no right way to grieve. Please be gentle with yourself.']],
  ['exhausted',8,/tired|exhausted|worn out|no rest|can'?t sleep|cannot sleep|sleepless|burnt out|burn out|burnout|drained|no energy/i,[
   'Aiyo, that sounds really tiring. You have been carrying so much.',
   'No wonder you feel so worn out lah. Caring for someone every day is hard work.',
   'You matter too, you know. When was the last time you got a proper rest?',
   'Being tired does not mean you are failing. It means you have been giving a lot.',
   'Got anyone who can sit with them for an hour, so you can rest?',
   'Please take care of yourself today, okay? Even a few quiet minutes can help.']],
  ['lonely',8,/\balone\b|lonely|nobody|no one|by myself|isolated|no friends|no visitors|no company/i,[
   'Aiyo, I am sorry it feels so lonely. I am here, and I am listening.',
   'Looking after someone can make the days feel very quiet. Who would you like to talk to more?',
   'You are not alone in this, okay? Many caregivers feel just the same.',
   'Would it help to tell me more about your day?',
   'Even a short chat with a neighbour or an old friend downstairs can lift the heart a little.']],
  ['sad',8,/\bsad\b|\bcry\b|crying|cried|depress|feeling down|hopeless|empty inside|unhappy|miserable|heavy heart|low mood/i,[
   'I am sorry you are feeling so down. It is okay to feel this way.',
   'Crying is not weakness. It is what a caring heart does when it is tired.',
   'Thank you for telling me. Not easy to say, I know.',
   'Take your time, no need to rush. I am not going anywhere.',
   'What has been weighing on you the most?']],
  ['guilt',8,/guilty|guilt|my fault|should have|not enough|not good enough|failing|failed|bad (wife|husband|daughter|son)|can'?t do enough/i,[
   'You are doing much more than you give yourself credit for.',
   'Feeling guilty is very common among caregivers. It means you care a lot.',
   'Nobody can do everything perfectly. You are trying your best, and that is enough.',
   'If a good friend told you this, what would you say to them?',
   'You are not failing. You are tired, and that is different.']],
  ['overwhelmed',8,/too much|overwhelm|cannot cope|can'?t cope|how to cope|can'?t take it|cannot take|too many|everything at once|don'?t know what to do|no idea what to do|at my limit/i,[
   'Wah, that is a lot for one person to carry. Let us slow down together.',
   'You do not have to do everything at once. What feels most urgent right now?',
   'It is okay to ask for help. That is not weakness, that is being wise.',
   'Let us just take one small thing at a time.']],
  ['worry',7,/worr(y|ied|ies)|anxious|anxiety|scared|afraid|\bfear|what if|nervous|panic|stress/i,[
   'Of course you worry, because you love them. Let us take it one small step at a time.',
   'That sounds frightening. What worries you the most right now?',
   'Don\'t worry, you do not have to solve everything today. Just the next small thing.',
   'Take a slow breath with me. In, and out. Better already?',
   'Worrying shows how much you care. But you deserve some peace too.']],
  ['anger',7,/angry|frustrat|fed up|annoyed|shout|snapped|snap at|impatient|irritat|resent|lose my temper|lost my temper/i,[
   'Aiyo, it is okay to feel frustrated. It does not make you a bad person.',
   'Everyone loses patience sometimes, especially when tired. Don\'t be too hard on yourself.',
   'What happened that made you feel this way?',
   'Sometimes stepping out for a few minutes helps. Is that possible for you?',
   'Frustration is often a sign that you need some support.']],
  ['health',7,/\bsick\b|\bill\b|illness|\bpain|\bfall\b|\bfell\b|dementia|forget|hospital|doctor|medicine|medication|stroke|diabetes|cancer|bedridden|wheelchair|getting worse|\bworse\b|dying|alzheimer/i,[
   'Aiyo, I am sorry. It must be hard to watch someone you love go through that.',
   'That sounds worrying. Have the doctors or nurses been able to guide you?',
   'I am only a simple helper, so I cannot give medical advice. But I can listen. How are you coping with it?',
   'Seeing them struggle must hurt. What has been the hardest part?',
   'Please do speak to their doctor or nurse about it. In the meantime, how are you holding up?']],
  ['money',6,/money|expensive|\bcosts?\b|bills|afford|\bpoor\b|debt|income|salary|savings|pay for/i,[
   'Money worries add so much stress on top of everything. I am sorry.',
   'Many caregivers feel this squeeze. There may be support, and I can help you with the grant form if you like.',
   'That sounds stressful. How long has this been worrying you?',
   'You are not the only one facing this. Let us see if the grant can ease it a little.']],
  ['tech',5,/phone|\bapp\b|screen|\beyes\b|eyesight|can'?t see|cannot see|blur|small words|tiny|online|website|password|internet|computer|singpass|too small|confusing/i,[
   'Small words and busy screens are hard when your eyes are tired. It is not your fault at all.',
   'Many people find these online forms very confusing. You are not alone.',
   'I can help with that. I can read the page aloud, one step at a time. Just tell me you want help with the form.',
   'That sounds frustrating. Would you like me to guide you through the form?']],
  ['family',4,/\bson\b|daughter|children|family|sibling|brother|sister|relatives|grandchild|grandson|granddaughter|nobody helps|no one helps|don'?t help/i,[
   'Family can be a comfort, and sometimes a worry too. Tell me more.',
   'Do they know how hard this has been for you?',
   'It can hurt when others do not help. What would you like from them?',
   'Sometimes it helps to ask for one specific thing, like an afternoon off. Can or not?']],
  ['husband',3,/husband/i,[
   'Tell me about your husband. How is he these days?',
   'How long have you been looking after him?',
   'It takes a lot of love to care for a husband every day. How are you feeling about it?']],
  ['wife',3,/\bwife\b/i,[
   'Tell me about your wife. How is she these days?',
   'How long have you been looking after her?',
   'It takes a lot of love to care for a wife every day. How are you feeling about it?']],
  ['mother',3,/mother|\bmum\b|\bmom\b|\bmama\b|\bma\b/i,[
   'Tell me about your mother. How is she these days?',
   'How long have you been looking after her?',
   'It takes a lot of love to care for a mother every day. How are you feeling about it?']],
  ['father',3,/father|\bdad\b|\bpapa\b/i,[
   'Tell me about your father. How is he these days?',
   'How long have you been looking after him?',
   'It takes a lot of love to care for a father every day. How are you feeling about it?']],
  ['positive',3,/\bhappy\b|\bgood\b|\bbetter\b|\bgreat\b|\bglad\b|grateful|thankful|blessed|proud|wonderful|\bsmile|enjoy/i,[
   'Wah, that is lovely to hear. I am glad.',
   'You deserve good days. What made today better?',
   'It is good to hold on to moments like that. Thank you for sharing.',
   'That makes me happy too. Tell me more.']],
  ['okay',2,/i'?m fine|i am fine|\bokay\b|\bok\b|not bad|so so|alright|managing|i manage/i,[
   'Good, good. Is there anything small that has been bothering you?',
   'Sometimes we say we are fine when we are a little tired. It is okay if you are not.',
   'Thank you for telling me. How are you really feeling?']],
  ['hello',1,/^\s*(hi|hello|hey|good (morning|afternoon|evening))\b/i,[
   'Hello! I am Kopi. How are you feeling today?',
   'Good day. So nice to hear from you. How have you been?']],
  ['thanks',1,/thank|thx/i,[
   'You are most welcome. I am happy to keep you company.',
   'Anytime. Take your time, okay?']],
  ['ai',1,/are you (a )?(robot|human|real|ai|bot|machine)|who are you|what are you/i,[
   'I am Kopi, a computer helper. I am not a person, but I am happy to listen.']],
  ['help',1,/\bhelp\b/i,[
   'I am here for you. Tell me what is on your mind, or say you would like help with the form.']],
  ['dunno',1,/don'?t know|not sure|no idea|nothing/i,[
   'That is okay. We do not have to know. Just tell me whatever comes to mind.']],
  ['yes',0,/^\s*(yes|yeah|yep|ya)\b/i,['I see. Want to tell me more?']],
  ['no',0,/^\s*(no|nope)\b/i,['Okay lah. Take your time.']],
  ['bye',9,/\bbye\b|goodbye|see you/i,['QUIT:Goodbye, take care. Look after yourself too, not only them.']]],
 fallback:[
  'I see, I see. Please go on.','Tell me more about that.','I am listening. No need to rush.','Thank you for sharing that with me.',
  'How does that make you feel?','That sounds like a lot. What is it like for you?','I am here. Say as much or as little as you like.',
  'And how are you taking care of yourself through all this?'],
 callback:{
  husband:'Earlier you spoke of your husband. How is he doing today?',
  wife:'Earlier you spoke of your wife. How is she doing today?',
  mother:'Earlier you spoke of your mother. How is she doing today?',
  father:'Earlier you spoke of your father. How is he doing today?'},
 crisis:/suicid|kill myself|end it all|hurt myself|want to die|don'?t want to live|abuse|hit (him|her|me)|can'?t go on/i,
 crisisText:'I am only a simple program, and this is too important for me to guess. Please talk to a real person now. You can call the Samaritans of Singapore at 1767, any time of day or night. A human will take over from here.',
 scam:/\botp\b|gift ?card|pay.{0,20}(fee|\$)|release your grant/i,
 scamText:'Please stop. Do not pay anything or share any code. This looks like a scam. Real agencies never ask for that. You can call the ScamShield helpline at 1799 to check.'};

// ---------------------------------------------------------------- other languages (shorter, same idea)
const ZH={cats:[
  ['guilt',8,/内疚|自责|对不起|没做好/,['你做的，比你以为的多得多。','没有人能把每件事都做得完美。你已经尽力了，这就够了。']],
  ['exhausted',8,/累|疲惫|没睡|睡不着|撑不住|辛苦/,['听起来你真的很累。你已经付出了很多。','难怪你会觉得疲惫。每天照顾一个人，真的很辛苦。','你也很重要。上一次好好休息是什么时候？']],
  ['lonely',8,/孤单|寂寞|没人|一个人/,['很抱歉你觉得这么孤单。我在这里，我在听。','你并不孤单，很多照顾家人的人都有同样的感受。','想不想多告诉我一些你今天的事？']],
  ['sad',8,/难过|伤心|哭|难受|心情不好|郁闷/,['听到你心情不好，我很难过。有这样的感觉是可以的。','哭并不是软弱，是一颗关心人的心累了。','慢慢说，我哪里也不去。']],
  ['worry',7,/担心|害怕|焦虑|怕/,['你爱一个人，才会担心，这很自然。我们一步一步来。','你不用今天就解决所有事情，只要做下一件小事。','跟我一起慢慢深呼吸，吸气，呼气。好一点了吗？']],
  ['anger',7,/烦|生气|发火|受不了/,['觉得烦躁是可以的，这不代表你是坏人。','每个人累的时候都会失去耐心，请不要太苛责自己。']]],
 fallback:['我明白。请继续说。','请多说一点。','谢谢你告诉我。','慢慢说，我在听。','这对你来说一定不容易。','你想说多少都可以，我在这里。'],
 crisis:/自杀|想死|不想活|伤害自己/};
const MS={cats:[
  ['guilt',8,/rasa bersalah|salah saya|tak cukup baik/i,['Anda lakukan lebih banyak daripada yang anda sangka.','Tiada siapa boleh buat segalanya dengan sempurna. Anda sudah berusaha, dan itu cukup.']],
  ['exhausted',8,/penat|letih|tak cukup tidur|tak dapat tidur|kepenatan/i,['Bunyinya anda memang sangat penat. Anda sudah memberi banyak.','Tak hairanlah anda letih. Menjaga seseorang setiap hari memang kerja yang berat.','Anda pun penting. Bila kali terakhir anda dapat berehat dengan betul?']],
  ['lonely',8,/sunyi|sepi|seorang diri|tiada siapa|keseorangan/i,['Maaf anda rasa begitu sunyi. Saya ada di sini, dan saya mendengar.','Anda tidak keseorangan. Ramai penjaga rasa perkara yang sama.','Mahu ceritakan sedikit tentang hari anda?']],
  ['sad',8,/sedih|menangis|murung|susah hati/i,['Maaf anda rasa begitu sedih. Tak apa untuk rasa begitu.','Menangis bukan tanda lemah. Itu hati yang prihatin yang sudah penat.','Ambil masa anda. Saya tak ke mana-mana.']],
  ['worry',7,/risau|bimbang|takut|cemas/i,['Wajar untuk risau bila kita sayang seseorang. Kita ambil satu langkah kecil demi satu langkah.','Anda tak perlu selesaikan semuanya hari ini. Cuma satu perkara kecil seterusnya.','Tarik nafas perlahan-lahan bersama saya. Tarik, dan hembus. Rasa lebih tenang sedikit?']],
  ['anger',7,/marah|geram|hilang sabar|tertekan/i,['Tak apa untuk rasa geram. Itu tidak menjadikan anda orang jahat.','Semua orang hilang sabar bila penat. Tolong jangan terlalu keras pada diri sendiri.']]],
 fallback:['Saya faham. Teruskan.','Ceritakan lagi.','Terima kasih kerana berkongsi.','Ambil masa anda. Saya mendengar.','Itu pasti tidak mudah untuk anda.','Katalah sebanyak atau sedikit yang anda mahu. Saya ada di sini.'],
 crisis:/bunuh diri|nak mati|tak mahu hidup|mencederakan diri/i};
const TA={cats:[
  ['guilt',8,/குற்ற|என் தவறு/,['நீங்கள் நினைப்பதைவிட நிறையவே செய்கிறீர்கள்.','யாரும் எல்லாவற்றையும் முழுமையாகச் செய்ய முடியாது. நீங்கள் முயன்றீர்கள், அதுவே போதும்.']],
  ['exhausted',8,/சோர்வ|களைப்|தூக்கம்|ஓய்வு/,['நீங்கள் மிகவும் சோர்வாக இருப்பது புரிகிறது. நீங்கள் நிறைய செய்திருக்கிறீர்கள்.','தினமும் ஒருவரைப் பராமரிப்பது கடினமான வேலை. சோர்வடைவது இயல்புதான்.','நீங்களும் முக்கியம். கடைசியாக எப்போது நன்றாக ஓய்வெடுத்தீர்கள்?']],
  ['lonely',8,/தனிமை|தனியாக|யாரும் இல்லை/,['இவ்வளவு தனிமையாக உணர்வதற்கு வருந்துகிறேன். நான் இங்கே இருக்கிறேன், கேட்கிறேன்.','நீங்கள் தனியாக இல்லை. பல பராமரிப்பாளர்கள் இப்படித்தான் உணர்கிறார்கள்.','உங்கள் நாளைப் பற்றி கொஞ்சம் சொல்கிறீர்களா?']],
  ['sad',8,/வருத்த|அழ|சோகம்|துக்க/,['நீங்கள் வருத்தமாக இருப்பது எனக்கு வருத்தம். அப்படி உணர்வது சரிதான்.','அழுவது பலவீனம் அல்ல. அது அக்கறையுள்ள மனம் சோர்ந்ததன் அடையாளம்.','மெதுவாகச் சொல்லுங்கள். நான் எங்கும் போகவில்லை.']],
  ['worry',7,/பயம்|பயந்|கவலை|பதற்ற/,['ஒருவரை நேசிக்கும்போது கவலைப்படுவது இயல்பு. ஒவ்வொரு சிறு படியாகச் செல்வோம்.','எல்லாவற்றையும் இன்றே தீர்க்க வேண்டியதில்லை. அடுத்த சிறு விஷயம் மட்டும் போதும்.','என்னுடன் மெதுவாக மூச்சு விடுங்கள். உள்ளே, வெளியே. கொஞ்சம் நன்றாக இருக்கிறதா?']],
  ['anger',7,/கோபம்|எரிச்சல்/,['எரிச்சலாக இருப்பது பரவாயில்லை. அது உங்களைக் கெட்டவராக்காது.','சோர்வாக இருக்கும்போது எல்லோரும் பொறுமை இழப்பார்கள். உங்களிடம் மிகவும் கடுமையாக இருக்காதீர்கள்.']]],
 fallback:['புரிகிறது. தொடருங்கள்.','இன்னும் சொல்லுங்கள்.','பகிர்ந்ததற்கு நன்றி.','மெதுவாகச் சொல்லுங்கள். நான் கேட்கிறேன்.','அது உங்களுக்கு எளிதாக இருந்திருக்காது.','நீங்கள் விரும்பும் அளவு சொல்லுங்கள். நான் இங்கே இருக்கிறேன்.'],
 crisis:/தற்கொலை|சாக வேண்டும்|என்னையே காயப்படுத்/};
const DATA={en:EN,zh:ZH,ms:MS,ta:TA};

// ---------------------------------------------------------------- engine
const turn={};            // rotation position per category, started at a random place so repeat visitors hear different openings
const pos=(k,n)=>{turn[k]=((turn[k]??Math.floor(Math.random()*n))+1)%n;return turn[k]};
let mem=[],used=new Set(),asked=0;

function respond(raw,lang='en'){
  const D=DATA[lang]||EN,txt=raw.trim();
  if(D.crisis.test(txt))return{hand:true,text:D.crisisText||null};
  if(D.scam&&D.scam.test(txt))return{hand:true,text:D.scamText};
  const hits=D.cats.filter(c=>c[2].test(txt)).sort((a,b)=>b[1]-a[1]);
  if(lang==='en'){ // remember who is being cared for, to ask after them later
    for(const r of Object.keys(EN.callback))if(new RegExp(r==='mother'?'mother|\\bmum\\b|\\bmom\\b':r==='father'?'father|\\bdad\\b':r,'i').test(txt)&&!mem.includes(r))mem.push(r)}
  asked++;
  if(hits.length){
    const [name,,,say]=hits[0];
    let a=say[pos(lang+name,say.length)];
    if(a.startsWith('QUIT:'))return{text:a.slice(5),quit:true};
    return{text:a}}
  if(lang==='en'){
    const r=mem.find(x=>!used.has(x));
    if(r&&asked>2){used.add(r);return{text:EN.callback[r]}}}
  return{text:D.fallback[pos(lang+'fb',D.fallback.length)]};
}

// every sentence that can be spoken, per language (for pre-recording)
function lines(){
  const out={};
  for(const [l,D] of Object.entries(DATA)){
    const s=new Set();
    D.cats.forEach(c=>c[3].forEach(x=>s.add(x.replace(/^QUIT:/,''))));
    D.fallback.forEach(x=>s.add(x));
    if(D.callback)Object.values(D.callback).forEach(x=>s.add(x));
    if(D.crisisText)s.add(D.crisisText);
    if(D.scamText)s.add(D.scamText);
    out[l]=[...s]}
  return out}
return{respond,lines}})();
if(typeof module!=='undefined')module.exports=ELIZA;
