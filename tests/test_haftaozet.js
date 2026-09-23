// Haftalik ozet (pazar gunu ana ekranda): basari orani paydasi yalniz yapilmasi gereken gunleri
// sayar. Programda olmayan gun (hafta ici aliskanliginin hafta sonu), duraklatilmis gun (suren
// ya da bitmis duraklatma) ve henuz isaretlenmemis bugun paydaya girmez; yapilan her gun girer.
// 2026-09-27 Pazar; hafta 21 Pzt - 27 Paz.
const path=require('path');

const run = async (url) => {
  const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
  const b = await chromium.launch();
  const res=[]; const add=(t,beklenen,cikan)=>res.push({t,beklenen,cikan});
  const errs=[];
  const p=await b.newPage({viewport:{width:360,height:800}});
  p.on('pageerror',e=>errs.push(e.message));
  await p.route('**/fonts.googleapis.com/**', r=>r.abort());
  await p.clock.setFixedTime(new Date('2026-09-27T10:00:00'));
  await p.goto(url); await p.waitForTimeout(1000);
  async function ozet(kod){
    await p.evaluate(kod=>{
      function gun(h,liste,st){liste.forEach(function(d){h.days['2026-09-'+d]=st})}
      // freezeUsed: bu ve gecen hafta joker kullanilmis; autoMiss bos gunu "done" yapmasin
      function mk(o){return Object.assign({id:'a',name:'Spor',type:'gain',targetDays:60,color:CL[0],createdAt:'2026-09-14',days:{},round:1,history:[],notes:{},paused:false,archived:false,freezeUsed:{'2026-09-14':'frozen','2026-09-21':'frozen'}},o||{})}
      S.ob=true;S.user={name:'Y'};S.milestones={};S.wkSumSeen={};eval(kod);sv()},kod);
    await p.reload(); await p.waitForTimeout(1200);
    return p.evaluate(()=>{var v=[].map.call(document.querySelectorAll('#wkSumArea .wk-sum-val'),function(e){return e.textContent.trim()});return v.length?v[0]+' '+v[1]:'ozet yok'});
  }
  const D=[
    ['hafta ici programi, 5 is gunu yapildi', 'var h=mk({schedule:"weekdays"});gun(h,["21","22","23","24","25"],"done");S.habits=[h]', '5/5 %100'],
    ['REG hafta ici programi, 3 yapildi 2 kacirildi', 'var h=mk({schedule:"weekdays"});gun(h,["21","22","23"],"done");gun(h,["24","25"],"missed");S.habits=[h]', '3/5 %60'],
    ['ozel program (Pzt, Car, Cum), hepsi yapildi', 'var h=mk({schedule:[0,2,4]});gun(h,["21","23","25"],"done");S.habits=[h]', '3/3 %100'],
    ['program disi gunde yapilan da sayilir', 'var h=mk({schedule:"weekdays"});gun(h,["21","22","23","24","25","26"],"done");S.habits=[h]', '6/6 %100'],
    ['suren duraklatma (Per\'den beri)', 'var h=mk({paused:true,pausedAt:"2026-09-24"});gun(h,["21","22","23"],"done");S.habits=[h]', '3/3 %100'],
    ['biten duraklatma (Per-Cum paused)', 'var h=mk();gun(h,["21","22","23","26"],"done");gun(h,["24","25"],"paused");S.habits=[h]', '4/4 %100'],
    ['bugun (pazar) henuz isaretsiz', 'var h=mk();gun(h,["21","22","23","24","25","26"],"done");S.habits=[h]', '6/6 %100'],
    ['REG bugun kacirildi olarak isaretli', 'var h=mk();gun(h,["21","22","23","24","25","26"],"done");gun(h,["27"],"missed");S.habits=[h]', '6/7 %86'],
    ['REG bugun yapildi', 'var h=mk();gun(h,["21","22","23","24","25","26","27"],"done");S.habits=[h]', '7/7 %100'],
    ['REG her gun, 2 kacirildi', 'var h=mk();gun(h,["21","22","23","24"],"done");gun(h,["25","26"],"missed");S.habits=[h]', '4/6 %67'],
    ['iki aliskanlik: her gun + hafta ici', 'var a=mk();gun(a,["21","22","23","24","25","26"],"done");var w=mk({id:"w",name:"Kitap",schedule:"weekdays"});gun(w,["21","22","23","24"],"done");gun(w,["25"],"missed");S.habits=[a,w]', '10/11 %91'],
  ];
  for(const [ad,kod,bek] of D) add(ad, bek, await ozet(kod));
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
