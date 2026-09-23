// Metin tutarliligi:
//  1. Arayuzde Ingilizce "Onboarding" kalmasin (ayarlar maddesi ve onay penceresi).
//  2. Istatistikteki "En uzun seri" omur boyu rekoru gostersin, su anki seriyi degil.
//     Seri rozetleri (7/21/30 gun) de rekora bakar; seri kirilinca rozet geri alinmaz.
// Kural cS ile ayni: duraklatilmis ve programda olmayan gun seriyi bozmaz, bugun
// henuz isaretlenmediyse bozmaz; gecmis turlardaki gunler (h.history) de sayilir.
// 2026-09-23 Carsamba.
const path=require('path');

const run = async (url) => {
  const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
  const b = await chromium.launch();
  const res=[]; const add=(t,beklenen,cikan)=>res.push({t,beklenen,cikan});
  const errs=[];
  async function ac(kod){
    const p=await b.newPage({viewport:{width:360,height:800}});
    p.on('pageerror',e=>errs.push(e.message));
    await p.route('**/fonts.googleapis.com/**', r=>r.abort());
    await p.clock.setFixedTime(new Date('2026-09-23T10:00:00'));
    await p.goto(url); await p.waitForTimeout(1000);
    await p.evaluate(kod=>{
      function g(n){var d=new Date();d.setDate(d.getDate()-n);return ds(d)}
      function aralik(h,a,z,st){for(var i=a;i>=z;i--)h.days[g(i)]=st}
      function mk(o){return Object.assign({id:'a',name:'Spor',type:'gain',targetDays:60,color:CL[0],createdAt:g(30),days:{},round:1,history:[],notes:{},paused:false,archived:false},o||{})}
      S.ob=true;S.user={name:'Y'};S.milestones={};S.habits=[];
      eval(kod);
      // Kurgudaki bos gunler joker ile doldurulmasin (autoMiss): bu hafta ve gecen hafta kullanilmis say
      S.habits.forEach(function(h){h.freezeUsed={};for(var i=0;i<40;i++)h.freezeUsed[getWeekStart(g(i))]=true});
      sv()},kod);
    await p.reload(); await p.waitForTimeout(1200);
    return p;
  }
  const istat=p=>p.evaluate(()=>{navTo('stats');
    var sr=[].slice.call(document.querySelectorAll('#s-stats .sr, .screen.active .sr')).find(function(e){return /En uzun seri/.test(e.textContent)});
    var rozet={};[].forEach.call(document.querySelectorAll('.screen.active .bi'),function(b){rozet[b.textContent.trim()]=!!b.querySelector('.bc.got')});
    return {deger:sr?sr.querySelector('.sv').textContent.trim():'bulunamadi', r7:rozet['7 Gün Seri'], r21:rozet['21 Gün Seri']}});

  // --- 1. Onboarding ---
  {
    const p=await ac('S.habits=[mk()]');
    const r=await p.evaluate(()=>{navTo('settings');var msg='';var eski=window.confirm;window.confirm=function(m){msg=m;return false};
      var si=[].slice.call(document.querySelectorAll('#seBox .si')).find(function(e){return /Tanıtım|Onboarding/.test(e.textContent)});
      if(si)si.click();window.confirm=eski;
      return {ayar:/Onboarding/i.test(document.getElementById('s-settings').textContent), madde:si?si.textContent.replace('›','').trim():'', onay:msg}});
    add('AYARLAR: "Onboarding" gecmez', false, r.ayar);
    add('AYARLAR: madde Turkce', 'Tanıtımı Tekrar Göster', r.madde);
    add('ONAY: pencere Turkce', true, !!r.onay&&!/Onboarding/i.test(r.onay));
    await p.close();
  }
  // --- 2. En uzun seri ---
  const DURUMLAR=[
    // [ad, kurgu, beklenen deger, 7 gun rozeti]
    ['seri kirildi (10 gun, sonra 5 kacirilan)', 'var h=mk();aralik(h,15,6,"done");aralik(h,5,1,"missed");S.habits=[h]', '10 gün', true],
    ['yeni seri rekordan kisa (10, ara, 4)', 'var h=mk();aralik(h,20,11,"done");aralik(h,10,5,"missed");aralik(h,4,1,"done");S.habits=[h]', '10 gün', true],
    ['su anki seri rekor (REG)', 'var h=mk();aralik(h,10,7,"missed");aralik(h,6,1,"done");S.habits=[h]', '6 gün', false],
    // Duraklatilmis aralik kirilmis eski serinin icinde (su anki seri 0): cS kurtaramaz
    ['duraklatilmis gunler seriyi bozmaz', 'var h=mk();aralik(h,20,16,"done");aralik(h,15,11,"paused");aralik(h,10,6,"done");aralik(h,5,1,"missed");S.habits=[h]', '10 gün', true],
    ['bugun isaretsiz seriyi bozmaz (REG)', 'var h=mk();aralik(h,8,1,"done");S.habits=[h]', '8 gün', true],
    ['hic seri yok (REG)', 'var h=mk();aralik(h,5,1,"missed");S.habits=[h]', '—', false],
  ];
  for(const [ad,kod,bek,r7] of DURUMLAR){
    const p=await ac(kod); const r=await istat(p);
    add('EN UZUN SERI '+ad, bek, r.deger);
    add('ROZET 7 gun '+ad, r7, r.r7);
    await p.close();
  }
  // Hafta ici programi: hafta sonlari seriyi bozmaz. 2026-09-07 Pzt .. 09-18 Cum: 10 is gunu; sonra 3 gun kacirildi
  {
    const p=await ac('var h=mk({schedule:"weekdays"});["07","08","09","10","11","14","15","16","17","18"].forEach(function(d){h.days["2026-09-"+d]="done"});["21","22"].forEach(function(d){h.days["2026-09-"+d]="missed"});S.habits=[h]');
    add('EN UZUN SERI hafta ici programi, hafta sonu bozmaz', '10 gün', (await istat(p)).deger);
    await p.close();
  }
  // Gecmis tur: rekor kapanmis turda (h.history), yeni turda 2 gun
  {
    const p=await ac('var h=mk({round:2,createdAt:g(3),targetDays:21});var eski={};for(var i=30;i>=9;i--)eski[g(i)]="done";h.history=[{round:1,days:eski,completedAt:g(9),createdAt:g(30),targetDays:21}];aralik(h,8,3,"missed");h.createdAt=g(8);aralik(h,2,1,"done");S.habits=[h]');
    const r=await istat(p);
    add('EN UZUN SERI gecmis turdaki rekor sayilir', '22 gün', r.deger);
    add('ROZET 21 gun gecmis turdaki rekorla kalir', true, r.r21);
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
