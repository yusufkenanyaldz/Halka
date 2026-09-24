// Uygulama ici pencere (#pencere): confirm()/alert() sistem pencereleri yerine.
// Eskiden 12 yerde tarayicinin/Android'in kendi penceresi aciliyordu (temaya uymuyordu, "Tamam/Iptal";
// yedek yuklemede "Tamam = Uzerine yaz / Iptal = Ekle" gibi anlasilmasi zor sorular).
//  SISTEM   Hicbir akista sistem penceresi acilmaz (Playwright 'dialog' olayi sayilir).
//  PENCERE  Her akis uygulama ici pencere acar; basliği ve dugmeleri Turkce ve anlamli.
//  VAZGEC   Vazgec / geri tusu / disari dokunma / Esc: islem yapilmaz, pencere kapanir.
//  EVET     Onaylaninca islem yapilir (arsiv, silme, hedef, odadan ayrilma, not temizligi).
//  TEMA     Kart iki temada da zemine uyar (koyu temada koyu, acik temada beyaz).
const path=require('path');

const run = async (url) => {
  const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
  const b = await chromium.launch();
  const res=[]; const add=(t,beklenen,cikan)=>res.push({t,beklenen,cikan});
  const errs=[]; let sistem=0;
  const p=await b.newPage({viewport:{width:360,height:780}});
  p.on('pageerror',e=>errs.push(e.message));
  p.on('dialog',async d=>{sistem++;await d.dismiss()});
  await p.route('**/fonts.googleapis.com/**', r=>r.abort());
  await p.clock.setFixedTime(new Date('2026-09-24T20:00:00'));
  await p.goto(url); await p.waitForTimeout(800);
  const kur=()=>p.evaluate(()=>{S.ob=true;S.user={name:'Elif'};S.milestones={};S.theme='dark';
    var d0=new Date(td()+'T00:00:00');d0.setDate(d0.getDate()-9);var g={};for(var i=0;i<10;i++){var x=new Date(d0);x.setDate(x.getDate()+i);g[ds(x)]='done'}
    S.habits=[{id:'a',name:'Spor',type:'gain',targetDays:21,color:CL[0],createdAt:ds(d0),days:g,round:1,history:[],notes:{'2026-01-01':'eski not'},freezeUsed:{}},
      {id:'b',name:'Kitap',type:'gain',targetDays:21,color:CL[10],createdAt:td(),days:{},round:1,history:[],notes:{}}];
    S.roomId='r';S.roomCode='ABC234';S.roomType='couple';S.sharedHabits=[];sv();document.body.classList.remove('light');
    if(window.pencereKapat)pencereKapat();navTo('main')});
  const pn=()=>p.evaluate(()=>{var e=document.getElementById('pencere');if(!e)return null;
    return {bas:(e.querySelector('.pn-bas')||{}).textContent||'',dug:[].map.call(e.querySelectorAll('.pn-b'),function(x){return x.textContent}).join('|')}});
  const bas=sec=>p.evaluate(s=>{var b=document.querySelector('#pencere [data-sec='+s+']');if(b)b.click();return !!b},sec);

  // Her akis: acilan pencere ve dugmeleri
  const AKISLAR=[
    ['odadan ayril', ()=>leaveRoom(), 'Odadan ayrıl', 'Odadan Ayrıl|Vazgeç'],
    ['not temizligi', ()=>cleanStorage(), 'Yer aç', 'Notları Sil|Vazgeç'],
    ['hedef dusur', ()=>{openDet('a');edDays('a',7)}, 'Hedef 7 gün olsun mu?', 'Hedefi Düşür|Vazgeç'],
    ['ozel hedef dusur', ()=>{openDet('a');document.getElementById('edCustomDay').value='8';edCustomDays('a')}, 'Hedef 8 gün olsun mu?', 'Hedefi Düşür|Vazgeç'],
    ['arsivle', ()=>archiveH('a'), 'Arşivlensin mi?', 'Arşivle|Vazgeç'],
    ['sil', ()=>{dI='a';delC()}, 'Alışkanlık silinsin mi?', 'Sil|Arşivle|Vazgeç'],
    ['tanitim', ()=>resOB(), 'Tanıtım baştan gösterilsin mi?', 'Göster|Vazgeç'],
    ['tum veriler', ()=>clrAll(), 'Tüm veriler silinsin mi?', 'Devam|Vazgeç'],
  ];
  for(const [ad,fn,baslik,dug] of AKISLAR){
    await kur(); const once=sistem;
    await p.evaluate(`(${fn.toString()})()`); await p.waitForTimeout(200);
    const r=await pn();
    add('PENCERE '+ad+': uygulama ici pencere', baslik+' / '+dug, r?r.bas+' / '+r.dug:'yok');
    add('SISTEM '+ad+': sistem penceresi acilmaz', 0, sistem-once);
    // Vazgec: hicbir sey degismez
    const onceS=await p.evaluate(()=>JSON.stringify(S.habits)+S.roomId+S.ob);
    await bas('hayir'); await p.waitForTimeout(200);
    add('VAZGEC '+ad+': islem yapilmaz, pencere kapanir', 'ayni|kapali', await p.evaluate(o=>(JSON.stringify(S.habits)+S.roomId+S.ob===o?'ayni':'degisti')+'|'+(document.getElementById('pencere')?'acik':'kapali'),onceS));
  }
  // Onaylayinca yapilir
  const evet=async(fn,olc)=>{await kur();await p.evaluate(`(${fn.toString()})()`);await p.waitForTimeout(150);await bas('evet');await p.waitForTimeout(250);return p.evaluate(olc)};
  add('EVET arsivle', true, await evet(()=>archiveH('a'),()=>fH('a').archived));
  add('EVET sil', 'Kitap', await evet(()=>{dI='a';delC()},()=>S.habits.map(function(h){return h.name}).join(',')));
  add('EVET hedef dusur', 7, await evet(()=>{openDet('a');edDays('a',7)},()=>fH('a').targetDays));
  add('EVET odadan ayril', 'yok', await evet(()=>leaveRoom(),()=>S.roomId||'yok'));
  add('EVET not temizligi', '{}', await evet(()=>cleanStorage(),()=>JSON.stringify(fH('a').notes)));
  add('EVET tanitim', 's-ob1', await evet(()=>resOB(),()=>document.querySelector('.screen.active').id));
  await kur();
  add('EVET silme penceresinde "Arsivle" arsivler', 'true|2', await p.evaluate(()=>{dI='a';delC();var b=document.querySelector('#pencere [data-sec=arsiv]');if(!b)return 'pencere yok';b.click();return fH('a').archived+'|'+S.habits.length}));
  // Tum veriler: iki adim; ilk "Devam" yalniz ikinci soruyu acar
  await kur();
  add('TUM VERILER: ilk adim silmez, ikinci soru gelir', '2|Emin misin?', await p.evaluate(()=>{clrAll();var b=document.querySelector('#pencere [data-sec=evet]');if(!b)return 'pencere yok';b.click();var t=document.querySelector('#pencere .pn-bas');return S.habits.length+'|'+(t?t.textContent:'ikinci soru yok')}));
  // Hedef yapilanin altina inmiyorsa sorulmaz
  await kur();
  add('REG hedef yukselince sorulmaz', 'yok|30', await p.evaluate(()=>{openDet('a');edDays('a',30);return (document.getElementById('pencere')?'var':'yok')+'|'+fH('a').targetDays}));
  // Kapatma yollari: geri tusu, disari dokunma, Esc
  for(const [ad,yol] of [['geri tusu',"window.__g=handleBack()"],['disari dokunma',"var o=document.getElementById('pencere');if(o)o.dispatchEvent(new MouseEvent('click',{bubbles:true}))"],['Esc',"document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))"]]){
    await kur();
    await p.evaluate(()=>archiveH('a')); await p.waitForTimeout(150);
    await p.evaluate(k=>eval(k),yol); await p.waitForTimeout(150);
    add('VAZGEC '+ad+': pencere kapanir, arsivlenmez', 'kapali|false', await p.evaluate(()=>(document.getElementById('pencere')?'acik':'kapali')+'|'+!!fH('a').archived));
  }
  add('GERI TUSU: pencereyi kapatinca true doner (uygulama kapanmaz)', true, await p.evaluate(()=>window.__g));
  // Tema
  for(const [tema,bek] of [['dark','koyu'],['light','acik']]){
    await kur(); await p.evaluate(t=>{if(t==='light')document.body.classList.add('light');archiveH('a')},tema); await p.waitForTimeout(400);
    add('TEMA '+tema+': kart zemini temaya uyar', bek, await p.evaluate(()=>{var k=document.querySelector('#pencere .pn-kart');if(!k)return 'pencere yok';var c=getComputedStyle(k).backgroundColor.match(/\d+/g).map(Number);return (c[0]+c[1]+c[2])/3>128?'acik':'koyu'}));
    add('TEMA '+tema+': kart katmanlarin ustunde (kutlama 200, bildirim balonu 350 altinda)', true, await p.evaluate(()=>{var o=document.getElementById('pencere');if(!o)return false;var z=+getComputedStyle(o).zIndex;return z>200&&z<350}));
  }
  add('SISTEM: toplamda hic sistem penceresi acilmadi', 0, sistem);
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
