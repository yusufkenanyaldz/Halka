// Birakma turu de ilerleme gostersin (kazanma turuyle ayni): 20/90 gun -> %22
// her yuzeyde: kart halkasi, buyuk halka merkezi, ayrinti halkasi (sayi ve yay),
// istatistik, widget verisi, partnere giden veri. Eski surumden gelen partner
// verisi (kalan yuzde, pctTur yok) ilerlemeye cevrilir.
const path=require('path');

const run = async (url) => {
  const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
  const b = await chromium.launch();
  const res=[]; const add=(t,beklenen,cikan)=>res.push({t,beklenen,cikan});
  const errs=[];
  const p=await b.newPage({viewport:{width:360,height:900}});
  p.on('pageerror',e=>errs.push(e.message));
  await p.route('**/fonts.googleapis.com/**', r=>r.abort());
  await p.clock.setFixedTime(new Date('2026-09-23T10:00:00'));
  await p.addInitScript(()=>{window.__widget=null;window.HalkaBridge={updateWidget:function(j){window.__widget=JSON.parse(j)},getStatusBarHeight:function(){return 0}}});
  await p.goto(url); await p.waitForTimeout(1500);
  await p.evaluate(()=>{
    function g(n){var d=new Date();d.setDate(d.getDate()-n);return ds(d)}
    var h={id:'sg',name:'Sigara',type:'quit',targetDays:90,color:CL[0],createdAt:g(20),days:{},round:1,history:[],notes:{},paused:false,archived:false};
    for(var j=1;j<=20;j++)h.days[g(j)]='done';
    S.ob=true;S.user={name:'Y'};S.habits=[h];S.milestones={};
    [7,14,21,30,60,90].forEach(function(d){S.milestones['ms_sg_'+d+'_1']=true});
    sv();
  });
  await p.reload(); await p.waitForTimeout(1200);
  await p.evaluate(()=>{flipMedal(true,true);renderMain()}); await p.waitForTimeout(500);

  const kart=await p.evaluate(()=>{var e=document.querySelector('.screen.active .hc-rg-p');return e?e.textContent.replace(/\s+/g,''):''});
  add('KART: mini halka ilerleme gosterir', '%22', kart);
  const merkez=await p.evaluate(()=>{var e=document.getElementById('rpNumA');return e?e.textContent:''});
  add('BUYUK HALKA: genel yuzde ilerleme', '%22', merkez);
  await p.evaluate(()=>ringTapActive(0)); await p.waitForTimeout(1200);
  add('BUYUK HALKA: secili aliskanlik ilerleme', '%22', await p.evaluate(()=>{var e=document.getElementById('rpNumA');return e?e.textContent:''}));
  // Buyuk halkadaki yay: cizilen uzunluk / cevre = 0.22
  const yay=await p.evaluate(()=>{var c=[].slice.call(document.querySelectorAll('#rSvgActive circle[stroke-dasharray]'))[0];if(!c)return -1;
    var d=parseFloat(c.getAttribute('stroke-dasharray')),o=parseFloat(c.getAttribute('stroke-dashoffset'));return Math.round((d-o)/d*100)});
  add('BUYUK HALKA: yay ilerleme kadar dolu', 22, yay);

  await p.evaluate(()=>openDet('sg')); await p.waitForTimeout(500);
  const det=await p.evaluate(()=>{var sc=document.querySelector('.screen.active');var t=[].slice.call(sc.querySelectorAll('div')).find(function(d){return /^%\d+$/.test(d.textContent.trim())&&d.style.webkitTextFillColor==='transparent'});
    var c=[].slice.call(sc.querySelectorAll('svg circle[stroke-dasharray]'))[0];
    var d=c?parseFloat(c.getAttribute('stroke-dasharray')):0,o=c?parseFloat(c.getAttribute('stroke-dashoffset')):0;
    return {sayi:t?t.textContent.trim():'',yay:c?Math.round((d-o)/d*100):-1,etiket:sc.textContent.indexOf('20 gün temiz · 70 kaldı')>=0}});
  add('AYRINTI: halka sayisi ilerleme', '%22', det.sayi);
  add('AYRINTI: yay ilerleme kadar dolu', 22, det.yay);
  add('AYRINTI: etikette kalan gun hala yazar', true, det.etiket);

  await p.evaluate(()=>navTo('stats')); await p.waitForTimeout(500);
  add('ISTATISTIK: satir ilerleme', true, await p.evaluate(()=>{var sc=document.querySelector('.screen.active');return [].slice.call(sc.querySelectorAll('.sc')).some(function(c){return /Sigara/.test(c.textContent)&&/%22/.test(c.textContent)&&!/%78/.test(c.textContent)})}));

  await p.evaluate(()=>pushWidgetData());
  add('WIDGET: veri ilerleme', 22, await p.evaluate(()=>window.__widget&&window.__widget.habits[0]?window.__widget.habits[0].pct:-1));

  // Partnere giden veri
  const giden=await p.evaluate(()=>{var cap={};fbConnected=true;fbUser={uid:'u'};S.roomId='r';S.sharedHabits=['sg'];
    fbDB={ref:function(y){return{set:function(v){cap[y]=v;return Promise.resolve()}}}};fbSyncShared();fbConnected=false;
    return cap['shared/r/u/habits']&&cap['shared/r/u/habits'].sg});
  add('PARTNERE: yuzde ilerleme', 22, giden?giden.pct:-1);
  add('PARTNERE: surum isareti', 'ilerleme', giden?giden.pctTur:'');

  // Partnerden gelen: yeni surum (22, ilerleme) ve eski surum (78, isaretsiz) ayni gorunmeli.
  // setMode gecisi zamanlayiciyla cizer: once kur, bekle, sonra olc.
  async function ciz(ph){
    await p.evaluate(ph=>{S.partnerData={u2:{summary:{name:'Eş',done:0,total:1,lastSeen:td()},habits:{x:ph}}};
      S.roomType='couple';S.roomCode='ABC234';navTo('main');_activeMode='self';setMode('couple')},ph);
    await p.waitForTimeout(900);
    return p.evaluate(()=>{
      // Partner karti: halkasi tiklanmaz (kendi kartlarimizda openDet var)
      var rg=[].slice.call(document.querySelectorAll('.hc-rg')).filter(function(r){return !r.getAttribute('onclick')&&r.offsetParent});
      if(!rg.length)return 'partner karti yok';
      var c=rg[rg.length-1].querySelector('svg circle[stroke-dashoffset]');if(!c)return -1;
      var d=parseFloat(c.getAttribute('stroke-dasharray')),o=parseFloat(c.getAttribute('stroke-dashoffset'));return Math.round((d-o)/d*100)});
  }
  const base={name:'Sigara',type:'quit',color:'#F2A6A6',targetDays:90,streak:20,todayDone:false};
  const gelen={yeni:await ciz(Object.assign({},base,{pct:22,pctTur:'ilerleme'})), eski:await ciz(Object.assign({},base,{pct:78}))};
  add('PARTNERDEN: yeni surum verisi %22 cizilir', 22, gelen.yeni);
  add('PARTNERDEN: eski surum verisi (kalan %78) de %22 cizilir', 22, gelen.eski);

  await b.close();
  return {out:res, errs:errs.join(' | ')||'(yok)'};
};
(async()=>{
  const url = process.argv.slice(2).find(a=>/^(file|https?):/.test(a)) || (process.env.HALKA_URL || 'file://'+path.resolve(__dirname,'..','index.html'));
  const {out,errs} = await run(url);
  let fail=0;
  for(const r of out){const ok=String(r.beklenen)===String(r.cikan); if(!ok)fail++;
    console.log((ok?'GECTI ':'KALDI ')+r.t+'  beklenen="'+r.beklenen+'" cikan="'+r.cikan+'"');}
  console.log('\nSonuc: '+(out.length-fail)+'/'+out.length+' gecti');
  console.log('Sayfa hatasi:', errs);
  process.exit(fail?1:0);
})();
