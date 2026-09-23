// Ust baslik cubugu (.topb): "Geri" dugmesi ile baslik arasinda bosluk olsun,
// uzun baslik en cok 2 satir, ekrandan tasmasin, kisa baslik ortada dursun.
// Olcum metnin kendisiyle (Range): geri dugmesinin gorunen iceriginin (ok + "Geri")
// sag kenari ile basligin en soldaki harfi arasindaki gercek piksel mesafesi.
// Dar ekranda "Geri" yazisi gizlenir, yalniz ok kalir; dokunma alani yine 44px olmali.
const path=require('path');
const ADLAR={
  kisa:'Spor',
  orta:'Kitap okuma saati',
  uzun:'Her sabah yirmi dakika meditasyon ve nefes egzersizi',
  tekkelime:'Süperkalifrajilistikespialidosyuslukçuluk'
};

const run = async (url) => {
  const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
  const b = await chromium.launch();
  const res=[]; const add=(t,beklenen,cikan)=>res.push({t,beklenen,cikan});
  const errs=[];
  for(const gen of [320,360,412]){
    const p=await b.newPage({viewport:{width:gen,height:800}});
    p.on('pageerror',e=>errs.push(e.message));
    await p.route('**/fonts.googleapis.com/**', r=>r.abort());
    await p.goto(url); await p.waitForTimeout(1500);
    await p.evaluate(ad=>{S.ob=true;S.user={name:'Y'};
      S.habits=Object.keys(ad).map(function(k,i){return{id:k,name:ad[k],type:'gain',targetDays:21,color:CL[i],createdAt:td(),days:{},round:1,history:[],notes:{}}});sv()},ADLAR);
    await p.reload(); await p.waitForTimeout(1200);
    await p.evaluate(()=>document.fonts.ready);
    const olc=()=>p.evaluate(()=>{
      var bar=document.querySelector('.screen.active .topb'); if(!bar)return null;
      var bk=bar.querySelector('.bk'), h=bar.querySelector('h2');
      function metinKutulari(el){var out=[];var w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);while(w.nextNode()){if(!w.currentNode.textContent.trim())continue;var r=document.createRange();r.selectNodeContents(w.currentNode);[].push.apply(out,[].slice.call(r.getClientRects()).filter(function(q){return q.width>0}))}return out}
      // Dugmenin gorunen icerigi: ok ikonu + (varsa gorunen) "Geri" yazisi
      var g=metinKutulari(bk).concat([].slice.call(bk.querySelectorAll('svg')).map(function(v){return v.getBoundingClientRect()})).filter(function(q){return q.width>0}), t=metinKutulari(h);
      var geriSag=Math.max.apply(null,g.map(function(q){return q.right}));
      var basSol=Math.min.apply(null,t.map(function(q){return q.left})), basSag=Math.max.apply(null,t.map(function(q){return q.right}));
      var ustler=[]; t.forEach(function(q){var y=Math.round(q.top);if(!ustler.some(function(u){return Math.abs(u-y)<4}))ustler.push(y)});
      var hr=h.getBoundingClientRect();
      // Gorunen satir: basligin kutusu disinda kalan (kirpilan) satirlar sayilmaz
      var gorunen=ustler.filter(function(y){return y>=hr.top-2&&y<hr.bottom-4}).length;
      return {bosluk:Math.round(basSol-geriSag), satir:gorunen, sag:Math.round(basSag), vw:innerWidth,
        merkez:Math.round((basSol+basSag)/2), tamAd:h.getAttribute('title')||h.textContent};
    });
    for(const [k,ad] of Object.entries(ADLAR)){
      await p.evaluate(id=>openDet(id),k); await p.waitForTimeout(500);
      const m=await olc();
      const s=gen+'px ayrinti '+k;
      add(s+': "Geri" ile baslik arasinda en az 8px (olculen '+m.bosluk+'px)', true, m.bosluk>=8);
      add(s+': baslik en cok 2 satir', true, m.satir<=2);
      add(s+': baslik ekrandan tasmaz', true, m.sag<=m.vw-16);
      if(k==='kisa')add(s+': kisa baslik ortada (±8px)', true, Math.abs(m.merkez-m.vw/2)<=8);
      if(k==='uzun'||k==='tekkelime')add(s+': tam ad title ile okunabilir', ad, m.tamAd);
    }
    const dok=await p.evaluate(()=>{var r=document.querySelector('.screen.active .topb .bk').getBoundingClientRect();return Math.round(Math.min(r.width,r.height))});
    add(gen+'px geri dugmesi dokunma alani en az 44px', true, dok>=44);
    add(gen+'px geri dugmesi ekran okuyucuya "Geri" der', 'Geri', await p.evaluate(()=>{var b=document.querySelector('.screen.active .topb .bk');return b.getAttribute('aria-label')||b.textContent.trim()}));
    await p.evaluate(()=>{navTo('main');tryAdd()}); await p.waitForTimeout(500);
    const e=await olc();
    add(gen+'px yeni aliskanlik: "Geri" ile baslik arasinda en az 8px', true, e.bosluk>=8);
    add(gen+'px yeni aliskanlik: baslik tek satir', 1, e.satir);
    add(gen+'px yeni aliskanlik: baslik ortada (±8px)', true, Math.abs(e.merkez-e.vw/2)<=8);
    await p.close();
  }
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
