// Oda sekmesinde tek baslik: bireysel baslik (tarih, "Gunaydin", "+", "x/y aliskanlik
// tamamlandi", seviye, motivasyon) oda basliginin ustunde ikinci kez cizilmesin.
// Olcum: gorunen tarih satiri, "+" dugmesi, bireysel sayim/selamlama sayisi; oda basligi
// bireysel basligin yerinde (ayni yukseklik).
const path=require('path');
const { veriKur } = require('./ekranlar.js');

const run = async (url) => {
  const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
  const b = await chromium.launch();
  const res=[]; const add=(t,beklenen,cikan)=>res.push({t,beklenen,cikan});
  const errs=[];
  async function ac(oda){
    const p=await b.newPage({viewport:{width:360,height:800}});
    p.on('pageerror',e=>errs.push(e.message));
    await p.route('**/fonts.googleapis.com/**', r=>r.abort());
    await p.clock.setFixedTime(new Date('2026-09-23T10:00:00'));
    await p.goto(url); await p.waitForTimeout(1000);
    await veriKur(p,'dark');
    if(oda)await p.evaluate(tur=>{var ids=S.habits.filter(function(h){return!h.archived&&!h.paused}).slice(0,2).map(function(h){return h.id});
      S.roomId='r';S.roomType=tur;S.roomCode='ABC234';S.sharedHabits=ids;
      S.partnerData={u2:{summary:{name:'Ayşe',done:1,total:2,lastSeen:'2026-09-23'},habits:{x:{name:'Yoga',type:'gain',color:'#B8A5F0',targetDays:30,pct:40,pctTur:'ilerleme',streak:3,todayDone:true}}}};sv()},oda);
    await p.reload(); await p.waitForTimeout(1200);
    await p.evaluate(()=>document.fonts.ready);
    await p.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important}.toast{display:none!important}'});
    await p.evaluate(()=>{['cOv','msOv'].forEach(function(i){document.getElementById(i).classList.remove('show')});document.getElementById('wkSumArea').innerHTML=''});
    return p;
  }
  const olc=p=>p.evaluate(()=>{
    function gor(e){if(!e)return false;var q=e.getBoundingClientRect();if(q.width<1||q.height<1)return false;for(var a=e;a&&a!==document.body;a=a.parentElement){var c=getComputedStyle(a);if(c.display==='none'||c.visibility==='hidden')return false}return true}
    var sc=document.getElementById('s-main'), tarih=0, bireysel=0, selam=0, ilkTarih=null;
    var w=document.createTreeWalker(sc,NodeFilter.SHOW_TEXT);
    while(w.nextNode()){var t=w.currentNode,e=t.parentElement;if(!gor(e))continue;var m=t.textContent;
      if(/Çarşamba, 23 Eylül/i.test(m)){tarih++;var y=Math.round(e.getBoundingClientRect().top);if(ilkTarih===null||y<ilkTarih)ilkTarih=y}
      if(/alışkanlık tamamlandı/.test(m))bireysel++;
      if(/Günaydın|İyi günler|İyi akşamlar|İyi geceler/.test(m))selam++}
    var arti=[].filter.call(sc.querySelectorAll('svg path'),function(pa){return pa.getAttribute('d')==='M12 5v14M5 12h14'&&gor(pa.closest('svg'))&&pa.closest('svg').getBoundingClientRect().top<400}).length;
    return {tarih:tarih,arti:arti,bireysel:bireysel,selam:selam,ilkTarih:ilkTarih,oda:/Eş \/ Sevgili|Aile/.test(sc.textContent)}});

  for(const tur of ['couple','family']){
    const p=await ac(tur);
    await p.evaluate(()=>{_activeMode='self';renderModeTabBar();renderMain()}); await p.waitForTimeout(400);
    const once=await olc(p);
    await p.evaluate(t=>setMode(t),tur); await p.waitForTimeout(900);
    const m=await olc(p);
    const k='ODA ('+tur+')';
    add(k+': tek tarih satiri', 1, m.tarih);
    add(k+': ustte tek "+" dugmesi', 1, m.arti);
    add(k+': bireysel sayim yok', 0, m.bireysel);
    add(k+': bireysel selamlama yok', 0, m.selam);
    add(k+': oda basligi bireysel basligin yerinde (tarih y='+once.ilkTarih+')', true, Math.abs(m.ilkTarih-once.ilkTarih)<=4);
    // Ustteki "+" oda icin (bireysel ekleme degil)
    const artiOda=await p.evaluate(()=>{var pa=[].find.call(document.querySelectorAll('#s-main svg path'),function(x){if(x.getAttribute('d')!=='M12 5v14M5 12h14')return false;var e=x.closest('svg');for(var a=e;a;a=a.parentElement){if(getComputedStyle(a).display==='none')return false}return e.getBoundingClientRect().top<400});
      var on=pa?pa.closest('[onclick]'):null;return on?on.getAttribute('onclick'):''});
    add(k+': "+" bireysel eklemeye gitmez', true, !!artiOda&&!/tryAdd\(\)/.test(artiOda));
    // Bireysele donus: baslik geri gelir
    await p.evaluate(()=>setMode('self')); await p.waitForTimeout(900);
    const d=await olc(p);
    add(k+' REG bireysele donunce: tarih, "+", sayim, selamlama', '1|1|1|1', [d.tarih,d.arti,d.bireysel,d.selam].join('|'));
    await p.close();
  }
  // REG: odasiz kullanici
  {
    const p=await ac(null); await p.waitForTimeout(300);
    const d=await olc(p);
    add('REG odasiz: tarih, "+", sayim, selamlama', '1|1|1|1', [d.tarih,d.arti,d.bireysel,d.selam].join('|'));
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
