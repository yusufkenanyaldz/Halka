// Android geri tusu (handleBack): Android tarafi evaluateJavascript("handleBack()") cagirir;
// true = JS geri islemini yapti, false = geri alinacak bir sey yok, uygulama kapansin.
// Olculenler: donus degeri, sonra acik kalan ekran ve katman.
//  - acik katman (davet, kilometre tasi, kutlama) once kapanir; kutlamada dugmeyle ayni is (yeni tur)
//  - ana ekranda hicbir sey acik degilse false (eskiden hic deger donmuyordu)
//  - tanitimin ilk ekraninda false; eskiden tanitim bitmeden ana ekrana atiyordu
const path=require('path');

const D=[
  // [ad, tanitim bitti mi, hazirlik, beklenen donus, beklenen ekran, beklenen acik katman]
  ['ana ekran, acik bir sey yok', 1, '', 'false', 's-main', '-'],
  ['kutlama acik', 1, "celeb(S.habits[0])", 'true', 's-main', '-'],
  ['kilometre tasi acik', 1, "showMilestone('Spor',MILESTONES[0])", 'true', 's-main', '-'],
  ['davet penceresi acik', 1, "showInviteModal('Ayşe',{name:'Yoga',type:'gain',color:'#B8A5F0'},'inv_R_x')", 'true', 's-main', '-'],
  ['kutlama ustunde davet: once davet kapanir', 1, "celeb(S.habits[0]);showInviteModal('Ayşe',{name:'Yoga',type:'gain',color:'#B8A5F0'},'inv_R_x')", 'true', 's-main', 'cOv'],
  ['REG ayrinti ekrani -> ana', 1, "openDet(S.habits[0].id)", 'true', 's-main', '-'],
  ['REG istatistik -> ana', 1, "navTo('stats')", 'true', 's-main', '-'],
  ['REG ekle ekrani -> ana', 1, "tryAdd()", 'true', 's-main', '-'],
  ['REG ayarlar alt gorunumu -> ayarlar', 1, "navTo('settings');openWidgetSettings()", 'true', 's-settings', '-'],
  ['REG ayarlar listesi -> ana', 1, "navTo('settings')", 'true', 's-main', '-'],
  ['tanitim 1. ekran', 0, '', 'false', 's-ob1', '-'],
  ['tanitim 2 -> 1', 0, "goOB(2)", 'true', 's-ob1', '-'],
  ['tanitim 3 secim -> 2', 0, "goOB(2);goOB(3)", 'true', 's-ob2', '-'],
];

const run = async (url) => {
  const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
  const b = await chromium.launch();
  const res=[]; const add=(t,beklenen,cikan)=>res.push({t,beklenen,cikan});
  const errs=[];
  async function ac(ob){
    const p=await b.newPage({viewport:{width:360,height:800}});
    p.on('pageerror',e=>errs.push(e.message));
    await p.route('**/fonts.googleapis.com/**', r=>r.abort());
    await p.clock.setFixedTime(new Date('2026-09-23T10:00:00'));
    await p.goto(url); await p.waitForTimeout(900);
    await p.evaluate(ob=>{S.ob=!!ob;S.user={name:ob?'Y':''};S.milestones={};
      S.habits=ob?[{id:'a',name:'Spor',type:'gain',targetDays:21,color:CL[0],createdAt:td(),days:{},round:1,history:[],notes:{}}]:[];sv()},ob);
    await p.reload(); await p.waitForTimeout(1000);
    return p;
  }
  const geri=p=>p.evaluate(()=>{var d=handleBack();return new Promise(res=>setTimeout(()=>res({don:String(d),ekran:(document.querySelector('.screen.active')||{}).id,
    katman:['cOv','msOv'].filter(function(i){return document.getElementById(i).classList.contains('show')}).concat(document.getElementById('inviteModal')?['inviteModal']:[]).join(',')||'-'}),500))});

  for(const [ad,ob,kod,don,ekran,katman] of D){
    const p=await ac(ob);
    if(kod){await p.evaluate(k=>eval(k),kod); await p.waitForTimeout(500);}
    const r=await geri(p);
    add(ad, don+' '+ekran+' '+katman, r.don+' '+r.ekran+' '+r.katman);
    await p.close();
  }
  // Tanitim 3, "odaya katil" paneli: geri secime doner, ekran degismez
  {
    const p=await ac(0);
    await p.evaluate(()=>{goOB(2);goOB(3);ob3Join()}); await p.waitForTimeout(400);
    const r=await geri(p);
    const panel=await p.evaluate(()=>document.getElementById('ob3Choice').style.display!=='none'&&document.getElementById('ob3JoinDiv').style.display==='none');
    add('tanitim 3 katil paneli -> secim', 'true s-ob3 true', r.don+' '+r.ekran+' '+panel);
    await p.close();
  }
  // Kutlama: geri tusu dugmeyle ayni sonucu verir (yeni tur baslar)
  {
    const tur={};
    for(const yol of ['dugme','geri']){
      const p=await ac(1);
      await p.evaluate(()=>{var h=S.habits[0];for(var i=1;i<=21;i++){var d=new Date();d.setDate(d.getDate()-i);h.days[ds(d)]='done'}h.createdAt=Object.keys(h.days).sort()[0];sv();celeb(h)});
      await p.waitForTimeout(400);
      await p.evaluate(y=>{if(y==='dugme')document.querySelector('#cOv button').click();else handleBack()},yol);
      await p.waitForTimeout(500);
      tur[yol]=await p.evaluate(()=>S.habits[0].round+'/'+S.habits[0].history.length);
      await p.close();
    }
    add('KUTLAMA: geri tusu dugmeyle ayni (tur/gecmis)', tur.dugme, tur.geri);
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
