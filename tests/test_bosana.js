// Bos ana ekran (bireysel aliskanlik yok): tek bir bos durum mesaji, bos halka yok,
// "Aliskanlik Ekle" dugmesi kaydirmadan gorunur ve dokunulabilir (alt menunun altinda degil).
// Durumlar: hic aliskanlik yok / yalniz arsivde / hepsi odada paylasilmis.
// Ayrica: aliskanlik eklenince halka geri gelir; yalniz duraklatilmis aliskanlik varken
// ekran bos sayilmaz.
const path=require('path');

const DURUMLAR={
  hic:   {kod:'S.habits=[]', dugme:'Alışkanlık Ekle'},
  arsiv: {kod:'S.habits=[mk("a",{archived:true})]', dugme:'Alışkanlık Ekle'},
  ortak: {kod:'S.habits=[mk("a")];S.roomId="r";S.roomCode="ABC234";S.roomType="couple";S.sharedHabits=["a"]', dugme:'Bireysel Ekle'},
};
const BOS=/Henüz alışkanlık eklemedin|Kazanılacak\s*alışkanlık yok|Bırakılacak\s*alışkanlık yok|Bireysel alışkanlığın yok/;

const run = async (url) => {
  const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
  const b = await chromium.launch();
  const res=[]; const add=(t,beklenen,cikan)=>res.push({t,beklenen,cikan});
  const errs=[];
  async function ac(g,y,kod){
    const p=await b.newPage({viewport:{width:g,height:y}});
    p.on('pageerror',e=>errs.push(e.message));
    await p.route('**/fonts.googleapis.com/**', r=>r.abort());
    await p.clock.setFixedTime(new Date('2026-09-23T10:00:00'));
    await p.goto(url); await p.waitForTimeout(1200);
    await p.evaluate(kod=>{
      function mk(id,o){return Object.assign({id:id,name:'Spor',type:'gain',targetDays:21,color:CL[0],createdAt:td(),days:{},round:1,history:[],notes:{},paused:false,archived:false},o||{})}
      S.ob=true;S.user={name:'Yusuf'};S.milestones={};eval(kod);sv()},kod);
    await p.reload(); await p.waitForTimeout(1200);
    await p.evaluate(()=>document.fonts.ready);
    await p.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important}'});
    await p.evaluate(()=>{var o=document.getElementById('wkSumArea');if(o)o.innerHTML=''});
    await p.waitForTimeout(200);
    return p;
  }
  // Ana ekranda gorunen bos durum mesajlari, halka ve dugme
  const olc=(p,dugme)=>p.evaluate(([dugme,bos])=>{
    var sc=document.querySelector('#s-main .scroll-y'), nav=document.querySelector('.bnav').getBoundingClientRect();
    function gor(e){if(!e)return false;var q=e.getBoundingClientRect();if(q.width<1||q.height<1)return false;
      for(var a=e;a&&a!==document.body;a=a.parentElement){var c=getComputedStyle(a);if(c.display==='none'||c.visibility==='hidden')return false}return true}
    var re=new RegExp(bos), mesaj=[], w=document.createTreeWalker(document.getElementById('s-main'),NodeFilter.SHOW_TEXT);
    while(w.nextNode()){var t=w.currentNode;if(re.test(t.parentElement.textContent.replace(/\s+/g,' '))&&t.textContent.trim()&&gor(t.parentElement)&&mesaj.indexOf(t.parentElement)<0)mesaj.push(t.parentElement)}
    var bt=[].slice.call(document.querySelectorAll('#s-main button')).find(function(e){return e.textContent.trim()===dugme&&gor(e)});
    var q=bt?bt.getBoundingClientRect():null, ust=q?document.elementFromPoint(q.left+q.width/2,q.top+q.height/2):null;
    var halka=document.getElementById('rSvgActive');
    return {mesaj:mesaj.length, halka:gor(halka)&&halka.getBoundingClientRect().height>0,
      dugmeGorunur:!!q&&q.top>=0&&q.bottom<=nav.top, dugmeDokunulur:!!bt&&!!ust&&bt.contains(ust),
      kaydirma:sc.scrollHeight-sc.clientHeight}},[dugme,BOS.source]);

  for(const [g,y] of [[320,640],[360,800]]){
    for(const [ad,d] of Object.entries(DURUMLAR)){
      const p=await ac(g,y,d.kod); const k=g+'x'+y+' '+ad;
      const m=await olc(p,d.dugme);
      add(k+': tek bos durum mesaji', 1, m.mesaj);
      add(k+': bos halka cizilmez', false, m.halka);
      add(k+': "'+d.dugme+'" alt menunun ustunde gorunur', true, m.dugmeGorunur);
      add(k+': "'+d.dugme+'" dokunmayi alir', true, m.dugmeDokunulur);
      add(k+': ekran kaydirmaya gerek duymaz', true, m.kaydirma<=1);
      await p.close();
    }
  }
  // REG: aliskanlik eklenince halka ve kart geri gelir, bos mesaj gider
  {
    const p=await ac(360,800,DURUMLAR.hic.kod);
    await p.evaluate(()=>{S.habits.push({id:'y',name:'Kitap',type:'gain',targetDays:21,color:CL[3],createdAt:td(),days:{},round:1,history:[],notes:{},paused:false,archived:false});sv();renderMain()});
    await p.waitForTimeout(300);
    const m=await olc(p,'Alışkanlık Ekle');
    add('REG ekleyince halka geri gelir', true, m.halka);
    add('REG ekleyince bos mesaj kalmaz', 0, m.mesaj);
    add('REG ekleyince kart gorunur', true, await p.evaluate(()=>!!document.querySelector('#hCards [data-hid="y"]')&&document.getElementById('todaySec').style.display!=='none'));
    // Dugme ekleme ekranini acar
    await p.evaluate(()=>{S.habits=[];sv();renderMain()}); await p.waitForTimeout(300);
    await p.evaluate(()=>{[].slice.call(document.querySelectorAll('#s-main button')).find(function(e){return e.textContent.trim()==='Alışkanlık Ekle'}).click()});
    await p.waitForTimeout(500);
    add('REG dugme ekleme ekranini acar', 's-add', await p.evaluate(()=>(document.querySelector('.screen.active')||{}).id));
    await p.close();
  }
  // REG: yalniz duraklatilmis aliskanlik: bos sayilmaz, halka ve kart gorunur
  {
    const p=await ac(360,800,'S.habits=[mk("d",{paused:true,pausedAt:td()})]');
    const m=await olc(p,'Alışkanlık Ekle');
    add('REG yalniz duraklatilmis: halka gorunur', true, m.halka);
    add('REG yalniz duraklatilmis: bos mesaj yok', 0, m.mesaj);
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
