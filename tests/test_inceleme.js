// Kullanici gozuyle genel inceleme (Ayarlar, istatistik, ayrinti, tanitim, widget) sirasinda bulunanlar:
//  DEPOLAMA  "Depolama: x KB Saglikli" satirina dokunup onaylamak 90 gunden eski gunleri siliyordu;
//            90 gunden uzun suren bir turda ilerleme dusuyordu (75 -> 55 gun).
//  HARITA    Ayrintidaki "Son 12 Hafta" h.days okuyordu: tur kapaninca eski gunler bos gorunuyordu.
//  ROZET     Rozetler (Ilk Gun, 100 Gun, Dengeci, Hafta Yildizi) yalniz icinde bulunulan turu sayiyordu.
//  TAKVIM    Tur takvimi baslangic + hedef gunde kesiliyordu; tur daha uzun surunce son isaretler
//            ve bugun gorunmuyordu.
//  TANITIM   Ayarlar > Tanitimi Tekrar Goster: geri tusu uygulamayi kapatiyordu (her acilista
//            tanitim), secim zorunluydu, 8 aliskanlik siniri asiliyordu, isim bos geliyordu.
//  RENK      Tanitimdan gelen aliskanliklar ve yeni ekleme ekrani birbirine yakin pembeler veriyordu.
//  SELAM     Ana ekran selamlamasinda isim iki kez kacisliyordu ("&lt;" gorunuyordu).
//  WIDGET    Sonradan eklenen aliskanlik widget'a gelmiyordu, arsivlenen kaliyordu,
//            "Tumunu Kaldir" hepsini geri getiriyordu; "Tum Verileri Sil" widget'i bosaltmiyordu;
//            onizleme "62%" yaziyordu (widget "%62").
//  ISIM      Ayrintida ad bosaltilinca kutu bos kaliyor, baska aliskanligin adi alinabiliyordu.
const path=require('path');

