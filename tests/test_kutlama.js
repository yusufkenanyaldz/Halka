// Kutlama (cOv) ve kilometre tasi (msOv) katmanlari:
//  1. Alttaki ekran katmanin arkasindan okunmasin. Olcum: katman acikken ekran
//     goruntusu, alttaki icerik gizlenmis haliyle piksel piksel karsilastirilir
//     (tarayicida canvas ile); belirgin fark (kanal farki > 12) sizan icerik demektir.
//  2. Konfeti baslik, aciklama ve dugmenin ustune binmesin. Olcum: konfeti
//     duserken bu ogelerin uzerindeki noktalarda en ustteki oge konfeti mi.
// Konfeti rastgele: Math.random sabit tohumla belirlenimci yapilir.
const path=require('path');

const run = async (url) => {
  const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
  const b = await chromium.launch();
  const res=[]; const add=(t,beklenen,cikan)=>res.push({t,beklenen,cikan});
  const errs=[];
  // Iki goruntuyu tarayicida karsilastiran sayfa
  const kar=await b.newPage();
  async function fark(a,bb){
    return kar.evaluate(async ([a,bb])=>{
      function yukle(s){return new Promise(r=>{var i=new Image();i.onload=()=>r(i);i.src='data:image/png;base64,'+s})}
      var A=await yukle(a),B=await yukle(bb),w=A.width,h=A.height;
      var c=document.createElement('canvas');c.width=w;c.height=h;var x=c.getContext('2d');
      x.drawImage(A,0,0);var da=x.getImageData(0,0,w,h).data;x.clearRect(0,0,w,h);x.drawImage(B,0,0);var db=x.getImageData(0,0,w,h).data;
      var n=0,enb=0;for(var i=0;i<da.length;i+=4){var m=Math.max(Math.abs(da[i]-db[i]),Math.abs(da[i+1]-db[i+1]),Math.abs(da[i+2]-db[i+2]));if(m>enb)enb=m;if(m>12)n++}
      return {oran:Math.round(n/(w*h)*10000)/100, enBuyuk:enb};
    },[a.toString('base64'),bb.toString('base64')]);
  }
  for(const tema of ['dark','light']){
    const p=await b.newPage({viewport:{width:360,height:780}});
    p.on('pageerror',e=>errs.push(e.message));
    await p.route('**/fonts.googleapis.com/**', r=>r.abort());
    await p.clock.setFixedTime(new Date('2026-09-23T10:00:00'));
    await p.addInitScript(()=>{var s=12345;Math.random=function(){s=(s*1103515245+12345)%2147483648;return s/2147483648}});
    await p.goto(url); await p.waitForTimeout(1500);
    await p.evaluate(t=>{function g(n){var d=new Date();d.setDate(d.getDate()-n);return ds(d)}
      S.ob=true;S.user={name:'Yusuf'};S.milestones={};
      S.habits=[['Spor',21,5],['Kitap oku',30,12],['Yürüyüş',14,3]].map(function(k,i){var h={id:'k'+i,name:k[0],type:'gain',targetDays:k[1],color:CL[i*6],createdAt:g(k[2]),days:{},round:1,history:[],notes:{}};for(var j=1;j<=k[2];j++)h.days[g(j)]='done';return h});
      S.habits.forEach(function(h){[7,14,21,30].forEach(function(d){S.milestones['ms_'+h.id+'_'+d+'_1']=true})});
      setTheme(t);sv()},tema);
    await p.reload(); await p.waitForTimeout(1200);
    await p.evaluate(()=>document.fonts.ready);
    const hareketsiz='*,*::before,*::after{animation:none!important;transition:none!important}';
    for(const [ad,ac,ovId] of [['kutlama',()=>celeb(S.habits[0]),'cOv'],['kilometre',()=>showMilestone('Spor',MILESTONES[0]),'msOv']]){
      const k=(tema==='light'?'ACIK':'KOYU')+' '+ad;
      // --- 1. Sizma ---
      const st=await p.addStyleTag({content:hareketsiz+'.conf{display:none!important}'});
      await p.evaluate(ac); await p.waitForTimeout(400);
      const ile=await p.screenshot();
      await p.evaluate(()=>{document.querySelectorAll('.screen,.bnav,.mesh').forEach(function(e){e.style.visibility='hidden'})});
      await p.waitForTimeout(100);
      const siz=await p.screenshot();
      await p.evaluate(()=>{document.querySelectorAll('.screen,.bnav,.mesh').forEach(function(e){e.style.visibility=''})});
      const f=await fark(ile,siz);
      add(k+': alttaki ekran sizmaz (farkli piksel %'+f.oran+', en buyuk kanal farki '+f.enBuyuk+')', true, f.oran<0.5);
      await p.evaluate(id=>document.getElementById(id).classList.remove('show'),ovId);
      await st.evaluate(e=>e.remove());
      // --- 2. Konfeti ---
      // Konfeti pointer-events:none; elementFromPoint onu hic gormez ve olcum bosuna
      // gecer. Boyama sirasini olcmek icin gecici olarak isabet almasini aciyoruz.
      const isabet=await p.addStyleTag({content:'.conf{pointer-events:auto!important}'});
      await p.evaluate(ac); await p.waitForTimeout(50);
      let binme=0, ornek=0;
      for(const t of [150,450,800,1200]){
        await p.waitForTimeout(t-(ornek?0:0));
        const r=await p.evaluate(id=>{var ov=document.getElementById(id);var hedef=[].slice.call(ov.querySelectorAll('h2,p,button'));var n=0,k=0;
          hedef.forEach(function(e){var q=e.getBoundingClientRect();for(var x=q.left+4;x<q.right-4;x+=8)for(var y=q.top+3;y<q.bottom-3;y+=6){k++;var u=document.elementFromPoint(x,y);if(u&&u.classList&&u.classList.contains('conf'))n++}});
          return {n:n,k:k}},ovId);
        binme+=r.n; ornek+=r.k;
      }
      add(k+': konfeti yazi ve dugmenin ustune binmez ('+binme+'/'+ornek+' nokta)', 0, binme);
      await isabet.evaluate(e=>e.remove());
      // Kutlamadan sonra: konfeti DOM'da kalmamali, gorunmez konfeti dokunmayi yakalamamali
      await p.waitForTimeout(3000);
      const kalan=await p.evaluate(()=>{var c=[].slice.call(document.querySelectorAll('.conf'));var yakalar=0;
        c.forEach(function(e){var q=e.getBoundingClientRect();var u=document.elementFromPoint(q.left+q.width/2,q.top+q.height/2);if(u===e)yakalar++});
        return {adet:c.length,yakalar:yakalar}});
      add(k+': 4 sn sonra DOM\'da konfeti kalmaz', 0, kalan.adet);
      add(k+': kalan konfeti dokunmayi yakalamaz', 0, kalan.yakalar);
      // Dugme hala calisir
      const kapandi=await p.evaluate(id=>{var bt=document.getElementById(id).querySelector('button');bt.click();return !document.getElementById(id).classList.contains('show')},ovId);
      add(k+': dugme katmani kapatir', true, kapandi);
      await p.evaluate(()=>{document.querySelectorAll('.conf').forEach(function(c){c.remove()});var o=document.getElementById('cOv');o.classList.remove('show')});
      await p.waitForTimeout(300);
    }
    // Katman kapaliyken atilan konfeti (orn. odada herkes tamamlayinca mkDn): duserken
    // alttaki dugmelere yapilan dokunmayi yutmamali
    await p.evaluate(()=>spConf()); await p.waitForTimeout(400);
    const yutar=await p.evaluate(()=>{var n=0;document.querySelectorAll('.conf').forEach(function(e){var q=e.getBoundingClientRect();var u=document.elementFromPoint(q.left+q.width/2,q.top+q.height/2);if(u===e)n++});return n});
    add((tema==='light'?'ACIK':'KOYU')+' katmansiz konfeti duserken dokunma yutmaz', 0, yutar);
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
