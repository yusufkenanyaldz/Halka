// Acik ve koyu temada her ekranin metin kontrasti (WCAG AA, bkz. tests/kontrast.js).
// Ekranlar dolu veriyle acilir, her ekran birkac kaydirma konumunda denetlenir.
// Kullanim: node tests/test_kontrast.js [url] [--ayrinti]
const path=require('path');
const { KONTRAST_DENETIM } = require('./kontrast.js');
const AYRINTI = process.argv.includes('--ayrinti');

async function veriKur(p, tema){
  await p.evaluate(tema=>{
    function g(n){var d=new Date();d.setDate(d.getDate()-n);return ds(d)}
    function mk(o){return Object.assign({id:gid(),type:'gain',targetDays:30,color:CL[S.habits.length*4%CL.length],createdAt:g(20),days:{},round:1,history:[],notes:{},paused:false,archived:false,icon:'book'},o)}
    S.ob=true;S.user={name:'Yusuf'};S.habits=[];
    var a=mk({id:'h0',name:'Spor',targetDays:21});for(var i=1;i<=16;i++)a.days[g(i)]=i%5?'done':'missed';a.days[g(0)]='done';S.habits.push(a);
    var b=mk({name:'Her sabah yirmi dakika meditasyon ve nefes egzersizi',targetDays:21});for(var i=1;i<=12;i++)b.days[g(i)]='done';S.habits.push(b);
    var c=mk({name:'Sigara',type:'quit',targetDays:90,motivNote:'Çocuklarım için'});for(var i=1;i<=20;i++)c.days[g(i)]='done';S.habits.push(c);
    S.habits.push(mk({name:'Kitap oku',targetDays:14,schedule:'weekdays',reminder:'21:00'}));
    S.habits.push(mk({name:'Su iç',targetDays:7,paused:true,pausedAt:g(2)}));
    var f=mk({name:'Şeker',type:'quit',targetDays:30});f.days[g(0)]='missed';S.habits.push(f);
    S.habits.push(mk({name:'Yürüyüş',targetDays:60}));
    S.habits.push(mk({name:'Eski alışkanlık',archived:true}));
    S.milestones={};
    setTheme(tema);sv();
  }, tema);
}

// [ad, hazirlik, kaydirma konumlari]
const EKRANLAR = [
  ['ana',        ()=>{navTo('main');renderMain()},                    [0,700,1400,2200]],
  ['ana-birak',  ()=>{navTo('main');flipMedal(true,true)},            [0]],
  ['detay',      ()=>{flipMedal(false,true);openDet('h0')},                                  [0,700,1400,2200]],
  ['detay-birak',()=>{openDet(S.habits[2].id)},                        [0,1400]],
  ['detay-durak',()=>{openDet(S.habits[4].id)},                        [0,1400]],
  ['ekle',       ()=>{navTo('main');tryAdd()},                         [0,700]],
  ['istatistik', ()=>{navTo('stats')},                                 [0,700,1400,2200]],
  ['ayarlar',    ()=>{navTo('settings')},                              [0,700,1400]],
  ['widget',     ()=>{navTo('settings');openWidgetSettings()},         [0,700]],
  ['oda-kur',    ()=>{navTo('settings');showCreateRoom()},             [0]],
  ['oda-katil',  ()=>{navTo('settings');showJoinRoom()},               [0]],
  ['oda-paylas', ()=>{S.roomId='r';S.roomCode='ABC234';S.roomType='family';navTo('settings');showShareHabits()}, [0]],
  ['oda-ayar',   ()=>{navTo('settings')},                              [900]],
  ['kutlama',    ()=>{delete S.roomId;delete S.roomCode;delete S.roomType;navTo('main');celeb(S.habits[0])}, [0]],
  ['kilometre',  ()=>{document.getElementById('cOv').classList.remove('show');showMilestone('Spor',MILESTONES[1])}, [0]],
];

const run = async (url, tema) => {
  const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:360,height:800} });
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.route('**/fonts.googleapis.com/**', r=>r.abort());
  // Saat sabit: veri (tarihler, selamlama, takvim) her calistirmada ayni olsun
  await p.clock.setFixedTime(new Date('2026-09-23T10:00:00'));
  await p.goto(url); await p.waitForTimeout(1500);
  await veriKur(p, tema); await p.reload(); await p.waitForTimeout(1500);
  // Olcum sirasinda hareket yok: animasyon/gecis kapali, bildirim balonu ve konfeti gizli
  await p.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}.toast,.undo,.conf{display:none!important}'});
  await p.evaluate(()=>{['cOv','msOv'].forEach(function(i){var o=document.getElementById(i);if(o)o.classList.remove('show')});var w=document.getElementById('wkSumArea');if(w)w.innerHTML=''});
  const ekranlar={};
  for(const [ad,hazir,konumlar] of EKRANLAR){
    await p.evaluate(`(${hazir.toString()})()`); await p.waitForTimeout(600);
    await p.evaluate(()=>{window.__kdGoruldu=new WeakSet()});
    const kalan=new Map(); let toplam=0;
    for(const y of konumlar){
      await p.evaluate(y=>{document.querySelectorAll('.screen.active .scroll-y, .screen.active').forEach(function(s){s.style.scrollBehavior='auto';s.scrollTop=y})},y);
      await p.waitForTimeout(250);
      const r=await p.evaluate(KONTRAST_DENETIM);
      toplam+=r.toplam;
      r.kalanlar.forEach(k=>{const key=k.metin+'|'+k.sinif; if(!kalan.has(key))kalan.set(key,k)});
    }
    ekranlar[ad]={toplam, kalanlar:[...kalan.values()]};
    await p.evaluate(()=>{document.querySelectorAll('[id$=Modal]').forEach(function(m){m.remove()});['cOv','msOv'].forEach(function(i){var o=document.getElementById(i);if(o)o.classList.remove('show')})});
  }
  await b.close();
  return {ekranlar, errs};
};

