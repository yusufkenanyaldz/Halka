// Bildirim balonu (toast): gizliyken hicbir pikseli (golgesi dahil) gorunmesin,
// ustteki dokunmalari yakalamasin; gorunurken ekrandan tasmasin.
// Durum cubugu payi (--sb) Android'de kopruden gelir, cihaza gore degisir; 0-48 denenir.
// "Gorunmez" olcumu gercek goruntuyle: gizlendikten sonra ust seridin ekran
// goruntusu, balon hic yokken cekilen goruntuyle piksel piksel ayni olmali.
const path=require('path');
const MESAJLAR={
  kisa:'Kaydedildi',
  orta:'En fazla 8 alışkanlık ekleyebilirsin',
  uzun:'Oda sunucusuna bağlanılamadı. Sayfayı yenileyip tekrar dene.'
};

const run = async (url) => {
  const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
  const b = await chromium.launch();
  const res=[]; const add=(t,beklenen,cikan)=>res.push({t,beklenen,cikan});
  const errs=[];
  for(const gen of [320,360]){
    const p=await b.newPage({viewport:{width:gen,height:700}});
    p.on('pageerror',e=>errs.push(e.message));
    await p.route('**/fonts.googleapis.com/**', r=>r.abort());
    await p.goto(url); await p.waitForTimeout(1500);
    await p.evaluate(()=>{S.ob=true;S.user={name:'Y'};S.habits=[];sv()});
    await p.reload(); await p.waitForTimeout(1200);
    await p.evaluate(()=>document.fonts.ready);
    // Arka plan hareket etmesin (karsilastirma sabit olsun)
    await p.addStyleTag({content:'.mesh,.orb,.conf,canvas{display:none!important}*{animation:none!important}'});
    for(const sb of [0,24,36,48]){
      await p.evaluate(sb=>document.documentElement.style.setProperty('--sb',sb+'px'),sb);
      await p.waitForTimeout(100);
      const serit={x:0,y:0,width:gen,height:Math.max(sb,1)+60};
      // Referans: balon hic yok
      await p.evaluate(()=>{document.getElementById('sToast').style.display='none'});
      const bos=await p.screenshot({clip:serit});
      await p.evaluate(()=>{document.getElementById('sToast').style.display=''});
      for(const [ad,m] of Object.entries(MESAJLAR)){
        const k=gen+'px sb='+sb+' '+ad;
        await p.evaluate(m=>toast(m),m); await p.waitForTimeout(500);
        const g=await p.evaluate(sb=>{var r=document.getElementById('sToast').getBoundingClientRect();
          return {ust:Math.round(r.top),sol:Math.round(r.left),sag:Math.round(r.right),yuk:Math.round(r.height),sb:sb,vw:innerWidth}},sb);
        add(k+': gorunurken durum cubugunun altinda', true, g.ust>=sb);
        add(k+': gorunurken ekrandan tasmaz', true, g.sol>=0&&g.sag<=g.vw);
        // Orta mesaj 360'ta tek satir; 320'de kenar bosluklariyla sigmaz, en cok iki satir
        if(ad==='orta')add(k+(gen>=360?': orta mesaj tek satir':': orta mesaj en cok iki satir'), true, g.yuk<=(gen>=360?56:76));
        // Gizlensin (toast 2400ms sonra kapanir, gecis .35s)
        await p.waitForTimeout(2400+600);
        const gizli=await p.screenshot({clip:serit});
        add(k+': gizliyken hicbir pikseli gorunmez', true, gizli.equals(bos));
        const yakalar=await p.evaluate(()=>{var t=document.getElementById('sToast'),r=t.getBoundingClientRect();
          var x=Math.min(Math.max(r.left+r.width/2,1),innerWidth-1), y=Math.min(Math.max(r.bottom-2,1),innerHeight-1);
          var e=document.elementFromPoint(x,y); return !!(e&&t.contains(e))});
        add(k+': gizliyken dokunmayi yakalamaz', false, yakalar);
      }
    }
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
    if(!ok||process.argv.includes('--ayrinti'))console.log((ok?'GECTI ':'KALDI ')+r.t+'  beklenen="'+r.beklenen+'" cikan="'+r.cikan+'"');}
  console.log('\nSonuc: '+(out.length-fail)+'/'+out.length+' gecti');
  console.log('Sayfa hatasi:', errs);
  process.exit(fail?1:0);
})();