const run = async (url) => {
  const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
  const b = await chromium.launch();
  const res=[]; const add=(t,beklenen,cikan)=>res.push({t,beklenen,cikan});
  const errs=[];
  async function ac(kur,{kopru=false,saat='2026-09-23T10:00:00'}={}){
    const p=await b.newPage({viewport:{width:384,height:832}});
    p.on('pageerror',e=>errs.push(e.message));
    p.on('dialog',d=>d.accept());
    await p.route('**/fonts.googleapis.com/**', r=>r.abort());
    if(kopru)await p.addInitScript(()=>{window.__w=[];window.HalkaBridge={updateWidget:function(j){window.__w.push(JSON.parse(j))},getStatusBarHeight:function(){return 0},setLightStatusBar:function(){},cancelReminder:function(){},scheduleReminderDays:function(){}}});
    await p.clock.setFixedTime(new Date(saat));
    await p.goto(url); await p.waitForTimeout(800);
    await p.evaluate(`(${kur.toString()})()`);
    await p.reload(); await p.waitForTimeout(900);
    await p.evaluate(()=>{['cOv','msOv'].forEach(function(i){document.getElementById(i).classList.remove('show')})});
    return p;
  }
  // Tur: n gun once basladi, gunler sirayla yapildi / yapilmadi
  const mk=`function mk(id,ad,gunOnce,hedef,desen,ek){var d=new Date(td()+'T00:00:00');d.setDate(d.getDate()-gunOnce);
    var h={id:id,name:ad,type:'gain',targetDays:hedef,color:CL[0],createdAt:ds(d),days:{},round:1,history:[],notes:{},freezeUsed:{}};
    for(var i=0;i<gunOnce;i++){var x=new Date(d);x.setDate(x.getDate()+i);h.days[ds(x)]=desen(i);h.freezeUsed[ds(x)]=1}
    return Object.assign(h,ek||{})}`;
  const temel=`S.ob=true;S.user={name:'Y'};S.milestones={};`;

  // DEPOLAMA
  {
    const p=await ac(new Function(`${mk};${temel}
      var h=mk('a','Koşu',150,90,function(i){return i%2?'missed':'done'});
      var eski=new Date(td()+'T00:00:00');eski.setDate(eski.getDate()-120);h.notes[ds(eski)]='eski not';h.notes[td()]='yeni not';
      S.habits=[h];sv()`));
    const once=await p.evaluate(()=>cD(S.habits[0]));
    await p.evaluate(()=>{navTo('settings');cleanStorage()}); await p.reload(); await p.waitForTimeout(900);
    add('DEPOLAMA: temizlik turun ilerlemesini dusurmez', once, await p.evaluate(()=>cD(S.habits[0])));
    add('DEPOLAMA: 90 gunden eski not silinir, yenisi kalir', 'yeni not', await p.evaluate(()=>Object.values(S.habits[0].notes).join('|')));
    add('DEPOLAMA: saglikliyken satir dokunulabilir degil', false, await p.evaluate(()=>{navTo('settings');var e=[].find.call(document.querySelectorAll('#seBox .si'),function(x){return /Depolama/.test(x.textContent)});return !!e.getAttribute('onclick')}));
    await p.close();
  }
  // HARITA + ROZET: tur kapanmis, gunler gecmiste
  {
    const p=await ac(new Function(`${mk};${temel}
      var h=mk('a','Spor',20,21,function(){return 'done'}),q=mk('q','Sigara',20,30,function(){return 'done'},{type:'quit'});
      [h,q].forEach(function(x){x.days[td()]='done';x.history=[{round:1,days:x.days,completedAt:td(),createdAt:x.createdAt,targetDays:x.targetDays}];x.round=2;x.days={};x.createdAt=td()});
      var k=mk('k','Kitap',120,90,function(){return 'done'});k.history=[{round:1,days:k.days,completedAt:td(),createdAt:k.createdAt,targetDays:90}];k.round=2;k.days={};k.createdAt=td();
      S.weeklyGoal=3;S.habits=[h,q,k];sv()`));
    add('HARITA: Son 12 Hafta kapanan turun gunlerini gosterir', 21, await p.evaluate(()=>{openDet('a');return [].filter.call(document.querySelectorAll('#hmGrid [title]'),function(e){return e.title}).length}));
    const rz=await p.evaluate(()=>{navTo('stats');var o={};[].forEach.call(document.querySelectorAll('#stBox .bi'),function(e){o[e.querySelector('.bl').textContent]=e.querySelector('.bc').classList.contains('got')});return o});
    add('ROZET: Ilk Gun tur kapaninca kaybolmaz', true, rz['İlk Gün']);
    add('ROZET: 100 Gun omur boyu sayilir (20+20+120)', true, rz['100 Gün']);
    add('ROZET: Dengeci (14 gun kazanma+birakma birlikte)', true, rz['Dengeci']);
    add('ROZET: Hafta Yildizi (haftalik hedef, gecmis turlar)', true, rz['Hafta Yıldızı']);
    await p.close();
  }
  // TAKVIM: 21 gunluk hedef, 24 gun once basladi, gun asiri yapildi (13 gun), dun de yapildi
  {
    const p=await ac(new Function(`${mk};${temel}
      var h=mk('a','Kitap',24,21,function(i){return i%2?'missed':'done'});
      var dun=new Date(td()+'T00:00:00');dun.setDate(dun.getDate()-1);h.days[ds(dun)]='done';
      S.habits=[h];sv()`));
    const t=await p.evaluate(()=>{openDet('a');return {cD:cD(fH('a')),dolu:document.querySelectorAll('#s-detail .cal-d.dn').length,bugun:document.querySelectorAll('#s-detail .cal-d.td').length}});
    add('TAKVIM: turun butun yapilan gunleri takvimde', t.cD, t.dolu);
    add('TAKVIM: bugun takvimde gorunur', 1, t.bugun);
    await p.close();
  }
  // TANITIM tekrari
  {
    const kur=new Function(`${mk};${temel}
      S.user={name:'Yusuf'};var cs=['Spor','Kitap','Su İçme','Yürüyüş','Koşu','Yoga','Ders'];
      S.habits=cs.map(function(n,i){return mk('h'+i,n,2,21,function(){return 'done'})});sv()`);
    const p=await ac(kur);
    await p.evaluate(()=>{navTo('settings');resOB()}); await p.waitForTimeout(300);
    add('TANITIM: isim alani mevcut adla dolu', 'Yusuf', await p.evaluate(()=>document.getElementById('inpName').value));
    add('TANITIM: ilk ekranda geri tusu tanitimdan cikar (uygulamayi kapatmaz)', 'true|true|s-main', await p.evaluate(()=>{var r=handleBack();return r+'|'+S.ob+'|'+document.querySelector('.screen.active').id}));
    add('TANITIM: cikis kalici (yeniden acilista ana ekran)', 's-main', await p.reload().then(()=>p.waitForTimeout(900)).then(()=>p.evaluate(()=>document.querySelector('.screen.active').id)));
    await p.evaluate(()=>{resOB();goOB(3);ob3Solo()}); await p.waitForTimeout(300);
    add('TANITIM: hic secmeden bitirilebilir (aliskanlik varken)', false, await p.evaluate(()=>document.getElementById('stBtn').disabled));
    const sec=await p.evaluate(()=>{[].forEach.call(document.querySelectorAll('#cBox .chip'),function(c){if(!/Spor|Kitap/.test(c.textContent))c.click()});return sP.length});
    add('TANITIM: 7 aktifken en cok 1 secilir', 1, sec);
    await p.evaluate(()=>finishOB()); await p.waitForTimeout(300);
    add('TANITIM: bitince aktif sayisi 8 sinirini asmaz', 8, await p.evaluate(()=>S.habits.filter(function(h){return!h.archived}).length));
    await p.close();
  }
  // RENK: ilk kullanici 3 aliskanlik secer
  {
    const p=await ac(()=>{localStorage.clear()});
    const fark=await p.evaluate(()=>{goScreen('ob3');ob3Solo();['gain:Spor','gain:Kitap','quit:Sigara'].forEach(function(k){togC(k)});finishOB();function T(hx){var r=parseInt(hx.slice(1,3),16)/255,g=parseInt(hx.slice(3,5),16)/255,b=parseInt(hx.slice(5,7),16)/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;if(!d)return 0;var t=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;t*=60;return t<0?t+360:t}
      var t=S.habits.map(function(h){return T(h.color)}),m=360;
      for(var i=0;i<t.length;i++)for(var j=i+1;j<t.length;j++){var f=Math.abs(t[i]-t[j]);f=Math.min(f,360-f);if(f<m)m=f}return Math.round(m)});
    add('RENK: tanitimdan gelen 3 aliskanligin renkleri tonca en az 60 derece ayri', true, fark>=60);
    const ek=await p.evaluate(()=>{goScreen('add');function T(hx){var r=parseInt(hx.slice(1,3),16)/255,g=parseInt(hx.slice(3,5),16)/255,b=parseInt(hx.slice(5,7),16)/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;if(!d)return 0;var t=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;t*=60;return t<0?t+360:t}var t=T(aC),m=360;S.habits.forEach(function(h){var f=Math.abs(t-T(h.color));f=Math.min(f,360-f);if(f<m)m=f});return Math.round(m)});
    add('RENK: ekleme ekraninin onerdigi renk mevcutlardan en az 40 derece ayri', true, ek>=40);
    await p.close();
  }
  // SELAM
  {
    const p=await ac(new Function(`${mk};${temel}S.user={name:'Ali & <Ayşe>'};S.habits=[mk('a','Spor',1,21,function(){return 'done'})];sv()`));
    add('SELAM: isim oldugu gibi yazilir', true, await p.evaluate(()=>/, Ali & <Ayşe>$/.test(document.getElementById('mGrt').textContent)));
    await p.close();
  }
  // WIDGET
  {
    const p=await ac(new Function(`${mk};${temel}S.habits=[mk('a','Spor',3,21,function(){return 'done'}),mk('b','Kitap',3,21,function(){return 'done'})];S.widgetHabits=['a','b'];sv()`),{kopru:true});
    const son=()=>p.evaluate(()=>__w[__w.length-1].habits.map(function(h){return h.name}).join(',')||'(bos)');
    await p.evaluate(()=>{S.habits.push({id:'c',name:'Yoga',type:'gain',targetDays:21,color:CL[10],createdAt:td(),days:{},round:1,history:[],notes:{}});sv()});
    add('WIDGET: sonradan eklenen aliskanlik widgetta', 'Spor,Kitap,Yoga', await son());
    await p.evaluate(()=>{fH('b').archived=true;sv()});
    add('WIDGET: arsivlenen widgettan cikar', 'Spor,Yoga', await son());
    await p.evaluate(()=>{navTo('settings');openWidgetSettings();setAllWidgetHabits(false)});
    add('WIDGET: Tumunu Kaldir bosaltir', '(bos)', await son());
    await p.evaluate(()=>{toggleWidgetHabit('c')});
    add('WIDGET: tek tek acilir', 'Yoga', await son());
    await p.evaluate(()=>{setAllWidgetHabits(true);fH('a').days[td()]='missed';fH('a').days={};sv();renderSet()});
    add('WIDGET: onizleme yuzdesi widget gibi "%0" (eski "0%")', true, await p.evaluate(()=>{var t=document.getElementById('seBox').textContent;return /%0/.test(t)&&!/\d%/.test(t)}));
    await p.close();
  }
  // Tum Verileri Sil: sayfa yenilenmeden once widget bosaltilir
  {
    const p=await ac(new Function(`${mk};${temel}S.habits=[mk('a','Spor',3,21,function(){return 'done'})];sv()`),{kopru:true});
    await p.exposeFunction('__son',s=>{p.__son=s});
    await p.evaluate(()=>{window.addEventListener('beforeunload',function(){__son(JSON.stringify(__w[__w.length-1].habits))});clrAll()});
    await p.waitForTimeout(900);
    add('SIL: Tum Verileri Sil widgeti bosaltir', '[]', p.__son);
    await p.close();
  }
  // ISIM (ayrinti)
  {
    const p=await ac(new Function(`${mk};${temel}S.habits=[mk('a','Spor',3,21,function(){return 'done'}),mk('b','Kitap',3,21,function(){return 'done'})];sv()`));
    const r1=await p.evaluate(()=>{openDet('a');var i=document.getElementById('edName');i.value='  ';edSaveName('a');return fH('a').name+'|'+i.value});
    add('ISIM: bosaltilan ad kaydedilmez, kutu eski ada doner', 'Spor|Spor', r1);
    const r2=await p.evaluate(()=>{var i=document.getElementById('edName');i.value='kitap';edSaveName('a');return fH('a').name+'|'+i.value});
    add('ISIM: baska aliskanligin adi alinamaz', 'Spor|Spor', r2);
    const r3=await p.evaluate(()=>{var i=document.getElementById('edName');i.value='SPOR';edSaveName('a');return fH('a').name});
    add('REG ISIM: kendi adinin buyuk/kucuk harf degisimi kaydedilir', 'SPOR', r3);
    const r4=await p.evaluate(()=>{fH('b').paused=true;fH('b').pausedAt=td();sv();openDet('b');return document.getElementById('s-detail').textContent});
    add('DURAKLAT: baslik Turkce ("seri korunuyor", "streak" yok)', true, /seri korunuyor/.test(r4)&&!/streak/i.test(r4)&&!/0 gündür/.test(r4));
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
