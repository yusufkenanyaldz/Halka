// Cevrimdisi calisma ve telefona kurulabilirlik: yazi tipleri, uygulama tanim
// dosyasi (manifest), simgeler ve servis calisani.
// Servis calisani file:// altinda calismaz; test depoyu kucuk bir yerel HTTP
// sunucusundan yayinlar. "Cevrimdisi" icin sunucu gercekten kapatilir:
// Playwright'in setOffline'i servis calisaninin isteklerini her zaman
// kesmiyor, o zaman test sahte gecerdi.
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.env.HALKA_ROOT || path.resolve(__dirname, '..');
const TYPES = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json',
  '.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.txt':'text/plain'};

let indexOverride = null, indexHang = false, hung = [];
// Asili birakilan istekleri sonunda gercek icerikle cevapla; yoksa sayfa
// sonsuza dek "yukleniyor"da kalir ve test kilitlenir.
function releaseHung(){hung.splice(0).forEach(r=>{try{r.writeHead(200,{'Content-Type':TYPES['.html']});r.end(fs.readFileSync(path.join(ROOT,'index.html')))}catch(e){}})}
// Sayfa kilitliyse evaluate donmez; sure asiminda yedek deger don.
function within(ms, pr, fallback){return Promise.race([pr.catch(()=>fallback), new Promise(r=>setTimeout(()=>r(fallback),ms))])}
function serve(port){
  return new Promise(res=>{
    const s = http.createServer((q,r)=>{
      let u = decodeURIComponent(q.url.split('?')[0]); if(u.endsWith('/'))u+='index.html';
      if(u==='/index.html'&&indexHang){hung.push(r);return}   // baglanti acik, cevap yok (zayif sebeke)
      if(u==='/index.html'&&indexOverride){r.writeHead(200,{'Content-Type':TYPES['.html']});return r.end(indexOverride)}
      const f = path.join(ROOT, u);
      if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end('yok')}
      r.writeHead(200,{'Content-Type':TYPES[path.extname(f)]||'application/octet-stream'});
      fs.createReadStream(f).pipe(r);
    });
    s.listen(port||0,'127.0.0.1',()=>res(s));
  });
}
function stop(s){return new Promise(r=>{s.close(()=>r());s.closeAllConnections&&s.closeAllConnections()})}

