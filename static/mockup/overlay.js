// Text for the "Kopi on a website" demo (overlay.html). The page content is adapted (paraphrased) from the public
// Home Caregiving Grant page of the Agency for Integrated Care: https://www.aic.sg/Financial-Assistance/Home-Caregiving-Grant
// Everything Kopi says here is pre-recorded by tools/make_audio.py (it calls OV.lines()); re-run it after editing wording.
const OV={
 // the page, block by block: what is read aloud, and the plain-language explanation
 blocks:[
  {id:'intro',read:'Home Caregiving Grant. Monthly cash payouts to help families caring for a person with moderate to severe disabilities.',
   explain:'This is money paid every month to families who look after someone who needs a lot of help. You can use it for things like hiring a helper or buying healthcare items.'},
  {id:'who',read:'Who can get it. The person you care for must be a Singapore Citizen, or a PR with a parent, child or spouse who is a living Singapore Citizen. They must live in Singapore, and not in a nursing home.',
   explain:'In simple words, the person you look after must be a Singapore citizen, or a PR with a close family member who is a citizen. They must live at home, not in a nursing home.'},
  {id:'needs',read:'They must permanently need help with at least three of the six daily activities. A disability assessment confirms this.',
   explain:'The person must need help with at least three everyday things, for example washing, dressing or eating. A doctor, nurse or therapist checks this and fills in a report.'},
  {id:'income',read:'Means test. The household monthly income per person must be 4,800 dollars or less.',
   explain:'Add up everyone\'s monthly income in the house, then divide by the number of people. If the answer is 4,800 dollars or less, you may qualify.'},
  {id:'tiers',read:'Payouts. 600 dollars a month if the income per person is up to 1,500 dollars. 400 dollars if it is 1,501 to 3,600 dollars. 200 dollars if it is 3,601 to 4,800 dollars.',
   explain:'The lower your household income per person, the more you get each month. The payout is between 200 and 600 dollars.'},
  {id:'apply',read:'How to apply. Apply online on AIC\'s eFASS website with Singpass, which is quicker. Or email apply at A I C dot S G, or visit an AIC Link. Paper applications take longer.',
   explain:'The fastest way is online with your Singpass. If that is hard for you, you can ask for a paper form by email or at an AIC Link, but it takes longer.'},
  {id:'time',read:'Processing can take up to four weeks. You will be told the result by mail.',
   explain:'After you apply, it can take up to four weeks. A letter will tell you the result.'},
  {id:'scam',read:'Scam warning. AIC staff will never ask you to transfer money or share your bank log-in details over the phone. If in doubt, call the ScamShield helpline at 1799.',
   explain:'If someone phones and says they are from AIC, and asks for money or your bank log-in details, it is a scam. Please do not give anything, and call 1799.'}],
 say:{
  hello:'Hi, I am Kopi. I can read this page aloud, explain it in simple words, help you fill in the form, and warn you about scams. What would you like?',
  readStart:'Okay, I will read this page for you. Tap the speaker again if you want me to stop.',
  readEnd:'That is the end of the page. Would you like me to explain any part?',
  readStop:'Okay, I have stopped.',
  explainPrompt:'Tap any part of the page, and I will explain it in simple words.',
  explainMore:'Tap another part if you like, or choose something else below.',
  explainNote:'This is a general explanation. I cannot tell if you qualify, so please ask a person about your own case.',
  formIntro:'Sure. I will help with the form on this page, one box at a time. I only fill in the boxes that are not private.',
  relQ:'First, who do you look after? Please tap one button below.',
  relConfirmSpouse:'I have put your husband or wife in the box. Is that right?',
  relConfirmParent:'I have put your mother or father in the box. Is that right?',
  hrsQ:'Next, about how many hours a week do you look after them? Please tap one button below.',
  hrsConfirm20:'I have put about 20 hours a week in the box. Is that right?',
  hrsConfirm70:'I have put about 70 hours a week in the box. Is that right?',
  hrsConfirmN:'I have put that number of hours a week in the box. Is that right?',
  privQ:'Now it is your turn. Please type your NRIC and bank account number in the boxes yourself. I will not look. When you finish, tap "I am done".',
  submitQ:'Last step. Please press the blue Submit button on the page yourself. I never press it for you.',
  sent:'All done, well done! Your form has been sent, and I have deleted everything I was holding.',
  scanOk:'I have checked this page and found no scam wording. If anything asks you to pay a fee or share a code, I will warn you straight away.',
  chatHint:'Of course. Just tell me what is on your mind, and I will listen.',
  pvr:'Take your time. Please type your details in the boxes on the page yourself. When you finish, tap "I am done".',
  sbr:'I cannot press Submit for you. Please press the blue Submit button on the page yourself.',
  didnt:'Sorry, I did not catch that. You can tap one of the buttons below.'}};
OV.lines=()=>[...OV.blocks.flatMap(b=>[b.read,b.explain]),...Object.values(OV.say)];
if(typeof module!=='undefined')module.exports=OV;
