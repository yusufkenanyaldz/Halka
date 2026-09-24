// Durum cubugu / on kamera: Android'de sayfa durum cubugunun altina kadar uzanir, ust boslugu
// --sb (HalkaBridge.getStatusBarHeight) ile birakilir. Her ekran, kaydirilmamisken hicbir
// yaziyi ya da dugmeyi --sb cizgisinin ustune koymamali (Galaxy S25+: kamera deligi oraya denk gelir).
// Olcum: --sb 48px iken butun ekranlar (tests/ekranlar.js) + odasiz ana ekran + tanitim ekranlari.
const path=require('path');
const { veriKur, EKRANLAR } = require('./ekranlar.js');
const SB=48;

const DENETIM = (sb => {
  document.documentElement.style.setProperty('--sb', sb+'px');
  var sc=document.querySelector('.screen.active'); var tasan=[];
  if(!sc)return tasan;
  function gor(e){for(var a=e;a&&a!==document.body;a=a.parentElement){var c=getComputedStyle(a);if(c.display==='none'||c.visibility==='hidden'||c.opacity==='0')return false}return true}
  var w=document.createTreeWalker(sc,NodeFilter.SHOW_TEXT);
  while(w.nextNode()){var t=w.currentNode;if(!t.textContent.trim())continue;var e=t.parentElement;if(!gor(e))continue;
    var r=document.createRange();r.selectNodeContents(t);var q=r.getBoundingClientRect();
    if(q.height>0&&q.bottom>0&&q.top<sb-0.5)tasan.push('"'+t.textContent.trim().slice(0,18)+'" y='+Math.round(q.top))}
  [].forEach.call(sc.querySelectorAll('button,[onclick]'),function(b){if(!gor(b))return;var q=b.getBoundingClientRect();
    if(q.width>0&&q.height>0&&q.bottom>0&&q.top<sb-0.5)tasan.push((b.getAttribute('aria-label')||b.className||b.tagName)+' y='+Math.round(q.top))});
  return tasan.filter(function(x,i,a){return a.indexOf(x)===i});
});

const run = async (url) => {
  const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
  const b = await chromium.launch();
  const res=[]; const add=(t,beklenen,cikan)=>res.push({t,beklenen,cikan});
  const errs=[];
  const p=await b.newPage({viewport:{width:360,height:800}});
  p.on('pageerror',e=>errs.push(e.message));
  await p.route('**/fonts.googleapis.com/**', r=>r.abort());
  await p.clock.setFixedTime(new Date('2026-09-23T10:00:00'));
  await p.goto(url); await p.waitForTimeout(1000);
  await veriKur(p,'dark'); await p.reload(); await p.waitForTimeout(1200);
  await p.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important}.toast,.undo{display:none!important}'});
  await p.evaluate(()=>{['cOv','msOv'].forEach(function(i){document.getElementById(i).classList.remove('show')});document.getElementById('wkSumArea').innerHTML=''});
  const olc=async ad=>{
    await p.waitForTimeout(500);
    await p.evaluate(()=>{document.querySelectorAll('.screen.active .scroll-y, .screen.active').forEach(function(s){s.scrollTop=0})});
    const t=await p.evaluate(`(${DENETIM.toString()})(${SB})`);
    add(ad+': --sb ('+SB+'px) ustunde yazi/dugme yok', 'yok', t.slice(0,3).join(', ')||'yok');
  };
  // Odasiz kullanici: ana ekranda sekme cubugu yok (en sik durum)
  await p.evaluate(()=>{delete S.roomId;delete S.roomCode;delete S.roomType;S.sharedHabits=[];sv();navTo('main')});
  await olc('ana (odasiz)');
  for(const [ad,hazir] of EKRANLAR){
    if(ad==='kutlama'||ad==='kilometre')continue;   // tam ekran katman, icerik ortada
    await p.evaluate(`(${hazir.toString()})()`);
    await olc(ad);
    await p.evaluate(()=>{if(window.pencereKapat)pencereKapat();document.querySelectorAll('[id$=Modal]').forEach(function(m){m.remove()})});
  }
  // Odali ana ekran: sekme cubugu ustte
  await p.evaluate(()=>{S.roomId='r';S.roomCode='ABC234';S.roomType='couple';S.sharedHabits=[S.habits[0].id];sv();navTo('main');renderModeTabBar();
    if(_activeMode!=='self')setMode('self')});   // onceki ekran (ana-oda) oda sekmesinde birakmis olabilir
  await p.waitForTimeout(900);
  await olc('ana (odali, sekmeli)');
  // REG: sekmeliyken bosluk sekme cubugunda; baslik cubugun hemen altinda (cift bosluk yok)
  add('REG ana (odali): baslik sekme cubugunun hemen altinda (<=20px)', true, await p.evaluate(()=>{
    var bar=document.getElementById('modeTabBar').getBoundingClientRect(), t=document.getElementById('mDate').getBoundingClientRect();
    return t.top-bar.bottom>=0&&t.top-bar.bottom<=20}));
  // Tanitim ekranlari
  for(const [ad,kod] of [['tanitim 1',"S.ob=false;goScreen('ob1')"],['tanitim 2',"goOB(2)"],['tanitim 3',"goOB(3)"]]){
    await p.evaluate(k=>eval(k),kod); await olc(ad);
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
