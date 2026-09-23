// Siradan bir kullanicinin (20'li yaslar, kilavuz okumaz) 4 haftalik kullaniminda gorulenler:
//  GERIAL  "Geri Al" balonu hic gorunmuyordu: .undo bottom:calc(var(--nh)+16px) gecersiz
//          (calc'ta + bosluksuz), balon sayfanin sonuna, ekranin disina dusuyordu.
//  SERI    Bir gun acmamak seriyi hemen "Basla!"ya dusuruyor, puani azaltiyordu; oysa o gun
//          3 gun boyunca "Doldur" ile isaretlenebilir. Artik o sure icinde isaretsiz gun seriyi bozmaz.
//  GECE    00:40'ta "Tamamlandi" bugune (sali) yaziliyordu, kullanici pazartesi icin basmisti.
//          Artik balon hangi gune yazildigini soyler ve "Dune yaz" sunar.
//  IPUCU   Liste halka sekmesine gore suzuluyor; obur taraftaki (Birakmak) bugun bekleyen
//          aliskanlik hic gorunmuyordu. Artik listenin altinda "Birakmak tarafinda ... bekliyor".
//  OZET    Haftalik ozet yalniz pazar acilinca cikiyordu. Artik pazar kacirilirsa gecen haftanin
//          ozeti bir kez gosterilir.
const path=require('path');

