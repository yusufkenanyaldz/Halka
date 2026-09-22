const run = async (url) => {
  const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport:{width:390,height:844} });
  const p = await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.route('**/fonts.googleapis.com/**', r=>r.abort());
  await p.goto(url); await p.waitForTimeout(7000);
  await p.click('text=Başlayalım'); await p.waitForTimeout(400);
  await p.fill('#inpName','Y'); await p.click('text=Devam'); await p.waitForTimeout(400);
  await p.click('text=Alışkanlık Seç'); await p.waitForTimeout(300);
  await p.click('text=Spor'); await p.waitForTimeout(200);
  await p.click('#stBtn'); await p.waitForTimeout(1500);

  const out = await p.evaluate(()=>{
    var res=[];
    // localStorage.setItem/getItem Storage.prototype uzerinde; ornek uzerinden
    // golgelenmiyor, bu yuzden prototipi gecici olarak degistiriyoruz.
    var SP=Storage.prototype;
    var realSet=SP.setItem, realGet=SP.getItem;
    function toastTxt(){return document.getElementById('sToast').textContent}
    function bannerTxt(){return document.getElementById('storageWarnArea').innerText.replace(/\n+/g,' ').trim()}
    function clearUI(){document.getElementById('sToast').textContent='';
                       document.getElementById('storageWarnArea').innerHTML='';}
    function restore(){SP.setItem=realSet;SP.getItem=realGet;_saveErr=null}
    function stubSet(fn){SP.setItem=fn}
    function stubGet(fn){SP.getItem=fn}
    function quotaErr(){var e=new Error('quota');e.name='QuotaExceededError';e.code=22;return e}

    // --- 1. ASIL HATA: Firebase hatasi "Depolama dolu" gostermemeli ---
    restore(); clearUI();
    var realFb=window.fbSyncShared;
    var fbCalled=false, wgCalled=false;
    var realWg=window.pushWidgetData;
    window.fbSyncShared=function(){fbCalled=true;throw new Error('oda senkronizasyonu patladi')};
    window.pushWidgetData=function(){wgCalled=true};
    var r1=sv();
    res.push({t:'ASIL HATA: Firebase patlayinca depolama mesaji cikmaz', beklenen:'', cikan:toastTxt()});
    res.push({t:'Firebase patlayinca kaydetme basarili sayilir', beklenen:true, cikan:r1});
    res.push({t:'Firebase patlayinca uyari seridi cikmaz', beklenen:'', cikan:bannerTxt()});

    // --- 2. Biri patlayinca digeri calismali ---
    clearUI(); fbCalled=false; wgCalled=false;
    window.pushWidgetData=function(){wgCalled=true;throw new Error('widget koprusu patladi')};
    sv();
    res.push({t:'Widget patlasa da Firebase denenir', beklenen:true, cikan:fbCalled});
    res.push({t:'Widget patlayinca depolama mesaji cikmaz', beklenen:'', cikan:toastTxt()});
    window.fbSyncShared=realFb; window.pushWidgetData=realWg;

    // --- 3. Gercek kota hatasi: dogru mesaj + serit ---
    restore(); clearUI();
    stubSet(function(k,v){if(k==='__halka_probe')return;throw quotaErr()});
    var r3=sv();
    res.push({t:'Kota hatasi: dogru toast', beklenen:true, cikan:/Depolama dolu/.test(toastTxt())});
    res.push({t:'Kota hatasi: sv() false doner', beklenen:false, cikan:r3});
    res.push({t:'Kota hatasi: kalici serit cikar', beklenen:true, cikan:/Depolama dolu/.test(bannerTxt())});
    res.push({t:'Kota hatasi: seritte "Yer ac" eylemi var', beklenen:true, cikan:/Yer aç/.test(bannerTxt())});

    // --- 4. Toast spam yok ---
    document.getElementById('sToast').textContent='';
    sv(); sv(); sv();
    res.push({t:'Ard arda hatada toast tekrarlanmaz', beklenen:'', cikan:toastTxt()});
    res.push({t:'Serit ekranda kalir', beklenen:true, cikan:/Depolama dolu/.test(bannerTxt())});

    // --- 5. Duzelince serit temizlenir ---
    restore(); clearUI(); _saveErr='full'; checkStorageUsage();
    var vardi=/Depolama dolu/.test(bannerTxt());
    sv();
    res.push({t:'Once serit vardi', beklenen:true, cikan:vardi});
    res.push({t:'Basarili kayittan sonra serit temizlenir', beklenen:'', cikan:bannerTxt()});
    res.push({t:'Basarili kayitta _saveErr sifirlanir', beklenen:null, cikan:_saveErr});

    // --- 6. Depolama engelli (gizli sekme gibi) ---
    restore(); clearUI();
    stubGet(function(){throw new Error('erisim engellendi')});
    stubSet(function(){throw new Error('erisim engellendi')});
    sv();
    res.push({t:'Engelli depolama: "dolu" demez', beklenen:false, cikan:/dolu/.test(toastTxt())});
    res.push({t:'Engelli depolama: dogru toast', beklenen:true, cikan:/engelliyor/.test(toastTxt())});
    res.push({t:'Engelli depolama: dogru serit', beklenen:true, cikan:/kaybolur/.test(bannerTxt())});

    // --- 7. Hic kayit yokken cok buyuk veri -> "dolu" ---
    restore(); clearUI();
    stubGet(function(k){return null});
    stubSet(function(k,v){if(k==='__halka_probe')return;throw quotaErr()});
    sv();
    res.push({t:'Kayit yok ama minik yazma gecerse "dolu"', beklenen:true, cikan:/Depolama dolu/.test(toastTxt())});

    // --- 8. REGRESYON: normal kayit ---
    restore(); clearUI();
    var r8=sv();
    res.push({t:'REG normal kayit true doner', beklenen:true, cikan:r8});
    res.push({t:'REG normal kayitta mesaj yok', beklenen:'', cikan:toastTxt()});
    res.push({t:'REG normal kayitta serit yok', beklenen:'', cikan:bannerTxt()});
    res.push({t:'REG veri gercekten yazildi', beklenen:true, cikan:!!localStorage.getItem(SK)});

    // --- 9. REGRESYON: boyut uyarisi hala calisiyor ---
    restore(); clearUI();
    stubGet(function(k){return k===SK?new Array(4200*1024).join('x'):realGet.call(localStorage,k)});
    checkStorageUsage();
    res.push({t:'REG 4MB ustu boyut uyarisi cikar', beklenen:true, cikan:/dolmak üzere/.test(bannerTxt())});
    restore(); clearUI(); checkStorageUsage();
    res.push({t:'REG normal boyutta uyari yok', beklenen:'', cikan:bannerTxt()});
    return res;
  });
  const e = errs.join(' | ')||'(yok)';
  await b.close();
  return {out, errs:e};
};
(async()=>{
  const url = process.argv[2] || (process.env.HALKA_URL || 'file://'+require('path').resolve(__dirname,'..','index.html'));
  const {out,errs} = await run(url);
  let fail=0;
  for(const r of out){const ok=String(r.beklenen)===String(r.cikan); if(!ok)fail++;
    console.log((ok?'GECTI ':'KALDI ')+r.t+'  beklenen="'+r.beklenen+'" cikan="'+r.cikan+'"');}
  console.log('\nSonuc: '+(out.length-fail)+'/'+out.length+' gecti');
  console.log('Sayfa hatasi:', errs);
  process.exit(fail?1:0);
})();