(async()=>{
  const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
  const b = await chromium.launch();
  const res=[]; const add=(t,beklenen,cikan)=>res.push({t,beklenen,cikan});

  let srv = await serve(); const port = srv.address().port;
  const base = 'http://127.0.0.1:'+port+'/';
  const ctx = await b.newContext({ viewport:{width:390,height:844} });
  const p = await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  const google=[]; ctx.on('request',q=>{if(/fonts\.(googleapis|gstatic)\.com/.test(q.url()))google.push(q.url())});

  await p.goto(base,{waitUntil:'domcontentloaded'}); await p.waitForTimeout(2500);

  // --- 1. Yazi tipleri depodan gelir ---
  const fonts = await p.evaluate(async()=>{
    var tr='ğüşiöçĞÜŞİÖÇı';
    var a=await document.fonts.load('700 16px "DM Sans"',tr), c=await document.fonts.load('900 16px "Playfair Display"',tr);
    return {dm:a.length, pf:c.length};
  });
  add('YAZI TIPI: Google\'a istek gitmez', 0, google.length);
  add('YAZI TIPI: DM Sans Turkce harflerle yuklenir', true, fonts.dm>0);
  add('YAZI TIPI: Playfair Display Turkce harflerle yuklenir', true, fonts.pf>0);

  // --- 2. Uygulama tanim dosyasi ve simgeler ---
  const man = await p.evaluate(async()=>{
    var l=document.querySelector('link[rel=manifest]'); if(!l)return {yok:true};
    try{
      var r=await fetch(l.href), m=await r.json(), sizes={};
      for(const ic of (m.icons||[])){
        var u=new URL(ic.src,l.href).href;
        var dim=await new Promise(ok=>{var im=new Image();im.onload=()=>ok(im.naturalWidth+'x'+im.naturalHeight);im.onerror=()=>ok('yuklenemedi');im.src=u});
        sizes[ic.sizes+'|'+(ic.purpose||'any')]=dim;
      }
      return {m, sizes};
    }catch(e){return {hata:e.message}}
  });
  add('MANIFEST: sayfada bagli ve okunur', true, !!man.m);
  const m = man.m||{};
  add('MANIFEST: kisa ad', 'Halka', m.short_name);
  add('MANIFEST: tek basina acilir (standalone)', 'standalone', m.display);
  add('MANIFEST: dil Turkce', 'tr', m.lang);
  add('MANIFEST: 192 simge gercekten 192', '192x192', (man.sizes||{})['192x192|any']);
  add('MANIFEST: 512 simge gercekten 512', '512x512', (man.sizes||{})['512x512|any']);
  add('MANIFEST: maskelenebilir 512 simge', '512x512', (man.sizes||{})['512x512|maskable']);
  add('iOS ana ekran simgesi bagli', true, await p.evaluate(()=>!!document.querySelector('link[rel=apple-touch-icon]')));

  // --- 3. Servis calisani ---
  const swOk = await p.evaluate(async()=>{
    if(!navigator.serviceWorker.getRegistration)return false;
    var r=await navigator.serviceWorker.getRegistration(); if(!r)return false;
    await navigator.serviceWorker.ready; return true;
  }).catch(()=>false);
  add('SERVIS CALISANI: kayitli', true, swOk);
  await p.reload({waitUntil:'domcontentloaded'}); await p.waitForTimeout(1500);
  add('SERVIS CALISANI: sayfayi yonetiyor', true, await p.evaluate(()=>!!navigator.serviceWorker.controller));

  // Chrome'un kendi manifest ayristiricisi: dosyayi buldu mu, sikayeti var mi?
  // (Page.getInstallabilityErrors basliksiz tarayicida manifest yokken bile bos
  // donuyordu; hicbir sey olcmedigi icin kullanilmadi.)
  let am={url:'',errors:'(olculemedi)'};
  try{ const cdp=await ctx.newCDPSession(p);
       const r=await cdp.send('Page.getAppManifest');
       am={url:r.url||'', errors:(r.errors||[]).map(e=>e.message).join(' | ')};
  }catch(e){am.errors='CDP hatasi: '+e.message}
  add('CHROME: manifesti bulur', true, /manifest\.webmanifest$/.test(am.url));
  add('CHROME: manifestte hata yok', '', am.errors);

  // Kullanici verisi olusturalim (cevrimdisi acilista korunmali)
  await p.click('text=Başlayalım'); await p.waitForTimeout(400);
  await p.fill('#inpName','Y'); await p.click('text=Devam'); await p.waitForTimeout(400);
  await p.click('text=Alışkanlık Seç'); await p.waitForTimeout(300);
  await p.click('text=Spor'); await p.waitForTimeout(200);
  await p.click('#stBtn'); await p.waitForTimeout(1200);

  // --- 4. Guncelleme: cevrimiciyken yeni surum hemen gelir (eski onbellekte takilmaz) ---
  indexOverride = fs.readFileSync(path.join(ROOT,'index.html'),'utf8').replace('<title>Halka</title>','<title>Halka</title><meta name="surum-isareti" content="yeni">');
  await p.reload({waitUntil:'domcontentloaded'}); await p.waitForTimeout(1500);
  add('GUNCELLEME: cevrimici yenilemede yeni surum gelir', true,
      await p.evaluate(()=>!!document.querySelector('meta[name=surum-isareti]')));
  indexOverride = null;
  await p.reload({waitUntil:'domcontentloaded'}); await p.waitForTimeout(1500);

  // --- 5. Zayif sebeke: sunucu cevap vermiyor -> birkac saniyede onbellekten acilir ---
  indexHang = true;
  const t0=Date.now(); let hangErr='';
  try{ await p.reload({waitUntil:'domcontentloaded',timeout:15000}); }catch(e){hangErr=e.message.split('\n')[0]}
  const sure=Date.now()-t0;
  add('ZAYIF SEBEKE: sayfa acilir', '', hangErr);
  add('ZAYIF SEBEKE: 6 saniyeden kisa surer', true, sure<6000);
  add('ZAYIF SEBEKE: veriler yerinde', 1, await within(3000, p.evaluate(()=>(window.S&&S.habits)?S.habits.length:-1), -1));
  indexHang = false; releaseHung(); await p.waitForTimeout(1500);

  // --- 6. Cevrimdisi acilis: sunucu kapali ---
  await stop(srv);
  let offErr='';
  try{ await p.reload({waitUntil:'domcontentloaded',timeout:15000}); }catch(e){offErr=e.message.split('\n')[0]}
  await p.waitForTimeout(2500);
  add('CEVRIMDISI: sayfa acilir', '', offErr);
  const off = await within(5000, p.evaluate(async()=>({
    hab: (window.S&&S.habits)?S.habits.length:-1,
    main: !!document.querySelector('#s-main.active'),
    dm: (await document.fonts.load('700 16px "DM Sans"','ğ')).length
  })), {hab:-1,main:false,dm:0});
  add('CEVRIMDISI: veriler yerinde', 1, off.hab);
  add('CEVRIMDISI: ana ekran acik', true, off.main);
  add('CEVRIMDISI: yazi tipi yine yuklenir', true, off.dm>0);
  add('Sayfada JS hatasi yok', '', errs.join(' | '));
  await ctx.close();

  // --- 7. REGRESYON: dosyadan (file://) acilis bozulmaz ---
  const ctx2 = await b.newContext({ viewport:{width:390,height:844} });
  const p2 = await ctx2.newPage(); const errs2=[]; p2.on('pageerror',e=>errs2.push(e.message));
  const cons2=[]; p2.on('console',c=>{if(c.type()==='error')cons2.push(c.text())});
  await p2.goto('file://'+path.join(ROOT,'index.html'),{waitUntil:'domcontentloaded'}); await p2.waitForTimeout(2000);
  add('REG file:// sayfa hatasi yok', '', errs2.join(' | '));
  add('REG file:// yazi tipi yuklenir', true, (await p2.evaluate(async()=>(await document.fonts.load('700 16px "DM Sans"','ğ')).length))>0);
  add('REG file:// servis calisani hatasi konsola dusmez', '', cons2.filter(t=>/ServiceWorker|servis/i.test(t)).join(' | '));
  await ctx2.close();

  await b.close();
  let fail=0;
  for(const r of res){const ok=String(r.beklenen)===String(r.cikan); if(!ok)fail++;
    console.log((ok?'GECTI ':'KALDI ')+r.t+'  beklenen="'+r.beklenen+'" cikan="'+r.cikan+'"');}
  console.log('\nSonuc: '+(res.length-fail)+'/'+res.length+' gecti');
  console.log('Sayfa hatasi:', errs.concat(errs2).join(' | ')||'(yok)');
  process.exit(fail?1:0);
})();
