// Oda sekmesi (ana ekran, Es / Sevgili): telefonda gorulen hatalar.
//  1. "Paylasimlari Duzenle" ana ekrandan basilinca hicbir sey acilmiyordu: liste Ayarlar
//     ekraninin icine (#seBox) ciziliyor ama o ekrana gecilmiyordu. Simdi Ayarlar'a gecer;
//     Tamam / Atla / geri tusu oda ekranina dondurur. Ayarlar'dan acilinca (REG) ayarlarda kalir.
//  2. Odadan ayrilinca ana ekran oda gorunumunde kaliyordu (sekme de yok, donus yolu yok).
//  3. Oda ekraninda "Odadan Ayril" dugmesi (onceden yalniz Ayarlar'in en altinda).
const path=require('path');

const run = async (url) => {
  const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
  const b = await chromium.launch();
  const res=[]; const add=(t,beklenen,cikan)=>res.push({t,beklenen,cikan});
  const errs=[];
  async function ac(){
    const p=await b.newPage({viewport:{width:384,height:832}});
    p.on('pageerror',e=>errs.push(e.message));
    await p.route('**/fonts.googleapis.com/**', r=>r.abort());
    await p.clock.setFixedTime(new Date('2026-09-23T10:00:00'));
    await p.goto(url); await p.waitForTimeout(900);
    await p.evaluate(()=>{S.ob=true;S.user={name:'Y'};S.milestones={};
      S.habits=[{id:'a',name:'Spor',type:'gain',targetDays:21,color:CL[0],createdAt:td(),days:{},round:1,history:[],notes:{}}];
      S.roomId='r';S.roomCode='SFZ559';S.roomType='couple';S.sharedHabits=[];sv()});
    await p.reload(); await p.waitForTimeout(1000);
    await p.evaluate(()=>{_activeMode='self';setMode('couple')}); await p.waitForTimeout(900);
    return p;
  }
  const tikla=(p,re,kap)=>p.evaluate(([re,kap])=>{var b=[].find.call(document.querySelectorAll(kap+' button'),function(x){return new RegExp(re).test(x.textContent)&&x.offsetParent});
    if(b)b.click();return !!b},[re,kap]);
  const durum=p=>p.evaluate(()=>({ekran:(document.querySelector('.screen.active')||{}).id, liste:/Odaya Paylaş/.test((document.getElementById('seBox')||{}).textContent||''),
    oda:getComputedStyle(document.getElementById('roomModeContent')).display!=='none', bireysel:getComputedStyle(document.getElementById('selfModeContent')).display!=='none',
    sekme:getComputedStyle(document.getElementById('modeTabBar')).display!=='none'}));

  // 1. Bos oda: ortadaki ve alttaki "Paylasimlari Duzenle"
  for(const [ad,sira] of [['ortadaki',0],['alttaki',1]]){
    const p=await ac();
    await p.evaluate(s=>{var b=[].filter.call(document.querySelectorAll('#roomModeContent button'),function(x){return /Paylaşımları Düzenle/.test(x.textContent)});b[s].click()},sira);
    await p.waitForTimeout(500);
    const d=await durum(p);
    add('PAYLASIM ('+ad+' dugme): paylasim listesi acilir', 's-settings|true', d.ekran+'|'+d.liste);
    await p.close();
  }
  // Tamam: paylasim kaydedilir, oda ekranina donulur ve paylasilan aliskanlik orada
  {
    const p=await ac();
    await tikla(p,'Paylaşımları Düzenle','#roomModeContent'); await p.waitForTimeout(400);
    await p.evaluate(()=>toggleShareHabit('a'));
    await tikla(p,'^Tamam$','#seBox'); await p.waitForTimeout(900);
    const d=await durum(p);
    add('TAMAM: oda ekranina doner', 's-main|true', d.ekran+'|'+d.oda);
    add('TAMAM: paylasilan aliskanlik odada gorunur', true, await p.evaluate(()=>/Spor/.test(document.getElementById('roomModeContent').textContent)&&!/Henüz ortak alışkanlık yok/.test(document.getElementById('roomModeContent').textContent)));
    await p.close();
  }
  for(const [ad,kod] of [['ATLA',"var b=[].find.call(document.querySelectorAll('#seBox button'),function(x){return /^Atla$/.test(x.textContent.trim())});b.click()"],['GERI TUSU',"handleBack()"]]){
    const p=await ac();
    await tikla(p,'Paylaşımları Düzenle','#roomModeContent'); await p.waitForTimeout(400);
    await p.evaluate(k=>eval(k),kod); await p.waitForTimeout(900);
    const d=await durum(p);
    add(ad+': oda ekranina doner', 's-main|true', d.ekran+'|'+d.oda);
    await p.close();
  }
  // REG: Ayarlar'dan acilinca Tamam ayarlarda birakir
  {
    const p=await ac();
    await p.evaluate(()=>{navTo('settings');editShareHabits()}); await p.waitForTimeout(400);
    await tikla(p,'^Tamam$','#seBox'); await p.waitForTimeout(500);
    const d=await durum(p);
    add('REG ayarlardan: Tamam ayarlar listesinde birakir', 's-settings|false', d.ekran+'|'+d.liste);
    await p.close();
  }
  // 2-3. Odadan ayrilma: oda ekranindaki dugme ve Ayarlar'dan
  {
    const p=await ac();
    add('ODA EKRANI: "Odadan Ayril" dugmesi var', true, await tikla(p,'^Odadan Ayrıl$','#roomModeContent'));
    await p.evaluate(()=>document.querySelector('#pencere [data-sec=evet]').click());
    await p.waitForTimeout(900);
    const d=await durum(p);
    add('AYRILINCA (oda ekranindan): bireysel gorunum, sekme yok', 's-main|true|false|false', [d.ekran,d.bireysel,d.oda,d.sekme].join('|'));
    add('AYRILINCA: oda bilgisi silinir', 'yok', await p.evaluate(()=>S.roomId||'yok'));
    await p.close();
  }
  {
    const p=await ac();
    await p.evaluate(()=>{navTo('settings');leaveRoom();document.querySelector('#pencere [data-sec=evet]').click();navTo('main')}); await p.waitForTimeout(900);
    const d=await durum(p);
    add('AYRILINCA (ayarlardan) ana ekran: bireysel gorunum', 'true|false|false', [d.bireysel,d.oda,d.sekme].join('|'));
    await p.close();
  }
  {
    const p=await ac();
    await tikla(p,'^Odadan Ayrıl$','#roomModeContent'); await p.waitForTimeout(300);
    await p.evaluate(()=>document.querySelector('#pencere [data-sec=hayir]').click()); await p.waitForTimeout(300);
    add('REG vazgecince oda kalir', 'r|true', await p.evaluate(()=>S.roomId+'|'+(getComputedStyle(document.getElementById('roomModeContent')).display!=='none')));
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
