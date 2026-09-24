// Reddedilen davetler: eskiden her ret ayri bir localStorage anahtari (inv_<oda>_<hid>_rej)
// yaziyordu; odadan ayrilinca ve "Tum verileri sil" ile silinmiyor, yedege girmiyordu.
// Simdi S.redDavet[oda][hid] icinde. Olculenler: yeni anahtar yazilmaz, reddedilen davet
// tekrar gelmez (yenilemeden sonra da), odadan ayrilinca ve tum veri silinince gider,
// artik paylasilmayan aliskanligin reddi tutulmaz, eski anahtarlar acilista tasinir.
// Oda dinleyicisi sahte fbDB ile tetiklenir, davet penceresi (#inviteModal) olculur.
const path=require('path');

const run = async (url) => {
  const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
  const b = await chromium.launch();
  const res=[]; const add=(t,beklenen,cikan)=>res.push({t,beklenen,cikan});
  const errs=[];
  async function ac(once){
    const p=await b.newPage({viewport:{width:360,height:800}});
    p.on('pageerror',e=>errs.push(e.message));
    await p.route('**/fonts.googleapis.com/**', r=>r.abort());
    await p.clock.setFixedTime(new Date('2026-09-23T10:00:00'));
    await p.goto(url); await p.waitForTimeout(900);
    await p.evaluate(once=>{S.ob=true;S.user={name:'Y'};S.milestones={};S.habits=[];S.roomId='R1';S.roomCode='ABC234';S.roomType='couple';sv();
      if(once)eval(once)},once||'');
    await p.reload(); await p.waitForTimeout(900);
    return p;
  }
  // Partner verisiyle oda dinleyicisini tetikler; cikan davet penceresinin aliskanlik adini dondurur
  const davet=(p,hids)=>p.evaluate(async hids=>{
    var old=document.getElementById('inviteModal');if(old)old.remove();
    var cb=null;fbConnected=true;fbUser={uid:'ben'};_roomListener=null;_seenInvites={};
    fbDB={ref:function(){return{on:function(ev,f){cb=f;return f},off:function(){},set:function(){return Promise.resolve()},remove:function(){return Promise.resolve()}}}};
    startRoomListener();
    var hs={};hids.forEach(function(h){hs[h]={name:'Ortak '+h,type:'gain',color:'#B8A5F0',targetDays:21}});
    cb({val:function(){return{ben:{},es:{summary:{name:'Ayşe'},habits:hs}}}});
    fbConnected=false;
    await new Promise(r=>setTimeout(r,800));
    var m=document.getElementById('inviteModal');return m?(m.textContent.match(/Ortak h\d+/)||[''])[0]:'yok'},hids);
  const anahtar=p=>p.evaluate(()=>Object.keys(localStorage).filter(function(k){return /_rej$/.test(k)}).length);
  const red=p=>p.evaluate(()=>{function sirala(o){if(!o||typeof o!=='object')return o;var n={};Object.keys(o).sort().forEach(function(k){n[k]=sirala(o[k])});return n}return JSON.stringify(sirala(S.redDavet||{}))});

  // 1. Ret: anahtar yazilmaz, S'e girer, davet bir daha gelmez (yenilemeden sonra da)
  {
    const p=await ac();
    add('ILK: davet gelir', 'Ortak h1', await davet(p,['h1']));
    await p.evaluate(()=>rejectInvite('inv_R1_h1'));
    add('RET: localStorage anahtari yazilmaz', 0, await anahtar(p));
    add('RET: S.redDavet icinde', '{"R1":{"h1":1}}', await red(p));
    add('RET: ayni davet tekrar gelmez', 'yok', await davet(p,['h1']));
    await p.reload(); await p.waitForTimeout(900);
    add('RET: yenilemeden sonra da gelmez', 'yok', await davet(p,['h1']));
    add('REG baska aliskanligin daveti gelir', 'Ortak h2', await davet(p,['h1','h2']));
    // Odadan ayrilma: o odanin retleri gider
    await p.evaluate(()=>{leaveRoom();document.querySelector('#pencere [data-sec=evet]').click()});
    add('ODADAN AYRILINCA: ret silinir', '{}', await red(p));
    await p.close();
  }
  // 2. Artik paylasilmayan aliskanligin reddi tutulmaz
  {
    const p=await ac('S.redDavet={R1:{h1:1,h2:1}};sv()');
    await davet(p,['h2']);
    add('TEMIZLIK: paylasilmayanin reddi silinir, suren kalir', '{"R1":{"h2":1}}', await red(p));
    await p.close();
  }
  // 3. Eski surumden kalan anahtarlar acilista S'e tasinir ve silinir; var olan retler korunur
  {
    const p=await ac('S.redDavet={R0:{x:1}};sv();localStorage.setItem("inv_R1_h1_rej","1");localStorage.setItem("inv_R1_h2_rej","1");localStorage.setItem("inv_R9_zz_rej","1")');
    add('TASIMA: eski anahtarlar silindi', 0, await anahtar(p));
    add('TASIMA: S.redDavet', '{"R0":{"x":1},"R1":{"h1":1,"h2":1},"R9":{"zz":1}}', await red(p));
    add('TASIMA: tasinan ret gecerli', 'yok', await davet(p,['h1']));
    // Tum verileri sil: hicbir ret izi kalmaz
    await Promise.all([p.waitForNavigation(),p.evaluate(()=>{clrAll();document.querySelector('#pencere [data-sec=evet]').click();document.querySelector('#pencere [data-sec=evet]').click()})]);
    await p.waitForTimeout(800);
    add('TUM VERILERI SIL: ret anahtari kalmaz', 0, await anahtar(p));
    add('TUM VERILERI SIL: S.redDavet yok', '{}', await red(p));
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
