// Kart uzerindeki mini halka: ortadaki sayi yuzde oldugunu gostersin ("%76"),
// halkanin ic dairesine sigsin (%100 dahil), ekran okuyucuya anlamini soylesin.
// Kazanma turunde sayi ilerleme, birakma turunde kalan yuzdedir (halka bosalir).
const path=require('path');

const run = async (url) => {
  const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
  const b = await chromium.launch();
  const res=[]; const add=(t,beklenen,cikan)=>res.push({t,beklenen,cikan});
  const errs=[];
  for(const gen of [320,360]){
    const p=await b.newPage({viewport:{width:gen,height:900}});
    p.on('pageerror',e=>errs.push(e.message));
    await p.route('**/fonts.googleapis.com/**', r=>r.abort());
    await p.clock.setFixedTime(new Date('2026-09-23T10:00:00'));
    await p.goto(url); await p.waitForTimeout(1500);
    // done gun sayisi -> beklenen metin
    const K=[['g0','gain',21,0,'%0','tamamlandı'],['g5','gain',21,1,'%5','tamamlandı'],['g76','gain',21,16,'%76','tamamlandı'],['g95','gain',21,20,'%95','tamamlandı'],
             ['q100','quit',30,0,'%100','kaldı'],['q78','quit',90,20,'%78','kaldı']];
    await p.evaluate(K=>{
      function g(n){var d=new Date();d.setDate(d.getDate()-n);return ds(d)}
      S.ob=true;S.user={name:'Y'};S.milestones={};
      S.habits=K.map(function(k,i){var h={id:k[0],name:'A'+i,type:k[1],targetDays:k[2],color:CL[i*5],createdAt:g(k[3]),days:{},round:1,history:[],notes:{},paused:false,archived:false};
        for(var j=1;j<=k[3];j++)h.days[g(j)]='done';return h});
      // kilometre tasi kutlamalari olcumu kapatmasin
      S.habits.forEach(function(h){[7,14,21,30,60,90].forEach(function(d){S.milestones['ms_'+h.id+'_'+d+'_1']=true})});
      S.roomId='r';S.roomType='couple';S.roomCode='ABC234';S.sharedHabits=K.map(function(k){return k[0]});
      sv();
    },K);
    await p.reload(); await p.waitForTimeout(1200);
    await p.evaluate(()=>document.fonts.ready);
    const olc=()=>p.evaluate(()=>{
      var out={};
      document.querySelectorAll('.screen.active .hc-rg, #roomModeArea .hc-rg, .hc-rg').forEach(function(rg){
        if(!rg.offsetParent)return;
        var card=rg.closest('[data-hid]'); var hid=card?card.getAttribute('data-hid'):(rg.getAttribute('onclick')||'').replace(/.*openDet\('([^']+)'.*/,'$1');
        var t=rg.querySelector('.hc-rg-p'); if(!t)return;
        var rng=document.createRange(); rng.selectNodeContents(t); var tr=rng.getBoundingClientRect();
        var svg=rg.querySelector('svg'), c=svg.querySelectorAll('circle'), sr=svg.getBoundingClientRect();
        var r=parseFloat(c[c.length-1].getAttribute('r')), sw=parseFloat(c[c.length-1].getAttribute('stroke-width'));
        var ic=(r-sw/2)*2*sr.width/50;   // ic dairenin piksel capi
        // metin kutusunun kosegeni ic daireye sigmali (dikdortgen daire icinde)
        var kose=Math.sqrt(tr.width*tr.width+tr.height*tr.height);
        out[hid]={metin:t.textContent.replace(/\s+/g,''), sigar:kose<=ic, olcu:Math.round(tr.width)+'x'+Math.round(tr.height)+' ic '+Math.round(ic), etiket:rg.getAttribute('aria-label')||''};
      });
      return out;
    });
    for(const gorunum of ['ana','oda']){
      // Paylasilan aliskanliklar bireysel listede gorunmez: ana liste olculurken paylasim yok
      if(gorunum==='oda'){await p.evaluate(()=>{S.sharedHabits=S.habits.map(function(h){return h.id});setMode('couple')}); await p.waitForTimeout(600);}
      else {await p.evaluate(()=>{S.sharedHabits=[];setMode('self');flipMedal(false,true);renderMain()}); await p.waitForTimeout(400);}
      let m=await olc();
      if(gorunum==='ana'){await p.evaluate(()=>{flipMedal(true,true);renderMain()}); await p.waitForTimeout(400); Object.assign(m,await olc());}
      for(const [id,,,,beklenen,soz] of K){
        const k=gen+'px '+gorunum+' '+id; const v=m[id];
        if(!v){add(k+': halka bulundu', true, false);continue}
        add(k+': sayi yuzde isaretli', beklenen, v.metin);
        add(k+': ic daireye sigar ('+v.olcu+')', true, v.sigar);
        add(k+': ekran okuyucu etiketi', beklenen+' '+soz, v.etiket);
      }
    }
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
    if(!ok||process.argv.includes('--ayrinti'))console.log((ok?'GECTI ':'KALDI ')+r.t+'  beklenen="'+r.beklenen+'" cikan="'+r.cikan+'"');}
  console.log('\nSonuc: '+(out.length-fail)+'/'+out.length+' gecti');
  console.log('Sayfa hatasi:', errs);
  process.exit(fail?1:0);
})();
