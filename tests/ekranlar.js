// Arayuz denetimleri icin ortak kurgu: dolu veri, ekran listesi, ekranlari gezme.
// Kullananlar: test_kontrast.js (renk), test_tasma.js (kirpilan/bolunen metin).
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
  ['ana-doldur', ()=>{navTo('main');flipMedal(false,true);if(typeof ydGunler==='function'){var h=S.habits.find(function(x){return!x.archived&&!x.paused&&x.type==='gain'&&ydGunler(x).length});if(h){_ydAcik[h.id]=true}}renderMain()}, [0,700,1400,2200]],
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

// Her ekrani acar, her kaydirma konumunda denetim(sayfa ici fonksiyon) calistirir.
// denetim {kalanlar:[{metin,sinif,...}]} dondurur; ayni oge ekran basina bir kez
// sayilsin diye window.__kdGoruldu (WeakSet) her ekranda sifirlanir.
const gez = async (url, {tema='dark', genislik=360, yukseklik=800}, denetim) => {
  const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:genislik,height:yukseklik} });
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.route('**/fonts.googleapis.com/**', r=>r.abort());
  // Saat sabit: veri (tarihler, selamlama, takvim) her calistirmada ayni olsun
  await p.clock.setFixedTime(new Date('2026-09-23T10:00:00'));
  await p.goto(url); await p.waitForTimeout(1500);
  await veriKur(p, tema); await p.reload(); await p.waitForTimeout(1500);
  // Yazi tipi yuklenmeden olcmek genislikleri yedek yazi tipine gore verir (oynak sonuc)
  await p.evaluate(()=>document.fonts.ready);
  // Olcum sirasinda hareket yok: animasyon/gecis kapali, bildirim balonu ve konfeti gizli
  await p.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}.toast,.undo,.conf{display:none!important}'});
  await p.evaluate(()=>{['cOv','msOv'].forEach(function(i){var o=document.getElementById(i);if(o)o.classList.remove('show')});var w=document.getElementById('wkSumArea');if(w)w.innerHTML=''});
  const ekranlar={};
  for(const [ad,hazir,konumlar] of EKRANLAR){
    await p.evaluate(`(${hazir.toString()})()`); await p.waitForTimeout(600);
    await p.evaluate(()=>document.fonts.ready);
    await p.evaluate(()=>{window.__kdGoruldu=new WeakSet()});
    const kalan=new Map(); let toplam=0;
    for(const y of konumlar){
      await p.evaluate(y=>{document.querySelectorAll('.screen.active .scroll-y, .screen.active').forEach(function(s){s.style.scrollBehavior='auto';s.scrollTop=y})},y);
      await p.waitForTimeout(250);
      const r=await p.evaluate(denetim);
      toplam+=r.toplam||0;
      r.kalanlar.forEach(k=>{const key=k.metin+'|'+k.sinif; if(!kalan.has(key))kalan.set(key,k)});
    }
    ekranlar[ad]={toplam, kalanlar:[...kalan.values()]};
    await p.evaluate(()=>{document.querySelectorAll('[id$=Modal]').forEach(function(m){m.remove()});['cOv','msOv'].forEach(function(i){var o=document.getElementById(i);if(o)o.classList.remove('show')})});
  }
  await b.close();
  return {ekranlar, errs};
};


module.exports = { veriKur, EKRANLAR, gez };
