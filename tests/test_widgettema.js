// Widget temasi (Widget Ayarlari -> Widget Temasi): 'oto' (uygulamayla ayni, varsayilan),
// 'koyu', 'acik'. Android'e widget verisinde 'tema' ("koyu"|"acik") olarak gider; uygulamanin
// temasi degisince 'oto' widget da degisir. Uygulamadaki onizleme secilen temayla cizilir.
// Onizlemedeki "x/y bugun" toplami bugun gerekli olanlari sayar (duraklatilmis haric).
const path=require('path');

const run = async (url) => {
  const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
  const b = await chromium.launch();
  const res=[]; const add=(t,beklenen,cikan)=>res.push({t,beklenen,cikan});
  const errs=[];
  const p=await b.newPage({viewport:{width:360,height:800}});
  p.on('pageerror',e=>errs.push(e.message));
  await p.route('**/fonts.googleapis.com/**', r=>r.abort());
  await p.clock.setFixedTime(new Date('2026-09-23T10:00:00'));
  await p.addInitScript(()=>{window.__w=null;window.HalkaBridge={updateWidget:function(j){window.__w=JSON.parse(j)},getStatusBarHeight:function(){return 0},setLightStatusBar:function(){}}});
  await p.goto(url); await p.waitForTimeout(900);
  await p.evaluate(()=>{function mk(id,o){return Object.assign({id:id,name:'A'+id,type:'gain',targetDays:21,color:CL[0],createdAt:td(),days:{},round:1,history:[],notes:{},paused:false,archived:false},o||{})}
    var a=mk('a');a.days[td()]='done';S.ob=true;S.user={name:'Y'};S.milestones={};S.theme='dark';delete S.widgetTema;
    S.habits=[a,mk('p',{paused:true,pausedAt:td()})];S.widgetHabits=['a','p'];sv()});
  await p.reload(); await p.waitForTimeout(1000);
  const tema=()=>p.evaluate(()=>{pushWidgetData();return window.__w&&window.__w.tema});
  add('VARSAYILAN: koyu uygulamada widget koyu', 'koyu', await tema());
  await p.evaluate(()=>setTheme('light')); await p.waitForTimeout(200);
  add('OTO: uygulama acik temaya gecince widget da acik (kendiliginden)', 'acik', await p.evaluate(()=>window.__w&&window.__w.tema));
  await p.evaluate(()=>{S.widgetTema='koyu';sv()});
  add('SECIM koyu: acik uygulamada da koyu', 'koyu', await tema());
  await p.evaluate(()=>{S.widgetTema='acik';setTheme('dark')});
  add('SECIM acik: koyu uygulamada da acik', 'acik', await tema());

  // Arayuz: Widget Ayarlari'ndaki secim
  await p.evaluate(()=>{delete S.widgetTema;sv();navTo('settings');openWidgetSettings()}); await p.waitForTimeout(300);
  const ui=()=>p.evaluate(()=>{var b=[].map.call(document.querySelectorAll('#seBox [data-tema]'),function(e){return e.dataset.tema+(getComputedStyle(e).borderTopColor===getComputedStyle(document.querySelector('#seBox [data-tema]')).borderTopColor?'':'')});
    var sec=[].filter.call(document.querySelectorAll('#seBox [data-tema]'),function(e){return e.style.borderColor.indexOf('var(--lav)')>=0||e.getAttribute('style').indexOf('border:1.5px solid var(--lav)')>=0}).map(function(e){return e.dataset.tema});
    var on=document.querySelector('#wgPreviewArea > div');return {secenek:b.join(','),secili:sec.join(','),zemin:on?on.style.background:'',metin:document.getElementById('wgPreviewArea').textContent.replace(/\s+/g,' ')}});
  let u=await ui();
  add('ARAYUZ: uc secenek', 'oto,koyu,acik', u.secenek);
  add('ARAYUZ: varsayilan secili "Uygulamayla ayni"', 'oto', u.secili);
  add('ONIZLEME oto+koyu uygulama: koyu zemin', true, /14, 14, 26|0e0e1a/.test(u.zemin));
  add('ONIZLEME toplam bugun gerekli (duraklatilmis haric)', true, /1\/1 bugün/.test(u.metin)&&!/1\/2/.test(u.metin));
  await p.evaluate(()=>{var b=document.querySelector('#seBox [data-tema="acik"]');if(b)b.click()}); await p.waitForTimeout(200);
  u=await ui();
  add('TIKLAMA acik: secili ve kaydedildi', 'acik|acik', u.secili+'|'+await p.evaluate(()=>S.widgetTema));
  add('TIKLAMA acik: onizleme acik zemin', true, /255, 255, 255|ffffff/.test(u.zemin));
  add('TIKLAMA acik: widget verisi hemen acik', 'acik', await p.evaluate(()=>window.__w&&window.__w.tema));
  await p.reload(); await p.waitForTimeout(1000);
  add('YENILEME: secim kalici', 'acik', await tema());
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
