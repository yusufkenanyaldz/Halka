// Tur kapanisi: turu kapatan gun eski tura aittir. Kapanistan sonra o gun
// kartta, sayacta, widget'ta, partner ozetinde "yapildi" gorunmeli; gunler
// gectikce yeni turda "yapilmadi" sayilmamali (seri kirilmamali, joker harcanmamali).
// Saat page.clock ile sabitlenir, gunler gercekten ilerletilir.
const path=require('path');
const D='2026-09-10';   // Persembe; turun kapandigi gun
function gun(s,n){var d=new Date(s+'T12:00:00');d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)}

const run = async (url) => {
  const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
  const b = await chromium.launch();
  const res=[]; const add=(t,beklenen,cikan)=>res.push({t,beklenen,cikan});
  const errs=[];

  // jokerDolu: o hafta joker zaten kullanilmis (autoMiss "missed" yazar)
  async function kur(jokerDolu){
    const ctx=await b.newContext({viewport:{width:390,height:844}});
    const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message));
    await p.route('**/fonts.googleapis.com/**', r=>r.abort());
    await p.clock.setFixedTime(new Date(D+'T12:00:00'));
    await p.addInitScript(()=>{window.__widget=null;window.HalkaBridge={updateWidget:function(j){window.__widget=JSON.parse(j)},getStatusBarHeight:function(){return 0}}});
    await p.goto(url); await p.waitForTimeout(1500);
    await p.evaluate(a=>{
      var days={};for(var i=6;i>=1;i--){var x=new Date(a.D+'T12:00:00');x.setDate(x.getDate()-i);days[ds(x)]='done'}
      var h={id:'s',name:'Spor',type:'gain',targetDays:7,color:CL[0],createdAt:Object.keys(days).sort()[0],days:days,round:1,history:[],notes:{},paused:false,archived:false};
      if(a.jokerDolu)h.freezeUsed={'2026-09-07':'frozen'};   // haftanin Pazartesi'si, zaten "done"
      S.ob=true;S.user={name:'Y'};S.habits=[h];sv();
    },{D,jokerDolu});
    await p.reload(); await p.waitForTimeout(1200);
    // Bugunu isaretle -> kutlama -> "Yeni Tura Basla"
    await p.evaluate(()=>mkDn('s')); await p.waitForTimeout(1500);
    const kutlama=await p.evaluate(()=>document.getElementById('cOv').classList.contains('show'));
    await p.evaluate(()=>closeC()); await p.waitForTimeout(800);
    return {p,ctx,kutlama};
  }

  // ===== 1. Kapanis gunu =====
  var {p,ctx,kutlama}=await kur(false);
  add('Kurgu: kutlama acildi', true, kutlama);
  var r=await p.evaluate(()=>{
    var h=S.habits[0], card=document.querySelector('.hc[data-hid="s"]')||document.querySelector('.hc');
    return {tur:h.round, basla:h.createdAt, sayac:cD(h),
      dugme:!!(card&&card.querySelector('.hc-btn-main')),
      ust:(document.querySelector('.m-sub, .m-stat, #mSub')||{textContent:''}).textContent,
      gunluk:document.body.innerText.match(/(\d+)\/(\d+) alışkanlık tamamlandı/)};
  });
  add('Yeni tur basladi', 2, r.tur);
  add('ASIL HATA: kartta yine "Tamamlandi" dugmesi cikmaz', false, r.dugme);
  add('ASIL HATA: gunluk sayac bugunu sayar', '1/1', r.gunluk?r.gunluk[1]+'/'+r.gunluk[2]:'(yok)');
  add('Yeni tur yarin baslar (bugun eski tura ait)', gun(D,1), r.basla);
  add('Yeni turun sayaci 0', 0, r.sayac);
  var w=await p.evaluate(()=>{pushWidgetData();return window.__widget});
  add('WIDGET: bugun tamam', true, !!(w&&w.habits[0]&&w.habits[0].done));
  add('WIDGET: 1 tamamlandi', 1, w?w.done:-1);
  var fb=await p.evaluate(()=>{var cap={};fbConnected=true;fbUser={uid:'u'};S.roomId='r';
    fbDB={ref:function(y){return{set:function(v){cap[y]=v;return Promise.resolve()}}}};
    fbSyncShared();fbConnected=false;delete S.roomId;
    return {todayDone:cap['shared/r/u/habits']&&cap['shared/r/u/habits'].s.todayDone, done:cap['shared/r/u/summary']&&cap['shared/r/u/summary'].done}});
  add('PARTNER: bugun tamam gorunur', true, fb.todayDone);
  add('PARTNER: ozette 1 tamamlandi', 1, fb.done);
  // Kapanmis tura ait gun yeni tura yazilamaz / yanlislikla silinmez
  var g=await p.evaluate(()=>{var h=S.habits[0];widgetComplete('s',td());var a=cD(h);undoDn('s');
    return {sayac:a, durum:dayState(h,td()), yeniTurdaBugun:h.days[td()]||''}});
  add('Widget tamamlamasi yeni tura yazilmaz', 0, g.sayac);
  add('Geri al kapanmis turdaki gunu bozmaz', 'done', g.durum);
  add('Yeni turda bugun bos kalir', '', g.yeniTurdaBugun);

  // ===== 2. Gunler gecer =====
  // D+1..D+4 kullanici her gun isaretler, D+5'te uygulama acilir (autoMiss calisir)
  async function ilerle(p){
    await p.clock.setFixedTime(new Date(gun(D,5)+'T12:00:00'));
    await p.evaluate(a=>{var h=S.habits[0];for(var i=1;i<=4;i++){var x=new Date(a+'T12:00:00');x.setDate(x.getDate()+i);h.days[ds(x)]='done'}sv()},D);
    await p.reload(); await p.waitForTimeout(1500);
    return p.evaluate(a=>{var h=S.habits[0];return{kapanis:dayState(h,a),seri:cS(h),sayac:cD(h),joker:Object.keys(h.freezeUsed||{}).join(',')}},D);
  }
  var t=await ilerle(p);
  add('5 GUN SONRA: kapanis gunu hala "done"', 'done', t.kapanis);
  add('5 GUN SONRA: ayni gun iki turda sayilmaz (yeni tur 4)', 4, t.sayac);
  add('5 GUN SONRA: kapanis gunune joker harcanmaz', '', t.joker);
  add('5 GUN SONRA: seri kesintisiz (11 gun)', 11, t.seri);
  await ctx.close();

  var k=await kur(true);
  var t2=await ilerle(k.p);
  add('ASIL HATA (joker dolu): kapanis gunu "missed" olmaz', 'done', t2.kapanis);
  add('ASIL HATA (joker dolu): seri kirilmaz (11 gun)', 11, t2.seri);
  await k.ctx.close();

  // ===== 3. REGRESYON: hedef geriye donuk doldurmayla tamamlandi, bugun bos =====
  // Bugun isaretli degilse bugun yeni tura aittir; yeni tur bugun baslar.
  const ctx3=await b.newContext(); const p3=await ctx3.newPage(); p3.on('pageerror',e=>errs.push(e.message));
  await p3.route('**/fonts.googleapis.com/**', r=>r.abort());
  await p3.clock.setFixedTime(new Date(D+'T12:00:00'));
  await p3.goto(url); await p3.waitForTimeout(1500);
  await p3.evaluate(a=>{var days={};for(var i=7;i>=2;i--){var x=new Date(a+'T12:00:00');x.setDate(x.getDate()-i);days[ds(x)]='done'}
    S.ob=true;S.user={name:'Y'};S.habits=[{id:'s',name:'Spor',type:'gain',targetDays:7,color:CL[0],createdAt:Object.keys(days).sort()[0],days:days,round:1,history:[],notes:{},paused:false,archived:false}];sv()},D);
  await p3.reload(); await p3.waitForTimeout(1200);
  var dun=gun(D,-1);
  await p3.evaluate(y=>bfY('s','done',y),dun); await p3.waitForTimeout(1500);
  await p3.evaluate(()=>closeC()); await p3.waitForTimeout(800);
  var r3=await p3.evaluate(()=>{var h=S.habits[0];var card=document.querySelector('.hc');
    return {basla:h.createdAt, dugme:!!(card&&card.querySelector('.hc-btn-main'))}});
  add('REG bugun bossa yeni tur bugun baslar', D, r3.basla);
  add('REG bugun bossa kartta "Tamamlandi" dugmesi var', true, r3.dugme);
  await p3.evaluate(()=>mkDn('s')); await p3.waitForTimeout(300);
  add('REG bugun yeni tura isaretlenir', 1, await p3.evaluate(()=>cD(S.habits[0])));
  await ctx3.close();

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
