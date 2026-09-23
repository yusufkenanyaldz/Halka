// Gecmis gunleri doldurma arayuzu (ana liste): isaretlenmemis gunler listeyi
// bogmasin, eylemler gercek dugme olsun, islevi korunsun.
// Saat sabit: 2026-09-23 Carsamba. Son 3 gun = Sal, Pzt, Paz.
// 3 gunden eski bos gunleri autoMiss zaten isler; arayuz yalniz bu 3 gunu sunar.
const path=require('path');
const BUGUN='2026-09-23T10:00:00';

const run = async (url) => {
  const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
  const b = await chromium.launch();
  const res=[]; const add=(t,beklenen,cikan)=>res.push({t,beklenen,cikan});
  const errs=[];
  const p=await b.newPage({viewport:{width:360,height:800}});
  p.on('pageerror',e=>errs.push(e.message));
  await p.route('**/fonts.googleapis.com/**', r=>r.abort());
  await p.clock.setFixedTime(new Date(BUGUN));
  await p.goto(url); await p.waitForTimeout(1500);
  // 8 aliskanlik: son 3 gun bos, oncesi (4..10 gun once) yapilmis
  await p.evaluate(()=>{
    function g(n){var d=new Date();d.setDate(d.getDate()-n);return ds(d)}
    var adlar=['Spor','Kitap','Su','Yürüyüş','Meditasyon','Kodlama','Sigara','Hafta içi'];
    S.ob=true;S.user={name:'Y'};S.milestones={};
    S.habits=adlar.map(function(ad,i){var h={id:'h'+i,name:ad,type:ad==='Sigara'?'quit':'gain',targetDays:30,color:CL[i*4%CL.length],createdAt:g(10),days:{},round:1,history:[],notes:{},paused:false,archived:false};
      for(var k=4;k<=10;k++)h.days[g(k)]='done';
      if(ad==='Hafta içi')h.schedule='weekdays';
      return h});
    sv();
  });
  await p.reload(); await p.waitForTimeout(1200);
  await p.evaluate(()=>document.fonts.ready);
  await p.addStyleTag({content:'*{animation:none!important;transition:none!important}.toast,.undo{display:none!important}'});
  await p.evaluate(()=>{['cOv','msOv'].forEach(function(i){var o=document.getElementById(i);if(o)o.classList.remove('show')})});
  const liste=()=>p.evaluate(()=>{var l=document.getElementById('hList')||document.querySelector('.screen.active .scroll-y');return l.scrollHeight});

  // --- 1. Kapladigi alan ---
  const ile=await liste();
  const dolgu=await p.evaluate(()=>{
    // Doldurma arayuzune ait gorunur ogeler (eski .yd-bar, yeni .yd)
    var el=[].slice.call(document.querySelectorAll('.screen.active .yd-bar, .screen.active .yd'));
    return {adet:el.length, yuk:Math.round(el.reduce(function(t,e){return t+e.getBoundingClientRect().height},0))};
  });
  // Ayni liste, gecmis gunler isaretliyken (arayuz yok)
  const onceki=await p.evaluate(()=>JSON.stringify(S.habits.map(function(h){return h.days})));
  await p.evaluate(()=>{S.habits.forEach(function(h){for(var k=1;k<=3;k++){var d=new Date();d.setDate(d.getDate()-k);h.days[ds(d)]='done'}});renderMain()});
  const siz=await liste();
  await p.evaluate(o=>{JSON.parse(o).forEach(function(d,i){S.habits[i].days=d});sv();renderMain()},onceki);
  const fark=ile-siz;
  add('ALAN: 8 aliskanlikta doldurma arayuzu en cok 8 satir', true, dolgu.adet<=8);
  add('ALAN: listeye ekledigi yukseklik en cok 8x52px (olculen '+fark+'px)', true, fark<=8*52);

  // --- 2. Gorunum: alti cizili baglanti yok, dokunma hedefleri 44px ---
  const gor=await p.evaluate(()=>{
    var alan=[].slice.call(document.querySelectorAll('.screen.active .yd-bar, .screen.active .yd'));
    var cizgili=0, kucuk=[];
    alan.forEach(function(a){a.querySelectorAll('*').forEach(function(e){
      if(getComputedStyle(e).textDecorationLine.indexOf('underline')>=0)cizgili++;
      if(e.onclick||e.tagName==='BUTTON'){var r=e.getBoundingClientRect();if(r.height<44)kucuk.push(e.textContent.trim()+' '+Math.round(r.height)+'px')}
    })});
    return {cizgili:cizgili, kucuk:kucuk};
  });
  add('GORUNUM: alti cizili baglanti yok', 0, gor.cizgili);
  add('GORUNUM: dokunma hedefleri en az 44px', '', gor.kucuk.slice(0,3).join(', '));

  // --- 3. Islev ---
  const dugme=(hid,metin)=>p.evaluate(a=>{var card=[].slice.call(document.querySelectorAll('.screen.active .yd')).find(function(y){return y.getAttribute('data-hid')===a.hid});
    if(!card)return false;var bt=[].slice.call(card.querySelectorAll('button')).find(function(x){return x.textContent.trim()===a.metin});if(!bt)return false;bt.click();return true},{hid,metin});
  const satirlar=hid=>p.evaluate(h=>{var c=[].slice.call(document.querySelectorAll('.screen.active .yd')).find(function(y){return y.getAttribute('data-hid')===h});
    return c?[].slice.call(c.querySelectorAll('.yd-gun')).map(function(x){return x.textContent.trim()}).join(','):'(yok)'},hid);
  const ozet=hid=>p.evaluate(h=>{var c=[].slice.call(document.querySelectorAll('.screen.active .yd')).find(function(y){return y.getAttribute('data-hid')===h});return c?c.querySelector('.yd-ozet').textContent.replace(/\s+/g,' ').trim():'(yok)'},hid);
  add('ISLEV: kapaliyken ozet satiri gunleri sayar', 'İşaretsiz: Dün, Pzt, Paz', await ozet('h0'));
  add('ISLEV: hafta ici aliskanliginda Pazar listelenmez', 'İşaretsiz: Dün, Pzt', await ozet('h7'));
  add('ISLEV: "Doldur" ile acilir', true, await dugme('h0','Doldur'));
  await p.waitForTimeout(200);
  add('ISLEV: acilinca her gun ayri satir', 'Dün,Pazartesi,Pazar', await satirlar('h0'));
  add('ISLEV: "Yaptım" ilk gune (dun) yazilir', true, await dugme('h0','Yaptım'));
  await p.waitForTimeout(300);
  add('ISLEV: dun "done" oldu', 'done', await p.evaluate(()=>{var d=new Date();d.setDate(d.getDate()-1);return S.habits[0].days[ds(d)]||''}));
  add('ISLEV: isaretlenince acik kalir, kalan gunler gorunur', 'Pazartesi,Pazar', await satirlar('h0'));
  await dugme('h0','Yapmadım'); await p.waitForTimeout(300);
  add('ISLEV: "Yapmadım" "missed" yazar', 'missed', await p.evaluate(()=>{var d=new Date();d.setDate(d.getDate()-2);return S.habits[0].days[ds(d)]||''}));
  await dugme('h0','Yaptım'); await p.waitForTimeout(300);
  add('ISLEV: son gun de isaretlenince satir kaybolur', '(yok)', await ozet('h0'));
  // Birakma aliskanliklari madalyonun obur yuzunde
  await p.evaluate(()=>{flipMedal(true,true);renderMain()}); await p.waitForTimeout(300);
  await dugme('h6','Doldur'); await p.waitForTimeout(200);
  add('ISLEV: birakma turunde etiketler', true, await p.evaluate(()=>{var c=document.querySelector('.screen.active .yd[data-hid="h6"]');return !!c&&/Temiz kaldım/.test(c.textContent)&&/Düştüm/.test(c.textContent)}));

  await b.close();
  return {out:res, errs:errs.join(' | ')||'(yok)'};
};
(async()=>{
  const url = process.argv[2] || (process.env.HALKA_URL || 'file://'+path.resolve(__dirname,'..','index.html'));
  const {out,errs} = await run(url);
  let fail=0;
  for(const r of out){const ok=String(r.beklenen)===String(r.cikan); if(!ok)fail++;
    console.log((ok?'GECTI ':'KALDI ')+r.t+'  beklenen="'+r.beklenen+'" cikan="'+r.cikan+'"');}
  console.log('\nSonuc: '+(out.length-fail)+'/'+out.length+' gecti');
  console.log('Sayfa hatasi:', errs);
  process.exit(fail?1:0);
})();
