// Dar ekranda metin kirpilmasin, kisa etiketler bolunmesin, yer tutucular sigsin.
// Android'de yaygin genislikler: 320 (kucuk), 360 (en yaygin), 412.
// Kullanim: node tests/test_tasma.js [url] [--ayrinti]
const path=require('path');
const { TASMA_DENETIM } = require('./tasma.js');
const { gez } = require('./ekranlar.js');
const AYRINTI = process.argv.includes('--ayrinti');
const GENISLIKLER = (process.env.GENISLIK?process.env.GENISLIK.split(',').map(Number):[320,360,412]);

// Denetimin kendisi: sonucu bilinen ogelerle kalibrasyon
const KALIBRASYON = `<body style="margin:0;font:16px sans-serif;width:360px">
  <button style="width:60px;white-space:nowrap;overflow:hidden">Tamamlandı</button>
  <div style="width:60px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Kasitli kisaltma burada</div>
  <div style="width:40px">dort gun seri</div>
  <div style="width:200px">Bu uzun bir cumledir ve birkac satira bolunmesi dogaldir, sorun yok.</div>
  <input style="width:80px" placeholder="Cok uzun bir aciklama metni">
  <div style="width:100px;overflow-x:auto;white-space:nowrap">Yatay kaydirilan uzun bir satir</div>
  <div style="width:80px;overflow:hidden"><span style="white-space:nowrap">Atasi kesiyor bunu</span></div>
  <div data-satir="2" style="width:75px">iki satir izinli</div>
  <div data-satir="2" style="width:20px">uc satir fazla</div>
</body>`;
async function kalibrasyon(){
  const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
  const b=await chromium.launch(); const p=await b.newPage({viewport:{width:360,height:600}});
  await p.setContent(KALIBRASYON);
  const r=await p.evaluate(TASMA_DENETIM); await b.close();
  const tur=m=>{const k=r.kalanlar.find(x=>x.metin.startsWith(m));return k?k.tur:'yok'};
  return [
    ['DENETIM: kirpilan dugme yazisi', 'kirpik', tur('Tamamlandı')],
    ['DENETIM: kasitli ... kisaltmasi sayilmaz', 'yok', tur('Kasitli')],
    ['DENETIM: 3 kelimelik etiket bolunmus', 'bolunmus', tur('dort gun seri')],
    ['DENETIM: uzun cumlenin satira bolunmesi sayilmaz', 'yok', tur('Bu uzun')],
    ['DENETIM: sigmayan yer tutucu', 'yertutucu', tur('Cok uzun')],
    ['DENETIM: yatay kaydirilan satir sayilmaz', 'yok', tur('Yatay')],
    ['DENETIM: atasinin kestigi metin', 'kirpik', tur('Atasi kesiyor')],
    ['DENETIM: data-satir=2 iken 2 satir sayilmaz', 'yok', tur('iki satir izinli')],
    ['DENETIM: data-satir=2 iken 3 satir sayilir', 'bolunmus', tur('uc satir fazla')],
  ];
}

(async()=>{
  const url = process.argv.find(a=>/^(file|https?):/.test(a)) || (process.env.HALKA_URL || 'file://'+path.resolve(__dirname,'..','index.html'));
  let fail=0; const satirlar=[];
  for(const [t,beklenen,cikan] of await kalibrasyon()){
    const ok=String(beklenen)===String(cikan); if(!ok)fail++;
    satirlar.push((ok?'GECTI ':'KALDI ')+t+'  beklenen="'+beklenen+'" cikan="'+cikan+'"');
  }
  const hatalar=[];
  for(const g of GENISLIKLER){
    const {ekranlar,errs}=await gez(url,{tema:'dark',genislik:g,yukseklik:g<=320?640:800},TASMA_DENETIM);
    errs.forEach(e=>hatalar.push(g+'px: '+e));
    for(const [ad,r] of Object.entries(ekranlar)){
      const ok=r.kalanlar.length===0; if(!ok)fail++;
      satirlar.push((ok?'GECTI ':'KALDI ')+g+'px '+ad+': kirpilan/bolunen metin  beklenen="0" cikan="'+r.kalanlar.length+'"'
        +(r.kalanlar.length?'  ornek: '+r.kalanlar.slice(0,3).map(k=>k.tur+' "'+k.metin+'"').join(', '):''));
      if(AYRINTI)r.kalanlar.forEach(k=>satirlar.push('      '+k.tur.padEnd(9)+' .'+String(k.sinif).split(' ')[0]+'  "'+k.metin+'"  ('+k.ayrinti+')'));
    }
  }
  if(hatalar.length){fail++;satirlar.push('KALDI sayfa hatasi: '+hatalar.join(' | '))}
  satirlar.forEach(s=>console.log(s));
  const n=satirlar.filter(s=>/^(GECTI|KALDI)/.test(s)).length;
  console.log('\nSonuc: '+(n-fail)+'/'+n+' gecti');
  console.log('Sayfa hatasi:', hatalar.join(' | ')||'(yok)');
  process.exit(fail?1:0);
})();
