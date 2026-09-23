// Android koprusu (HalkaBridge) ile JS arasi sozlesme:
//  - Yedek disa aktarma: WebView blob: indirmez. Kopruda saveFile varsa dosya onunla yazilir
//    (ad, icerik); donus "yer" -> "Yedek kaydedildi: yer", "" -> "Yedek kaydedilemedi",
//    "bekle" -> kullanici konum seciyor, mesaj Android'den gelir. Kopru yoksa eski blob yolu.
//  - Servis calisani: Android uygulamasinda (kopru varken) kaydedilmez; tarayicida (REG) edilir.
// Servis calisani yalniz http(s) altinda kaydoldugu icin test kendi yerel sunucusunu acar.
const path=require('path'), http=require('http'), fs=require('fs');

const run = async () => {
  const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
  const kok=path.resolve(__dirname,'..');
  // Istege bagli arguman: baska bir index.html (eski surumu sinamak icin); fonts/ vb. depodan
  const ozel=process.argv.slice(2).find(a=>/\.html$/.test(a)&&!/^(file|https?):/.test(a));
  const sunucu=http.createServer((q,s)=>{var yol=decodeURIComponent(q.url.split('?')[0]);var f=(ozel&&yol==='/index.html')?path.resolve(ozel):path.join(kok,yol);if(f.endsWith('/'))f+='index.html';
    fs.readFile(f,(e,d)=>{if(e){s.writeHead(404);s.end();return}s.writeHead(200,{'Content-Type':f.endsWith('.html')?'text/html':f.endsWith('.js')?'text/javascript':'application/octet-stream'});s.end(d)})});
  await new Promise(r=>sunucu.listen(0,'127.0.0.1',r));
  const url='http://127.0.0.1:'+sunucu.address().port+'/index.html';
  const b = await chromium.launch();
  const res=[]; const add=(t,beklenen,cikan)=>res.push({t,beklenen,cikan});
  const errs=[];
  // kopru: null = kopru yok; {} = saveFile'siz kopru; {donus:'...'} = saveFile bu degeri dondurur
  async function ac(kopru){
    const ctx=await b.newContext({viewport:{width:360,height:800},serviceWorkers:'allow'});
    const p=await ctx.newPage();
    p.on('pageerror',e=>errs.push(e.message));
    await p.route('**/fonts.googleapis.com/**', r=>r.abort());
    await p.route(/gstatic|jsdelivr/, r=>r.abort());
    await p.clock.setFixedTime(new Date('2026-09-23T10:00:00'));
    await p.addInitScript(k=>{
      window.__sw=0;window.__a=0;window.__kayit=[];
      if(navigator.serviceWorker)navigator.serviceWorker.register=function(){window.__sw++;return Promise.resolve({})};
      var eski=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(this.download)window.__a++;else eski.call(this)};
      if(k){window.HalkaBridge={getStatusBarHeight:function(){return 0},updateWidget:function(){}};
        if('donus' in k)window.HalkaBridge.saveFile=function(ad,icerik){window.__kayit.push([ad,icerik]);return k.donus}}
    },kopru);
    await p.goto(url); await p.waitForTimeout(900);
    await p.evaluate(()=>{S.ob=true;S.user={name:'Y'};S.milestones={};S.partnerData={x:1};
      S.habits=[{id:'a',name:'Spor',type:'gain',targetDays:21,color:CL[0],createdAt:td(),days:{},round:1,history:[],notes:{}}];sv()});
    await p.reload(); await p.waitForTimeout(900);
    return {p,ctx};
  }
  const disa=p=>p.evaluate(async()=>{expD();await new Promise(r=>setTimeout(r,300));
    var k=window.__kayit[0];var veri=null;try{veri=k?JSON.parse(k[1]):null}catch(e){}
    return {kayit:window.__kayit.length, ad:k?k[0]:'', gecerli:!!veri&&Array.isArray(veri.habits)&&veri.habits.length===1&&!('partnerData' in veri),
      indir:window.__a, toast:document.getElementById('sToast').textContent}});

  {
    const {p,ctx}=await ac({donus:'İndirilenler/Halka/halka_yedek_20260923.json'});
    const r=await disa(p);
    add('SAVEFILE: kopruyle bir kez yazilir', 1, r.kayit);
    add('SAVEFILE: dosya adi', 'halka_yedek_20260923.json', r.ad);
    add('SAVEFILE: icerik gecerli yedek (partnerData yok)', true, r.gecerli);
    add('SAVEFILE: blob indirme denenmez', 0, r.indir);
    add('SAVEFILE: yer bildirilir', 'Yedek kaydedildi: İndirilenler/Halka/halka_yedek_20260923.json', r.toast);
    add('SERVIS CALISANI: kopru varken kaydedilmez', 0, await p.evaluate(()=>window.__sw));
    await ctx.close();
  }
  {
    const {p,ctx}=await ac({donus:''});
    add('SAVEFILE hata: kullaniciya soylenir', 'Yedek kaydedilemedi', (await disa(p)).toast);
    await ctx.close();
  }
  {
    const {p,ctx}=await ac({donus:'bekle'});
    const r=await disa(p);
    add('SAVEFILE bekle: basari iddia edilmez, blob yok', 'false|0', /kaydedildi|indirildi/.test(r.toast)+'|'+r.indir);
    await ctx.close();
  }
  {
    const {p,ctx}=await ac({});
    add('REG saveFile\'siz kopru: blob yolu', 1, (await disa(p)).indir);
    await ctx.close();
  }
  {
    const {p,ctx}=await ac(null);
    add('REG tarayici: blob yolu', 1, (await disa(p)).indir);
    add('REG tarayici: servis calisani kaydedilir', 1, await p.evaluate(()=>window.__sw));
    await ctx.close();
  }
  await b.close(); sunucu.close();
  return {out:res, errs:errs.join(' | ')||'(yok)'};
};
(async()=>{
  const {out,errs} = await run();
  let fail=0;
  for(const r of out){const ok=String(r.beklenen)===String(r.cikan); if(!ok)fail++;
    console.log((ok?'GECTI ':'KALDI ')+r.t+'  beklenen="'+r.beklenen+'" cikan="'+r.cikan+'"');}
  console.log('\nSonuc: '+(out.length-fail)+'/'+out.length+' gecti');
  console.log('Sayfa hatasi:', errs);
  process.exit(fail?1:0);
})();