// Denetimin kendisi: orani bilinen ogelerle kalibrasyon
const KALIBRASYON = `<body style="margin:0;background:#fff;font:16px sans-serif">
  <div id="a" style="color:#767676">gecer 4.54</div>
  <div id="b" style="color:#777777">kalir 4.48</div>
  <div style="opacity:.5"><div id="c" style="color:#000">yari saydam siyah</div></div>
  <div style="background:rgba(0,0,0,.7);padding:4px"><div id="d" style="color:#000">yari saydam zeminde siyah</div></div>
  <div id="e" style="font-size:40px;font-weight:900;background:linear-gradient(90deg,#000,#eee);-webkit-background-clip:text;-webkit-text-fill-color:transparent">degrade</div>
  <div style="background:#111;height:20px;position:relative;width:100px"><div id="f" style="position:absolute;top:30px;color:#fff">tasan beyaz</div></div>
  <div style="height:40px"></div>
  <div style="background:linear-gradient(90deg,#000,#333);padding:4px"><div id="g" style="color:#fff">koyu degradede beyaz</div></div>
</body>`;
async function kalibrasyon(){
  const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
  const b=await chromium.launch(); const p=await b.newPage({viewport:{width:360,height:600}});
  await p.setContent(KALIBRASYON);
  const r=await p.evaluate(KONTRAST_DENETIM);
  await b.close();
  const k=Object.fromEntries(r.kalanlar.map(x=>[x.metin,x.oran]));
  const kaldi=m=>m in k;
  return [
    ['DENETIM: 4.54 gecer', false, kaldi('gecer 4.54')],
    ['DENETIM: 4.48 kalir', true, kaldi('kalir 4.48')],
    ['DENETIM: %50 saydam siyah beyazda kalir (~3.95)', true, kaldi('yari saydam siyah')],
    ['DENETIM: %70 siyah katmanda siyah yazi kalir (~2.5)', true, kaldi('yari saydam zeminde siyah')],
    ['DENETIM: degrade yazi en acik duraga gore kalir', true, kaldi('degrade')],
    ['DENETIM: atasindan tasan beyaz yazi beyaz zeminde kalir', true, kaldi('tasan beyaz')],
    ['DENETIM: koyu degrade zeminde beyaz gecer', false, kaldi('koyu degradede beyaz')],
    ['DENETIM: belirsiz oge yok', 0, r.belirsiz],
  ];
}

(async()=>{
  const url = process.argv.find(a=>/^(file|https?):/.test(a)) || (process.env.HALKA_URL || 'file://'+path.resolve(__dirname,'..','index.html'));
  let fail=0, satirlar=[];
  for(const [t,beklenen,cikan] of await kalibrasyon()){
    const ok=String(beklenen)===String(cikan); if(!ok)fail++;
    satirlar.push((ok?'GECTI ':'KALDI ')+t+'  beklenen="'+beklenen+'" cikan="'+cikan+'"');
  }
  for(const tema of (process.env.TEMA?[process.env.TEMA]:['light','dark'])){
    const {ekranlar,errs}=await run(url, tema);
    let tk=0;
    for(const [ad,r] of Object.entries(ekranlar)){
      tk+=r.kalanlar.length;
      const ok=r.kalanlar.length===0; if(!ok)fail++;
      satirlar.push((ok?'GECTI ':'KALDI ')+(tema==='light'?'ACIK':'KOYU')+' '+ad+': esigin altinda kalan metin  beklenen="0" cikan="'+r.kalanlar.length+'"'
        +(r.kalanlar.length?'  en kotu: '+r.kalanlar.slice(0,3).map(k=>'"'+k.metin+'" '+k.oran).join(', '):''));
      if(AYRINTI)r.kalanlar.forEach(k=>satirlar.push('      '+k.oran.toFixed(2)+' <'+k.esik+'  '+k.renk+'  .'+String(k.sinif).split(' ')[0]+'  "'+k.metin+'"'));
    }
    if(errs.length){fail++;satirlar.push('KALDI '+tema+' sayfa hatasi: '+errs.join(' | '))}
  }
  satirlar.forEach(s=>console.log(s));
  const n=satirlar.filter(s=>/^(GECTI|KALDI)/.test(s)).length;
  console.log('\nSonuc: '+(n-fail)+'/'+n+' gecti');
  console.log('Sayfa hatasi: (yok)');
  process.exit(fail?1:0);
})();
