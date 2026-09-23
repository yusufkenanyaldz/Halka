// Acik ve koyu temada her ekranin metin kontrasti (WCAG AA, bkz. tests/kontrast.js).
// Ekranlar dolu veriyle acilir, her ekran birkac kaydirma konumunda denetlenir.
// Kullanim: node tests/test_kontrast.js [url] [--ayrinti]
const path=require('path');
const { KONTRAST_DENETIM } = require('./kontrast.js');
const AYRINTI = process.argv.includes('--ayrinti');

const { gez } = require('./ekranlar.js');

// Denetimin kendisi: orani bilinen ogelerle kalibrasyon
const KALIBRASYON = `<body style="margin:0;background:#fff;font:16px sans-serif">
  <div id="a" style="color:#767676">gecer 4.54</div>
  <div id="b" style="color:#777777">kalir 4.48</div>
  <div style="opacity:.5"><div id="c" style="color:#000">yari saydam siyah</div></div>
  <div style="background:rgba(0,0,0,.7);padding:4px"><div id="d" style="color:#000">yari saydam zeminde siyah</div></div>
  <div id="e" style="font-size:40px;font-weight:900;background:linear-gradient(90deg,#000,#eee);-webkit-background-clip:text;-webkit-text-fill-color:transparent">degrade</div>
  <div style="background:#111;height:20px;position:relative;width:100px"><div id="f" style="position:absolute;top:30px;color:#fff">tasan beyaz</div></div>
  <div style="height:40px"></div>
  <div style="background:linear-gradient(90deg,#000,#333);padding:4px"><div id="g" style="color:#fff">koyu degradede beyaz</div></div>
</body>`;
async function kalibrasyon(){
  const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
  const b=await chromium.launch(); const p=await b.newPage({viewport:{width:360,height:600}});
  await p.setContent(KALIBRASYON);
  const r=await p.evaluate(KONTRAST_DENETIM);
  await b.close();
  const k=Object.fromEntries(r.kalanlar.map(x=>[x.metin,x.oran]));
  const kaldi=m=>m in k;
  return [
    ['DENETIM: 4.54 gecer', false, kaldi('gecer 4.54')],
    ['DENETIM: 4.48 kalir', true, kaldi('kalir 4.48')],
    ['DENETIM: %50 saydam siyah beyazda kalir (~3.95)', true, kaldi('yari saydam siyah')],
    ['DENETIM: %70 siyah katmanda siyah yazi kalir (~2.5)', true, kaldi('yari saydam zeminde siyah')],
    ['DENETIM: degrade yazi en acik duraga gore kalir', true, kaldi('degrade')],
    ['DENETIM: atasindan tasan beyaz yazi beyaz zeminde kalir', true, kaldi('tasan beyaz')],
    ['DENETIM: koyu degrade zeminde beyaz gecer', false, kaldi('koyu degradede beyaz')],
    ['DENETIM: belirsiz oge yok', 0, r.belirsiz],
  ];
}

(async()=>{
  const url = process.argv.find(a=>/^(file|https?):/.test(a)) || (process.env.HALKA_URL || 'file://'+path.resolve(__dirname,'..','index.html'));
  let fail=0, satirlar=[];
  for(const [t,beklenen,cikan] of await kalibrasyon()){
    const ok=String(beklenen)===String(cikan); if(!ok)fail++;
    satirlar.push((ok?'GECTI ':'KALDI ')+t+'  beklenen="'+beklenen+'" cikan="'+cikan+'"');
  }
  for(const tema of (process.env.TEMA?[process.env.TEMA]:['light','dark'])){
    const {ekranlar,errs}=await gez(url, {tema, genislik:360}, KONTRAST_DENETIM);
    let tk=0;
    for(const [ad,r] of Object.entries(ekranlar)){
      tk+=r.kalanlar.length;
      const ok=r.kalanlar.length===0; if(!ok)fail++;
      satirlar.push((ok?'GECTI ':'KALDI ')+(tema==='light'?'ACIK':'KOYU')+' '+ad+': esigin altinda kalan metin  beklenen="0" cikan="'+r.kalanlar.length+'"'
        +(r.kalanlar.length?'  en kotu: '+r.kalanlar.slice(0,3).map(k=>'"'+k.metin+'" '+k.oran).join(', '):''));
      if(AYRINTI)r.kalanlar.forEach(k=>satirlar.push('      '+k.oran.toFixed(2)+' <'+k.esik+'  '+k.renk+'  .'+String(k.sinif).split(' ')[0]+'  "'+k.metin+'"'));
    }
    if(errs.length){fail++;satirlar.push('KALDI '+tema+' sayfa hatasi: '+errs.join(' | '))}
  }
  satirlar.forEach(s=>console.log(s));
  const n=satirlar.filter(s=>/^(GECTI|KALDI)/.test(s)).length;
  console.log('\nSonuc: '+(n-fail)+'/'+n+' gecti');
  console.log('Sayfa hatasi: (yok)');
  process.exit(fail?1:0);
})();
