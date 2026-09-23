// Ayarlar alt gorunumleri (widget ayarlari, oda kur/katil/paylas):
//  - widget ayarlarinda ekranin ustunde gorunur bir "Geri" dugmesi ve baslik
//  - acilinca en ustten baslar; geri donunce ayarlar listesi ayni kaydirma konumunda
//  - Android geri tusu (handleBack) alt gorunumden ayarlar listesine doner, ana ekrana degil
//  - ayarlar listesindeyken handleBack ana ekrana gider (eski davranis)
const path=require('path');

const run = async (url) => {
  const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
  const b = await chromium.launch();
  const res=[]; const add=(t,beklenen,cikan)=>res.push({t,beklenen,cikan});
  const errs=[];
  const p=await b.newPage({viewport:{width:360,height:700}});
  p.on('pageerror',e=>errs.push(e.message));
  await p.route('**/fonts.googleapis.com/**', r=>r.abort());
  await p.goto(url); await p.waitForTimeout(1500);
  await p.evaluate(()=>{S.ob=true;S.user={name:'Y'};S.habits=[{id:'a',name:'Spor',type:'gain',targetDays:21,color:CL[0],createdAt:td(),days:{},round:1,history:[],notes:{}}];sv()});
  await p.reload(); await p.waitForTimeout(1200);
  await p.addStyleTag({content:'*{scroll-behavior:auto!important}'});
  const kap=()=>'document.querySelector(".screen.active .scroll-y")||document.querySelector(".screen.active")';
  const durum=()=>p.evaluate(k=>{var s=eval(k);var ekran=(document.querySelector('.screen.active')||{}).id;
    var liste=!!document.querySelector('#seBox .si')&&/Widget Ayarları/.test(document.getElementById('seBox').textContent);
    return {ekran:ekran, liste:liste, kaydirma:Math.round(s.scrollTop)}},kap());

  // --- Widget ayarlari: ayarlar listesinin asagisindan acilir ---
  await p.evaluate(()=>navTo('settings')); await p.waitForTimeout(400);
  await p.evaluate(k=>{var s=eval(k);s.scrollTop=s.scrollHeight},kap()); await p.waitForTimeout(200);
  const once=await durum();
  await p.evaluate(()=>{var si=[].slice.call(document.querySelectorAll('#seBox .si')).find(function(e){return /Widget Ayarları/.test(e.textContent)});si.click()});
  await p.waitForTimeout(400);
  const w=await p.evaluate(()=>{
    var bt=[].slice.call(document.querySelectorAll('#seBox button, #seBox [onclick]')).find(function(e){return /Geri/.test(e.getAttribute('aria-label')||'')||/^\s*Geri\s*$/.test(e.textContent)});
    var r=bt?bt.getBoundingClientRect():null;
    return {geri:!!bt, gorunur:!!r&&r.top>=0&&r.bottom<=innerHeight, yuk:r?Math.round(r.height):0,
      baslik:/Widget Ayarları/.test((document.querySelector('#seBox h2')||{}).textContent||'')}});
  add('WIDGET: gorunur bir Geri dugmesi var', true, w.geri&&w.gorunur);
  add('WIDGET: Geri dugmesi en az 44px', true, w.yuk>=44);
  add('WIDGET: baslik "Widget Ayarları"', true, w.baslik);
  add('WIDGET: en ustten baslar', 0, (await durum()).kaydirma);
  // Boyut secimi gorunur olarak degisir (eskiden kaydediliyor ama secili dugme degismiyordu)
  const boy=await p.evaluate(()=>{
    function sec(){return [].slice.call(document.querySelectorAll('#seBox [data-sz]')).filter(function(e){var c=getComputedStyle(e).borderTopColor;return c===getComputedStyle(document.body).getPropertyValue('--lav').trim()||/184, 165, 240|90, 62, 200/.test(c)}).map(function(e){return e.dataset.sz}).join(',')}
    setWidgetSize('4x1');var a=sec();setWidgetSize('2x2');var b=sec();return a+'|'+b});
  add('WIDGET: secilen boyut isaretlenir', '4x1|2x2', boy);
  // Geri dugmesi
  await p.evaluate(()=>{var bt=[].slice.call(document.querySelectorAll('#seBox button, #seBox [onclick]')).find(function(e){return /Geri/.test(e.getAttribute('aria-label')||'')||/^\s*Geri\s*$/.test(e.textContent)});if(bt)bt.click()});
  await p.waitForTimeout(400);
  const d1=await durum();
  add('GERI: ayarlar listesine doner', true, d1.ekran==='s-settings'&&d1.liste);
  add('GERI: liste ayni kaydirma konumunda ('+once.kaydirma+'px)', true, Math.abs(d1.kaydirma-once.kaydirma)<=5);

  // Android geri tusu
  await p.evaluate(()=>openWidgetSettings()); await p.waitForTimeout(300);
  await p.evaluate(()=>handleBack()); await p.waitForTimeout(400);
  const d2=await durum();
  add('ANDROID GERI: widget ayarlarindan ayarlar listesine', 'settings+liste', d2.ekran==='s-settings'&&d2.liste?'settings+liste':d2.ekran);
  for(const [ad,fn] of [['oda kur','showCreateRoom'],['odaya katil','showJoinRoom']]){
    await p.evaluate(f=>{window[f]()},fn); await p.waitForTimeout(300);
    await p.evaluate(()=>handleBack()); await p.waitForTimeout(400);
    const d=await durum();
    add('ANDROID GERI: '+ad+' gorunumunden ayarlar listesine', 'settings+liste', d.ekran==='s-settings'&&d.liste?'settings+liste':d.ekran);
  }
  // Ayarlar listesindeyken: ana ekran (degismemeli)
  await p.evaluate(()=>handleBack()); await p.waitForTimeout(400);
  add('REG ayarlar listesinde handleBack ana ekrana gider', 's-main', (await durum()).ekran);
  // Alt menuyle ayarlara donus her zaman listeyi acar
  await p.evaluate(()=>{navTo('settings');openWidgetSettings()}); await p.waitForTimeout(300);
  await p.evaluate(()=>navTo('main')); await p.waitForTimeout(200);
  await p.evaluate(()=>navTo('settings')); await p.waitForTimeout(400);
  add('REG alt menuyle ayarlara donunce liste acilir', true, (await durum()).liste);

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
