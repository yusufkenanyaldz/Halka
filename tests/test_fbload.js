// Firebase kutuphanesinin yarim yuklenmesi. Gercek CDN'lere gidilmez: her modul
// (app / auth / database) iki CDN'de de p.route ile taklit edilir; her senaryo
// hangi dosyanin inecegini, inmeyecegini ya da asili kalacagini secer.
const FAKE = {
  app: "window.__appLoads=(window.__appLoads||0)+1;window.firebase={initializeApp:function(){window.__initCalls=(window.__initCalls||0)+1;return{}}};",
  auth: "if(!window.firebase)throw new Error('firebase tanimsiz');firebase.auth=function(){return{signInAnonymously:function(){return Promise.resolve({user:{uid:'u-sahte'}})},onAuthStateChanged:function(){},useDeviceLanguage:function(){}}};",
  database: "if(!window.firebase)throw new Error('firebase tanimsiz');firebase.database=function(){var r={set:function(){return Promise.resolve()},update:function(){return Promise.resolve()},remove:function(){return Promise.resolve()},once:function(){return Promise.resolve({val:function(){return null}})},on:function(){},off:function(){}};return{ref:function(){return r}}};firebase.database.enableLogging=function(){};"
};
// Anonim giris konsolda kapaliysa SDK iner ama giris reddedilir.
FAKE.authReject = FAKE.auth.replace("Promise.resolve({user:{uid:'u-sahte'}})","Promise.reject(new Error('auth/admin-restricted-operation'))");
function modOf(url){return /app-compat/.test(url)?'app':/auth-compat/.test(url)?'auth':/database-compat/.test(url)?'database':null}

