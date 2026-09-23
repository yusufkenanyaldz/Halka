// Kisa ekranda ana ekran: halka ekrani kaplamasin, "Bugun" listesinin ilk karti
// kaydirmadan gorunsun. Halka ekran yuksekligine ve durum cubuguna (--sb, varsayilan 36) gore
// kuculur (144-270px: 100vh - 460 - sb); merkezdeki yazi halkayla kuculur ama okunur kalir:
//  - merkezdeki her gorunen yazi ic bosluga sigar (koseleri en icteki halkanin icinde)
//  - etkin yazi boyutu (font-size x olcek) en az 11px
//  - secili aliskanligin bilgisi (ad, x/hedef, seri) kaybolmaz: sigarsa merkezde,
//    sigmazsa (kisa ekran ya da cok halka) halkanin altinda tek satir
// Veri: tests/ekranlar.js (dolu veri; 5 kazanma halkasi en dar ic bosluk).
const path=require('path');
const { veriKur } = require('./ekranlar.js');

const run = async (url) => {
  const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
  const b = await chromium.launch();
  const res=[]; const add=(t,beklenen,cikan)=>res.push({t,beklenen,cikan});
  const errs=[];
  async function ac(g,y,bos){
    const p=await b.newPage({viewport:{width:g,height:y}});
    p.on('pageerror',e=>errs.push(e.message));
    await p.route('**/fonts.googleapis.com/**', r=>r.abort());
    await p.clock.setFixedTime(new Date('2026-09-23T10:00:00'));
    await p.goto(url); await p.waitForTimeout(1200);
    await veriKur(p,'dark');
    if(bos)await p.evaluate(()=>{S.habits=[];sv()});
    await p.reload(); await p.waitForTimeout(1200);
    await p.evaluate(()=>document.fonts.ready);
    await p.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important}.toast{display:none!important}'});
    await p.evaluate(()=>{['cOv','msOv'].forEach(function(i){document.getElementById(i).classList.remove('show')});document.getElementById('wkSumArea').innerHTML=''});
    await p.waitForTimeout(300);
    return p;
  }
  // Halka merkezi: sigma ve okunurluk. kap: halkayi iceren oge (ana ekran ya da oda)
  const merkez=(p,kap)=>p.evaluate(kap=>{
    var K=document.querySelector(kap), w=K.querySelector('.medal-wrapper'), ctr=K.querySelector('.ring-ctr'), svg=w.querySelector('svg');
    var wr=w.getBoundingClientRect(), cx=wr.left+wr.width/2, cy=wr.top+wr.height/2;
    var ic=1e9;[].forEach.call(svg.querySelectorAll('circle'),function(c){var sw=parseFloat(c.getAttribute('stroke-width')||0);if(!sw)return;var r=parseFloat(c.getAttribute('r'))-sw/2;if(r<ic)ic=r});
    ic=ic*svg.getBoundingClientRect().width/270;
    var m=getComputedStyle(ctr).transform, olcek=1; if(m&&m!=='none'){var v=m.match(/matrix\(([^,]+),([^,]+)/);olcek=Math.hypot(parseFloat(v[1]),parseFloat(v[2]))}
    var tw=document.createTreeWalker(ctr,NodeFilter.SHOW_TEXT), tasan=[], kucuk=[];
    while(tw.nextNode()){var t=tw.currentNode;if(!t.textContent.trim())continue;var el=t.parentElement;
      var gizli=false;for(var a=el;a&&a!==ctr.parentElement;a=a.parentElement){if(getComputedStyle(a).display==='none'){gizli=true;break}}if(gizli)continue;
      var fs=parseFloat(getComputedStyle(el).fontSize)*olcek; if(fs<11)kucuk.push(t.textContent.trim()+' '+fs.toFixed(1)+'px');
      var r=document.createRange();r.selectNodeContents(t);[].forEach.call(r.getClientRects(),function(q){if(q.width<1)return;
        [[q.left,q.top],[q.right,q.top],[q.left,q.bottom],[q.right,q.bottom]].forEach(function(k){var d=Math.hypot(k[0]-cx,k[1]-cy);if(d>ic+1&&tasan.indexOf(t.textContent.trim())<0)tasan.push(t.textContent.trim())})})}
    return {halka:Math.round(wr.width), tasan:tasan.join(',')||'yok', kucuk:kucuk.join(',')||'yok'}},kap);
  const ilkKart=p=>p.evaluate(()=>{var nav=document.querySelector('.bnav').getBoundingClientRect().top;var c=document.querySelector('#hCards > *').getBoundingClientRect();var t=document.getElementById('todaySecTitle').getBoundingClientRect();
    return {tam:c.bottom<=nav, baslik:t.bottom<=nav, gorunen:Math.max(0,Math.round(Math.min(nav,c.bottom)-c.top))}});
  const alt=p=>p.evaluate(()=>{var e=document.getElementById('rAlt');if(!e)return {gor:false,metin:'',tek:false,sigar:false};var q=e.getBoundingClientRect();
    return {gor:getComputedStyle(e).display!=='none'&&q.height>0, metin:e.textContent.replace(/\s+/g,' ').trim(), tek:q.height<=26, sigar:q.left>=0&&q.right<=innerWidth}});

  for(const [g,y] of [[320,640],[360,640],[320,568],[360,800],[412,915]]){
    const p=await ac(g,y); const k=g+'x'+y;
    const kart=await ilkKart(p);
    if(y>=640)add(k+': ilk kart kaydirmadan tam gorunur', true, kart.tam);
    else add(k+': "Bugun" basligi ve ilk kartin ustu kaydirmadan gorunur (>=24px)', true, kart.baslik&&kart.gorunen>=24);
    // Genel gorunum, kazanma ve birakma yuzu
    for(const [yuz,flip] of [['kazanma',false],['birakma',true]]){
      await p.evaluate(f=>{flipMedal(f,true);renderMain()},flip); await p.waitForTimeout(300);
      const m=await merkez(p,'#selfModeContent');
      if(yuz==='kazanma')add(k+': halka boyutu', Math.max(144,Math.min(270,y-460-36)), m.halka);
      add(k+' '+yuz+' genel: merkez yazisi ic bosluga sigar', 'yok', m.tasan);
      add(k+' '+yuz+' genel: merkez yazisi en az 11px', 'yok', m.kucuk);
    }
    // Secili aliskanlik (en uzun ad dahil)
    await p.evaluate(()=>{flipMedal(false,true);renderMain()}); await p.waitForTimeout(300);
    const n=await p.evaluate(()=>_selfHabits().filter(function(h){return h.type==='gain'}).length);
    let tasan=[],kucuk=[],altHata=[];
    for(let i=0;i<n;i++){
      await p.evaluate(i=>{_selRingActive=-1;ringTapActive(i)},i); await p.waitForTimeout(250);
      const m=await merkez(p,'#selfModeContent'); if(m.tasan!=='yok')tasan.push(i+':'+m.tasan); if(m.kucuk!=='yok')kucuk.push(i+':'+m.kucuk);
      // Bilgi kaybolmaz: ya merkezde (ad gorunur) ya halkanin altinda tek satir, tam ad title'da
      const a=await alt(p), ad=await p.evaluate(i=>_selfHabits().filter(function(h){return h.type==='gain'})[i].name,i);
      const ortada=await p.evaluate(()=>{var e=document.querySelector('#rCtrActive .ring-info-name');return !!e&&getComputedStyle(e).display!=='none'});
      if(ortada&&a.gor)altHata.push(i+': bilgi iki yerde');
      if(!ortada){ if(!(a.gor&&a.tek&&a.sigar&&a.metin.indexOf('/')>0))altHata.push(i+':'+JSON.stringify(a));
                 const t=await p.evaluate(()=>{var e=document.querySelector('#rAlt .ad-tek');return e?e.getAttribute('title'):''}); if(t!==ad)altHata.push(i+': title='+t); }
    }
    add(k+' secili: merkez yazisi ic bosluga sigar', 'yok', tasan.join(' ')||'yok');
    add(k+' secili: merkez yazisi en az 11px', 'yok', kucuk.join(' ')||'yok');
    add(k+' secili: bilgi gorunur (merkezde ya da altta tek satir, tam ad title\'da)', 'yok', altHata.join(' ')||'yok');
    await p.close();
  }
  // Iki ve daha cok halkayi uzun ekranda ayri ayri sina (dolu veride hep 5 halka var)
  for(const n of [1,2,3,4]){
    const p=await ac(360,800);
    await p.evaluate(n=>{var g=S.habits.filter(function(h){return h.type==='gain'&&!h.archived});g.slice(n).forEach(function(h){h.archived=true});sv();flipMedal(false,true);renderMain()},n);
    await p.waitForTimeout(300);
    const m0=await merkez(p,'#selfModeContent');
    await p.evaluate(()=>{_selRingActive=-1;ringTapActive(0)}); await p.waitForTimeout(250);
    const m1=await merkez(p,'#selfModeContent');
    add('360x800 '+n+' halka: merkez yazisi sigar (genel/secili)', 'yok|yok', m0.tasan+'|'+m1.tasan);
    if(n===1){
      const a=await alt(p), ortada=await p.evaluate(()=>getComputedStyle(document.querySelector('#rCtrActive .ring-info-name')).display!=='none');
      add('REG 360x800 tek halka: secili bilgisi merkezde, alt satir yok', 'true|false', ortada+'|'+a.gor);
    }
    await p.close();
  }
  // Pencere boyu degisince (klavye, bolunmus ekran) oran guncellenir
  {
    const p=await ac(360,800);
    await p.setViewportSize({width:360,height:640}); await p.waitForTimeout(500);
    const m=await merkez(p,'#selfModeContent');
    add('BOY DEGISIMI 800->640: halka kuculur', 144, m.halka);
    add('BOY DEGISIMI 800->640: merkez yazisi sigar', 'yok', m.tasan);
    await p.close();
  }
  // Bos ekrandan ilk aliskanlik: halka gizliyken olcek yazilamaz (genislik 0). Boy gizliyken
  // degisir (800->640), sonra ilk aliskanlik eklenir: olcek gorunur olunca yazilmali.
  {
    const p=await ac(360,800,true);
    await p.setViewportSize({width:360,height:640}); await p.waitForTimeout(400);
    await p.evaluate(()=>{S.habits.push({id:'y1',name:'Kitap',type:'gain',targetDays:21,color:CL[3],createdAt:td(),days:{},round:1,history:[],notes:{},paused:false,archived:false});
      S.habits.push({id:'y2',name:'Spor',type:'gain',targetDays:21,color:CL[8],createdAt:td(),days:{},round:1,history:[],notes:{},paused:false,archived:false});sv();renderMain()});
    await p.waitForTimeout(500);
    const m=await merkez(p,'#selfModeContent');
    add('ILK ALISKANLIK: merkez yazisi sigar', 'yok', m.tasan);
    await p.close();
  }
  // Oda gorunumundeki halka da ayni kurala uyar
  {
    const p=await ac(320,640);
    await p.evaluate(()=>{var ids=S.habits.filter(function(h){return!h.archived&&!h.paused}).slice(0,5).map(function(h){return h.id});
      S.roomId='r';S.roomType='family';S.roomCode='ABC234';S.sharedHabits=ids;fbUser={uid:'u1'};
      S.partnerData={u2:{summary:{name:'Ali',done:1,total:2,lastSeen:td()},habits:{x:{name:'Yoga',type:'gain',color:'#B8A5F0',targetDays:30,pct:40,pctTur:'ilerleme',streak:3,todayDone:true}}}};
      _activeMode='self';setMode('family')});
    await p.waitForTimeout(900);
    const var_=await p.evaluate(()=>!!document.querySelector('#roomModeContent .medal-wrapper'));
    if(var_){
      const m=await merkez(p,'#roomModeContent');
      add('ODA: merkez yazisi ic bosluga sigar', 'yok', m.tasan);
      add('ODA: merkez yazisi en az 11px', 'yok', m.kucuk);
    } else add('ODA: halka cizildi', true, false);
    await p.close();
  }
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
