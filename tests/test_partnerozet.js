// Partnere giden ozet (fbSyncShared -> shared/<oda>/<uid>/summary) yalniz paylasilan
// aliskanliklari sayar: partner kartindaki "x/y bugun" altindaki paylasilan listeyle tutar,
// paylasilmayan aliskanliklarin sayisi ve bugunku durumu odaya gitmez.
// Gonderilen veri partner verisi olarak geri beslenip kartta gorunen yazi da olculur.
const path=require('path');

const run = async (url) => {
  const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
  const b = await chromium.launch();
  const res=[]; const add=(t,beklenen,cikan)=>res.push({t,beklenen,cikan});
  const errs=[];
  async function gonder(kod){
    const p=await b.newPage({viewport:{width:360,height:800}});
    p.on('pageerror',e=>errs.push(e.message));
    await p.route('**/fonts.googleapis.com/**', r=>r.abort());
    await p.clock.setFixedTime(new Date('2026-09-23T10:00:00'));
    await p.goto(url); await p.waitForTimeout(900);
    await p.evaluate(kod=>{
      function mk(id,o){return Object.assign({id:id,name:'A-'+id,type:'gain',targetDays:21,color:CL[0],createdAt:td(),days:{},round:1,history:[],notes:{},paused:false,archived:false},o||{})}
      function yap(h){h.days[td()]='done';return h}
      S.ob=true;S.user={name:'Yusuf'};S.milestones={};S.roomId='r';S.roomCode='ABC234';S.roomType='couple';eval(kod);sv()},kod);
    await p.reload(); await p.waitForTimeout(1000);
    const cap=await p.evaluate(()=>{var cap={};fbConnected=true;fbUser={uid:'u'};
      fbDB={ref:function(y){return{set:function(v){cap[y]=v;return Promise.resolve()}}}};fbSyncShared();fbConnected=false;
      return {ozet:cap['shared/r/u/summary'],habits:cap['shared/r/u/habits']||{}}});
    return {p,cap};
  }
  const oz=c=>c.ozet?c.ozet.done+'/'+c.ozet.total:'yok';

  // 1. Bes aliskanlik, a ve c paylasilan; a ve b (ozel) bugun yapildi
  {
    const {p,cap}=await gonder('S.habits=[yap(mk("a")),yap(mk("b")),mk("c"),mk("d"),mk("e")];S.sharedHabits=["a","c"]');
    add('OZET yalniz paylasilanlar', '1/2', oz(cap));
    add('REG paylasilan liste', 'a,c', Object.keys(cap.habits).sort().join(','));
    // Tutarlilik: ozet, giden listedeki todayDone sayisi ve liste boyuyla ayni
    const t=Object.values(cap.habits);
    add('OZET giden listeyle tutarli', t.filter(h=>h.todayDone).length+'/'+t.length, oz(cap));
    // Partner tarafinda kart: bu veri partnerden gelmis gibi cizilir
    await p.evaluate(c=>{S.partnerData={u2:{summary:Object.assign({},c.ozet,{name:'Ayşe'}),habits:c.habits}};_activeMode='self';setMode('couple')},cap);
    await p.waitForTimeout(900);
    const kart=await p.evaluate(()=>{var m=document.getElementById('roomModeContent').textContent.replace(/\s+/g,' ');var r=m.match(/(\d+)\/(\d+) bugün/);return r?r[1]+'/'+r[2]:'yok'});
    add('PARTNER KARTI "x/y bugun"', '1/2', kart);
    await p.close();
  }
  // 2. Hicbir sey paylasilmamis: ozel aliskanliklarin sayisi gitmez
  {
    const {p,cap}=await gonder('S.habits=[yap(mk("a")),mk("b")];S.sharedHabits=[]');
    add('HIC PAYLASIM YOK: ozet', '0/0', oz(cap));
    await p.close();
  }
  // 3. Paylasilan ama duraklatilmis / arsivde: bugun gerekli degil
  {
    const {p,cap}=await gonder('S.habits=[yap(mk("a")),mk("c",{paused:true,pausedAt:td()}),mk("z",{archived:true}),mk("b")];S.sharedHabits=["a","c","z"]');
    add('PAYLASILAN DURAKLATILMIS/ARSIV: ozet', '1/1', oz(cap));
    await p.close();
  }
  // 4. REG: eski veri, sharedHabits hic yok -> paylasim listesi butun aliskanliklar (eski davranis), ozet de
  {
    const {p,cap}=await gonder('S.habits=[yap(mk("a")),mk("b")];delete S.sharedHabits');
    add('REG sharedHabits yok: liste ve ozet ayni kapsam', '2|1/2', Object.keys(cap.habits).length+'|'+oz(cap));
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
