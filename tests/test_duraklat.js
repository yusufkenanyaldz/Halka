// Gunluk sayim ("x/y tamamlandi", "Bugunu tamamladin", motivasyon, widget, partner ozeti,
// ortak aliskanliklar konfetisi) yalniz bugun yapilmasi gerekeni sayar: duraklatilmis ve
// bugun programinda olmayan aliskanlik paydaya girmez. Eskiden bir aliskanlik duraklatilinca
// (ya da hafta sonu hafta ici aliskanligi varken) gun hic "tamam" olamiyordu.
// 2026-09-23 Carsamba, 2026-09-26 Cumartesi.
const path=require('path');

const run = async (url) => {
  const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
  const b = await chromium.launch();
  const res=[]; const add=(t,beklenen,cikan)=>res.push({t,beklenen,cikan});
  const errs=[];
  async function ac(gun,kod){
    const p=await b.newPage({viewport:{width:360,height:800}});
    p.on('pageerror',e=>errs.push(e.message));
    await p.route('**/fonts.googleapis.com/**', r=>r.abort());
    await p.clock.setFixedTime(new Date(gun+'T10:00:00'));
    await p.addInitScript(()=>{window.__w=null;window.HalkaBridge={updateWidget:function(j){window.__w=JSON.parse(j)},getStatusBarHeight:function(){return 0}}});
    await p.goto(url); await p.waitForTimeout(1000);
    await p.evaluate(kod=>{
      function g(n){var d=new Date();d.setDate(d.getDate()-n);return ds(d)}
      // createdAt bugun: gecmiste bos gun yok (joker/autoMiss sayilari kaydirmasin)
      function mk(id,o){return Object.assign({id:id,name:'Spor',type:'gain',targetDays:21,color:CL[0],createdAt:td(),days:{},round:1,history:[],notes:{},paused:false,archived:false},o||{})}
      S.ob=true;S.user={name:'Y'};S.milestones={};S.habits=[];eval(kod);sv()},kod);
    await p.reload(); await p.waitForTimeout(1200);
    return p;
  }
  const oku=p=>p.evaluate(()=>{function t(id){var e=document.getElementById(id);return e?e.textContent.replace(/\s+/g,' ').trim():''}
    pushWidgetData();
    return {sub:t('mSub'),motiv:t('mMotiv'),afis:t('allDoneBanner'),seri:t('streakA'),
      tumu:MOTIVS.allDone.indexOf(t('mMotiv'))>=0,
      w:window.__w?window.__w.done+'/'+window.__w.total:'yok', wAd:window.__w?window.__w.habits.map(function(h){return h.id}).join(','):'',
      kart:!!document.querySelector('#hCards [data-hid="p"]')}});
  const ozet=p=>p.evaluate(()=>{var cap={};fbConnected=true;fbUser={uid:'u'};S.roomId='r';
    fbDB={ref:function(y){return{set:function(v){cap[y]=v;return Promise.resolve()}}}};fbSyncShared();fbConnected=false;
    var o=cap['shared/r/u/summary'];return o?o.done+'/'+o.total:'yok'});

  // A: yalniz duraklatilmis
  {
    const p=await ac('2026-09-23','S.habits=[mk("p",{paused:true,pausedAt:td()})]'); const r=await oku(p);
    add('YALNIZ DURAKLATILMIS: ust satir', 'Tüm alışkanlıklar duraklatıldı', r.sub);
    add('YALNIZ DURAKLATILMIS: "harekete gec" motivasyonu yok', '', r.motiv);
    add('YALNIZ DURAKLATILMIS: "Seri baslatmadin" karti yok', '', r.seri);
    add('YALNIZ DURAKLATILMIS: widget sayaci', '0/0', r.w);
    add('YALNIZ DURAKLATILMIS: duraklatilmis kart yine gorunur (REG)', true, r.kart);
    await p.close();
  }
  // B: etkin olan bugun tamam, biri duraklatilmis
  {
    const p=await ac('2026-09-23','var a=mk("a");a.days[td()]="done";S.habits=[a,mk("p",{name:"Kitap",paused:true,pausedAt:td()})]');
    const r=await oku(p);
    add('DURAKLATILMIS+TAMAM: ust satir', '1/1 alışkanlık tamamlandı', r.sub);
    add('DURAKLATILMIS+TAMAM: "Bugunu tamamladin" afisi', true, r.afis.length>0);
    add('DURAKLATILMIS+TAMAM: "hepsi bitti" motivasyonu', true, r.tumu);
    add('DURAKLATILMIS+TAMAM: widget sayaci', '1/1', r.w);
    add('DURAKLATILMIS+TAMAM: widget listesinde duraklatilmis yok', 'a', r.wAd);
    add('DURAKLATILMIS+TAMAM: partnere giden ozet', '1/1', await ozet(p));
    await p.close();
  }
  // C: etkin olan henuz yapilmadi (REG: afis yok, 0/1)
  {
    const p=await ac('2026-09-23','S.habits=[mk("a"),mk("p",{name:"Kitap",paused:true,pausedAt:td()})]'); const r=await oku(p);
    add('REG DURAKLATILMIS+ACIK: ust satir', '0/1 alışkanlık tamamlandı', r.sub);
    add('REG DURAKLATILMIS+ACIK: afis yok', '', r.afis);
    await p.close();
  }
  // D: Cumartesi, hafta ici aliskanligi programda degil
  {
    const p=await ac('2026-09-26','var a=mk("a");a.days[td()]="done";S.habits=[a,mk("w",{name:"Kitap",schedule:"weekdays"})]'); const r=await oku(p);
    add('HAFTA SONU: ust satir', '1/1 alışkanlık tamamlandı', r.sub);
    add('HAFTA SONU: "Bugunu tamamladin" afisi', true, r.afis.length>0);
    add('HAFTA SONU: widget sayaci', '1/1', r.w);
    await p.close();
  }
  {
    const p=await ac('2026-09-26','S.habits=[mk("w",{name:"Kitap",schedule:"weekdays"})]'); const r=await oku(p);
    add('HAFTA SONU YALNIZ HAFTA ICI: ust satir', 'Bugün programında alışkanlık yok', r.sub);
    add('HAFTA SONU YALNIZ HAFTA ICI: motivasyon yok', '', r.motiv);
    await p.close();
  }
  // REG: Carsamba ayni kurgu, hafta ici aliskanligi sayilir
  {
    const p=await ac('2026-09-23','var a=mk("a");a.days[td()]="done";S.habits=[a,mk("w",{name:"Kitap",schedule:"weekdays"})]'); const r=await oku(p);
    add('REG HAFTA ICI: ust satir', '1/2 alışkanlık tamamlandı', r.sub);
    await p.close();
  }
  // Widget'tan duraklatilmisa dokunma ilerletmez; etkine dokunma isler (REG)
  {
    const p=await ac('2026-09-23','S.habits=[mk("a"),mk("p",{name:"Kitap",paused:true,pausedAt:td()})]');
    const r=await p.evaluate(()=>{widgetComplete('p',td());widgetComplete('a',td());function d(id){return dayState(fH(id),td())==='done'?'done':'yok'}return d('p')+'|'+d('a')});
    add('WIDGET: duraklatilmis isaretlenmez, etkin isaretlenir', 'yok|done', r);
    await p.close();
  }
  // Ortak aliskanliklar: duraklatilmis ortak aliskanlik "hepsi tamam" konfetisini engellemez
  {
    const p=await ac('2026-09-23','S.habits=[mk("a"),mk("p",{name:"Kitap",paused:true,pausedAt:td()})];S.roomId="r";S.roomCode="ABC234";S.roomType="couple";S.sharedHabits=["a","p"]');
    const n=await p.evaluate(async()=>{window.__k=0;spConf=function(){window.__k++};mkDn('a');await new Promise(r=>setTimeout(r,800));return window.__k});
    add('ORTAK: duraklatilmis varken hepsi tamam konfetisi', true, n>0);
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