const run = async (url) => {
  const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
  const b = await chromium.launch();
  const res=[]; const add=(t,beklenen,cikan)=>res.push({t,beklenen,cikan});
  const errs=[];
  async function ac(kur,saat){
    const p=await b.newPage({viewport:{width:384,height:832}});
    p.on('pageerror',e=>errs.push(e.message));
    p.on('dialog',d=>d.accept());
    await p.route('**/fonts.googleapis.com/**', r=>r.abort());
    await p.clock.setFixedTime(new Date(saat));
    await p.goto(url); await p.waitForTimeout(700);
    await p.evaluate(`(${kur.toString()})()`);
    await p.reload(); await p.waitForTimeout(900);
    await p.evaluate(()=>{['cOv','msOv'].forEach(function(i){document.getElementById(i).classList.remove('show')})});
    return p;
  }
  // gunler: {tarih: durum}; bos birakilan gunlerde joker kullanilmasin diye freezeUsed doldurulur
  const kur=(gunler,ek)=>new Function(`S.ob=true;S.user={name:'Elif'};S.milestones={};S.wkSumSeen={};
    var g=${JSON.stringify(gunler)},ilk=Object.keys(g).sort()[0]||td();
    var h={id:'a',name:'Kitap',type:'gain',targetDays:60,color:CL[0],createdAt:ilk,days:g,round:1,history:[],notes:{},freezeUsed:{}};
    var x=new Date(ilk+'T00:00:00');for(var i=0;i<60;i++){h.freezeUsed[ds(x)]='x';x.setDate(x.getDate()+1)}
    S.habits=[h];${ek||''}sv()`);

  // GERIAL: balon ekranda
  {
    const p=await ac(kur({'2026-09-28':'done'}),'2026-09-29T20:00:00');
    await p.evaluate(()=>mkMs('a')); await p.waitForTimeout(600);
    add('GERIAL: "Geri Al" balonu ekranin icinde', true, await p.evaluate(()=>{var r=document.getElementById('uToast').getBoundingClientRect();return r.height>0&&r.top>=0&&r.bottom<=innerHeight}));
    add('GERIAL: balon alt menunun ustunde', true, await p.evaluate(()=>document.getElementById('uToast').getBoundingClientRect().bottom<=document.getElementById('bnav').getBoundingClientRect().top));
    await p.close();
  }
  // SERI: Pzt-Sal-Car yapildi, Per isaretsiz, bugun Cuma sabah
  {
    const p=await ac(kur({'2026-09-28':'done','2026-09-29':'done','2026-09-30':'done'}),'2026-10-02T09:00:00');
    add('SERI: dun isaretsiz (hala doldurulabilir) seriyi bozmaz', 3, await p.evaluate(()=>cS(fH('a'))));
    add('SERI: kartta "Basla!" degil "3 gun seri"', true, await p.evaluate(()=>/3 gün seri/.test(document.getElementById('hCards').textContent)));
    add('REG SERI: en uzun seri de ayni', 3, await p.evaluate(()=>enUzunSeri(fH('a'))));
    await p.close();
  }
  {
    // REG: doldurma suresi gecince (autoMiss "yapilmadi" yapar) seri bozulur
    const p=await ac(kur({'2026-09-28':'done','2026-09-29':'done','2026-09-30':'done'}),'2026-10-06T09:00:00');
    add('REG SERI: 3 gunden eski bos gun (yapilmadi) seriyi bozar', 0, await p.evaluate(()=>cS(fH('a'))));
    add('REG SERI: en uzun seri rekoru kalir', 3, await p.evaluate(()=>enUzunSeri(fH('a'))));
    await p.close();
  }
  {
    // REG: acikca "yapilmadi" isaretlenen dun seriyi bozar
    const p=await ac(kur({'2026-09-28':'done','2026-09-29':'done','2026-09-30':'done','2026-10-01':'missed'}),'2026-10-02T09:00:00');
    add('REG SERI: "Yapmadim" isaretli dun seriyi bozar', 0, await p.evaluate(()=>cS(fH('a'))));
    await p.close();
  }
  // GECE
  {
    const p=await ac(kur({}),'2026-09-28T21:00:00');
    await p.clock.setFixedTime(new Date('2026-09-29T00:40:00')); await p.reload(); await p.waitForTimeout(900);
    await p.evaluate(()=>mkDn('a')); await p.waitForTimeout(500);
    add('GECE: 00:40 isaretleyince balon "Sali icin kaydedildi" + "Dune yaz"', 'Salı için kaydedildi|true', await p.evaluate(()=>{var u=document.getElementById('uToast');return document.getElementById('uMsg').textContent+'|'+(!!document.getElementById('uDun')&&getComputedStyle(document.getElementById('uDun')).display!=='none')}));
    await p.evaluate(()=>{var b=document.getElementById('uDun');if(b)b.click()}); await p.waitForTimeout(300);
    add('GECE: "Dune yaz" kaydi pazartesiye tasir', '{"2026-09-28":"done"}', await p.evaluate(()=>JSON.stringify(fH('a').days)));
    add('GECE: balon kapanir, bilgi verilir', 'false|Pazartesi için kaydedildi', await p.evaluate(()=>document.getElementById('uToast').classList.contains('show')+'|'+document.getElementById('sToast').textContent));
    await p.close();
  }
  for(const [ad,gunler,saat] of [['REG GECE: gunduz sorulmaz',{},'2026-09-29T14:00:00'],['REG GECE: dun zaten isaretliyse sorulmaz',{'2026-09-28':'done'},'2026-09-29T00:40:00']]){
    const p=await ac(kur(gunler),saat);
    await p.evaluate(()=>mkDn('a')); await p.waitForTimeout(400);
    add(ad, 'false|Tamamlandı olarak kaydedildi', await p.evaluate(()=>(!!document.getElementById('uDun')&&getComputedStyle(document.getElementById('uDun')).display!=='none')+'|'+document.getElementById('uMsg').textContent));
    await p.close();
  }
  // IPUCU
  {
    const q=`S.habits.push({id:'q',name:'Sosyal Medya',type:'quit',targetDays:21,color:CL[12],createdAt:'2026-09-28',days:{},round:1,history:[],notes:{},freezeUsed:{}});`;
    const p=await ac(kur({'2026-09-28':'done'},q),'2026-09-28T21:00:00');
    add('IPUCU: Kazanmak listesinde Birakmak tarafinda bekleyen soylenir', 'Bırakmak tarafında bugün 1 alışkanlık bekliyor', await p.evaluate(()=>{var e=document.querySelector('#hCards .yan-ipucu');return e?e.firstChild.textContent:'yok'}));
    await p.evaluate(()=>{var b=document.querySelector('#hCards .yan-ipucu');if(b)b.click()}); await p.waitForTimeout(700);
    add('IPUCU: dokununca Birakmak tarafi acilir', 'true|Sosyal Medya', await p.evaluate(()=>medalFlipped+'|'+[].map.call(document.querySelectorAll('#hCards .hc-nm'),function(e){return e.textContent}).join(',')));
    add('REG IPUCU: obur tarafta (Kazanmak) bugun is yoksa ipucu yok', 'yok', await p.evaluate(()=>document.querySelector('#hCards .yan-ipucu')?'var':'yok'));
    await p.close();
  }
  // OZET: pazartesi, gecen hafta 4 gun yapildi
  {
    const p=await ac(kur({'2026-09-21':'done','2026-09-22':'done','2026-09-23':'done','2026-09-24':'done'}),'2026-09-28T09:00:00');
    await p.waitForTimeout(600);
    const t=await p.evaluate(()=>document.getElementById('wkSumArea').innerText.replace(/\s+/g,' '));
    add('OZET: pazar kacirilinca pazartesi gecen haftanin ozeti', true, /Geçen Haftanın Özeti/.test(t)&&/4\/7/.test(t));
    await p.evaluate(()=>{if(document.querySelector('#wkSumArea .wk-sum-close'))closeWkSum()}); await p.reload(); await p.waitForTimeout(1200);
    add('OZET: kapatilinca bir daha cikmaz', '', await p.evaluate(()=>document.getElementById('wkSumArea').innerText.trim()));
    await p.close();
  }
  {
    const p=await ac(kur({'2026-09-21':'done','2026-09-22':'done','2026-09-23':'done'}),'2026-09-27T20:00:00');
    await p.waitForTimeout(600);
    add('REG OZET: pazar bu haftanin ozeti', true, await p.evaluate(()=>/Bu Haftanın Özeti/.test(document.getElementById('wkSumArea').innerText)));
    await p.close();
  }
  // Motivasyon: gunluk mesaj "henuz baslamadin" demez (3 haftalik kullaniciya)
  {
    const p=await ac(kur({'2026-09-28':'done'}),'2026-09-29T09:00:00');
    add('METIN: hic yapilmamis gun mesajlari "bugun" der', false, await p.evaluate(()=>MOTIVS.noneDone.some(function(m){return /^Henüz başlamadın/.test(m)})));
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