const run = async (url) => {
  const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
  const b = await chromium.launch();
  const res=[];
  const add=(t,beklenen,cikan)=>res.push({t,beklenen,cikan});

  // plan: {gs:{app,auth,database}, jd:{...}} -> 'ok' | 'fail' | 'hang'. Eksik = 'ok'.
  async function scenario(plan, opts){
    opts=opts||{};
    const ctx = await b.newContext({ viewport:{width:390,height:844} });
    const p = await ctx.newPage();
    const errs=[]; p.on('pageerror',e=>errs.push(e.message));
    if(opts.offline)await p.addInitScript(()=>{Object.defineProperty(Navigator.prototype,'onLine',{get:()=>false})});
    await p.route('**/fonts.googleapis.com/**', r=>r.abort());
    const hung=[];
    const handler = cdn => route => {
      const m=modOf(route.request().url()), st=(plan[cdn]||{})[m]||'ok';
      if(st==='fail')return route.fulfill({status:404,body:'yok'});
      if(st==='hang'){hung.push({route,m});return}
      const body=(m==='auth'&&opts.authReject)?FAKE.authReject:FAKE[m];
      return route.fulfill({status:200,contentType:'application/javascript',body});
    };
    await p.route('**/www.gstatic.com/firebasejs/**', handler('gs'));
    await p.route('**/cdn.jsdelivr.net/npm/firebase@**', handler('jd'));
    await p.goto(url,{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(opts.wait||1500);
    const st = await p.evaluate(()=>({done:_fbDone, conn:fbConnected, uid:fbUser?fbUser.uid:'',
      appLoads:window.__appLoads||0}));
    st.errs=errs.slice();
    st.page=p; st.ctx=ctx; st.hung=hung;
    return st;
  }
  async function joinMsg(p){
    return p.evaluate(()=>{document.getElementById('sToast').textContent='';joinRoom('ABC234');
      return document.getElementById('sToast').textContent});
  }
  async function obJoinMsg(p){
    await p.evaluate(()=>{document.getElementById('sToast').textContent='';
      document.getElementById('ob3JoinInp').value='ABC234';ob3DoJoin()});
    await p.waitForTimeout(500);
    return p.evaluate(()=>document.getElementById('sToast').textContent);
  }
  const NET='İnternet bağlantısı gerekli';
  const noNetMsg=m=>m!==''&&m!==NET;

  // --- 1. ASIL HATA: ana kutuphane iner, alt moduller hicbir yerden inmez ---
  var s1 = await scenario({gs:{auth:'fail',database:'fail'}, jd:{app:'fail',auth:'fail',database:'fail'}});
  add('ASIL HATA: yukleme bitti sayilir (_fbDone)', true, s1.done);
  add('ASIL HATA: sayfa hatasi yok', '', s1.errs.join(' | '));
  add('ASIL HATA: oda katilimi askida kalmaz, mesaj verir', true, (await obJoinMsg(s1.page))!=='');
  var m1=await joinMsg(s1.page);
  add('ASIL HATA: "internet gerekli" demez, dogru sebep soylenir', true, noNetMsg(m1));
  await s1.ctx.close();

  // --- 2. Yalniz veritabani modulu inmez ---
  var s2 = await scenario({gs:{database:'fail'}, jd:{app:'fail',auth:'fail',database:'fail'}});
  add('Yalniz db inmez: yukleme bitti sayilir', true, s2.done);
  add('Yalniz db inmez: sayfa hatasi yok', '', s2.errs.join(' | '));
  add('Yalniz db inmez: dogru sebep soylenir', true, noNetMsg(await joinMsg(s2.page)));
  await s2.ctx.close();

  // --- 3. Modul modul yedek CDN: her dosya en az bir yerde var ---
  // gstatic'te auth, jsdelivr'da app engelli (orn. bir icerik engelleyici)
  var s3 = await scenario({gs:{auth:'fail'}, jd:{app:'fail'}});
  add('Modul bazli yedek: baglanir', true, s3.conn);
  add('Modul bazli yedek: sayfa hatasi yok', '', s3.errs.join(' | '));
  await s3.ctx.close();

  // --- 4. Zaman asimi: alt modul asili kalir, sonra iner ---
  var s4 = await scenario({gs:{auth:'hang'}}, {wait:7000});
  add('Zaman asimi: yukleme bitti sayilir', true, s4.done);
  add('Zaman asimi: sayfa hatasi yok', '', s4.errs.join(' | '));
  add('Zaman asimi: henuz bagli degil', false, s4.conn);
  // asili dosya gec de olsa iner -> uygulama kendiliginden baglanir
  for(const h of s4.hung)await h.route.fulfill({status:200,contentType:'application/javascript',body:FAKE[h.m]});
  await s4.page.waitForTimeout(1000);
  add('Gec inen modulle kendiliginden baglanir', true, await s4.page.evaluate(()=>fbConnected));
  add('Gec baglanista sayfa hatasi yok', '', s4.errs.join(' | '));
  await s4.ctx.close();

  // --- 5. Hic inmez + cihaz gercekten cevrimdisi -> "internet gerekli" dogru mesaj ---
  var all={app:'fail',auth:'fail',database:'fail'};
  var s5 = await scenario({gs:all, jd:all}, {offline:true});
  add('Cevrimdisi: yukleme bitti sayilir', true, s5.done);
  add('Cevrimdisi: "internet gerekli" der', NET, await joinMsg(s5.page));
  await s5.ctx.close();

  // --- 6. Hic inmez ama cihaz cevrimici (CDN engelli) -> internet demez ---
  var s6 = await scenario({gs:all, jd:all});
  add('CDN engelli: yukleme bitti sayilir', true, s6.done);
  add('CDN engelli: "internet gerekli" demez', true, noNetMsg(await joinMsg(s6.page)));
  await s6.ctx.close();

  // --- 7. SDK tam iner ama anonim giris reddedilir ---
  var s9 = await scenario({}, {authReject:true});
  add('Giris reddi: sayfa hatasi yok', '', s9.errs.join(' | '));
  add('Giris reddi: "internet gerekli" demez', true, noNetMsg(await joinMsg(s9.page)));
  await s9.ctx.close();

  // --- 8. REGRESYON ---
  var s7 = await scenario({});
  add('REG hepsi iner: baglanir', true, s7.conn);
  add('REG hepsi iner: kullanici kimligi', 'u-sahte', s7.uid);
  add('REG hepsi iner: ana kutuphane bir kez yuklenir', 1, s7.appLoads);
  add('REG hepsi iner: sayfa hatasi yok', '', s7.errs.join(' | '));
  await s7.ctx.close();
  var s8 = await scenario({gs:all});
  add('REG ilk CDN tamamen kapali: ikinciden baglanir', true, s8.conn);
  await s8.ctx.close();

  await b.close();
  return {out:res};
};
(async()=>{
  const url = process.argv[2] || (process.env.HALKA_URL || 'file://'+require('path').resolve(__dirname,'..','index.html'));
  const {out} = await run(url);
  let fail=0;
  for(const r of out){const ok=String(r.beklenen)===String(r.cikan); if(!ok)fail++;
    console.log((ok?'GECTI ':'KALDI ')+r.t+'  beklenen="'+r.beklenen+'" cikan="'+r.cikan+'"');}
  console.log('\nSonuc: '+(out.length-fail)+'/'+out.length+' gecti');
  console.log('Sayfa hatasi: (her senaryoda ayrica olculdu)');
  process.exit(fail?1:0);
})();
