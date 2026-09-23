// Android hatirlaticilari (HalkaBridge). Sahte kopru her cagriyi kaydeder;
// kayit sessionStorage'da tutulur ki sayfa yenilenince (acilis) de gorulsun.
// Iki kopru denenir: yeni (scheduleReminderDays var) ve eski (yalniz scheduleReminder).
const path=require('path');

function bridgeScript(yeni){
  return `(()=>{var K='__kopru';var log=JSON.parse(sessionStorage.getItem(K)||'[]');
    function kaydet(ad,args){log.push({ad:ad,args:[].slice.call(args)});sessionStorage.setItem(K,JSON.stringify(log))}
    window.__kopru=function(){return JSON.parse(sessionStorage.getItem(K)||'[]')};
    window.__kopruSifirla=function(){log=[];sessionStorage.setItem(K,'[]')};
    var b={scheduleReminder:function(){kaydet('scheduleReminder',arguments)},
      cancelReminder:function(){kaydet('cancelReminder',arguments)},
      requestNotificationPermission:function(){kaydet('izin',arguments)},
      testNotification:function(){},updateWidget:function(){},getStatusBarHeight:function(){return 0}};
    if(${yeni})b.scheduleReminderDays=function(){kaydet('scheduleReminderDays',arguments)};
    window.HalkaBridge=b;})();`;
}
function hb(id,ad,o){return Object.assign({id:id,name:ad,type:'gain',targetDays:30,color:'#8ee4c8',
  createdAt:'2026-09-20',days:{},round:1,history:[],notes:{},paused:false,archived:false},o||{})}

const run = async (url) => {
  const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
  const b = await chromium.launch();
  const res=[]; const add=(t,beklenen,cikan)=>res.push({t,beklenen,cikan});
  const errs=[];

  async function sayfa(yeni, habits){
    const ctx=await b.newContext({viewport:{width:390,height:844}});
    const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message));
    await p.route('**/fonts.googleapis.com/**', r=>r.abort());
    await p.addInitScript(bridgeScript(yeni));
    await p.goto(url); await p.waitForTimeout(1500);
    await p.evaluate(h=>{S.ob=true;S.user={name:'Y'};S.habits=h;sv();__kopruSifirla()}, habits);
    await p.reload(); await p.waitForTimeout(1500);   // "acilis"
    return {p,ctx};
  }
  // Son kayittan bu yana yapilan cagrilar, okunur bicimde: "ad(id,...)"
  const cagrilar = p => p.evaluate(()=>__kopru().map(c=>c.ad+'('+c.args.map(a=>typeof a==='string'?a:JSON.stringify(a)).join('|')+')'));
  const sifirla = p => p.evaluate(()=>__kopruSifirla());
  const sadece = (arr,ad)=>arr.filter(c=>c.startsWith(ad+'('));
  const idOf = c => c.slice(c.indexOf('(')+1,-1).split('|')[0];
  const gunler = (arr,id)=>{const c=arr.find(x=>x.startsWith('scheduleReminderDays('+id+'|'));return c?c.slice(0,-1).split('|')[4]:'(kurulmadi)'};

  // ===== YENI KOPRU =====
  var S0=[hb('aktif','Spor',{reminder:'09:00'}),
          hb('arsiv','Eski',{reminder:'10:00',archived:true}),
          hb('durak','Su',{reminder:'11:00',paused:true,pausedAt:'2026-09-21'}),
          hb('hafta','Kitap',{reminder:'20:00',schedule:'weekdays'}),
          hb('ozel','Yuzme',{reminder:'07:30',schedule:[0,2,4]}),
          hb('yok','Hatirlaticisiz')];
  var {p,ctx}=await sayfa(true, S0);
  var c=await cagrilar(p);
  var kur=sadece(c,'scheduleReminderDays').concat(sadece(c,'scheduleReminder')).map(idOf).sort().join(',');
  add('ASIL HATA: acilista yalniz aktif hatirlaticilar kurulur', 'aktif,hafta,ozel', kur);
  add('ASIL HATA: arsivli ve duraklatilmisin eski alarmi iptal edilir', 'arsiv,durak', sadece(c,'cancelReminder').map(idOf).sort().join(','));
  add('Hatirlaticisiz aliskanliga dokunulmaz', 0, c.filter(x=>idOf(x)==='yok').length);
  add('Acilista izin istenmez (her aliskanlik icin bir kez isteniyordu)', 0, sadece(c,'izin').length);
  add('PROGRAM: her gun -> 1..7', '[1,2,3,4,5,6,7]', gunler(c,'aktif'));
  add('PROGRAM: hafta ici -> Pzt..Cum (1..5)', '[1,2,3,4,5]', gunler(c,'hafta'));
  add('PROGRAM: ozel [Pt,Ca,Cu] -> [1,3,5]', '[1,3,5]', gunler(c,'ozel'));
  add('Mesaj ve saat iletilir', 'scheduleReminderDays(aktif|Spor|09:00|Bugün Spor hedefini tamamlamayı unutma!|[1,2,3,4,5,6,7])',
      c.find(x=>x.startsWith('scheduleReminderDays(aktif|'))||'(yok)');

  // Duraklat / devam
  await sifirla(p); await p.evaluate(()=>{openDet('aktif');pauseH('aktif')});
  add('DURAKLAT: alarm iptal edilir', 'cancelReminder(aktif)', (await cagrilar(p)).join(' '));
  await sifirla(p); await p.evaluate(()=>resumeH('aktif'));
  add('DEVAM: alarm yeniden kurulur', 'aktif', sadece(await cagrilar(p),'scheduleReminderDays').map(idOf).join(','));
  add('DEVAM: kullaniciya "Bildirim hatasi" cikmaz', false, await p.evaluate(()=>/hata/i.test(document.getElementById('sToast').textContent)));

  // Arsivden geri al
  await sifirla(p); await p.evaluate(()=>unarchiveH('arsiv'));
  add('ARSIVDEN CIKAR: alarm yeniden kurulur', 'arsiv', sadece(await cagrilar(p),'scheduleReminderDays').map(idOf).join(','));
  // Arsivle
  await sifirla(p); await p.evaluate(()=>{window.confirm=()=>true;archiveH('arsiv')});
  add('ARSIVLE: alarm iptal edilir', 'cancelReminder(arsiv)', (await cagrilar(p)).join(' '));

  // Program degisir -> yeni gunlerle yeniden kurulur
  await sifirla(p); await p.evaluate(()=>{openDet('aktif');edSch('aktif','weekdays')});
  add('PROGRAM DEGISTI: yeni gunlerle kurulur', '[1,2,3,4,5]', gunler(await cagrilar(p),'aktif'));
  await sifirla(p); await p.evaluate(()=>{edSch('aktif','custom');});
  await sifirla(p); await p.evaluate(()=>{edSchDay('aktif',6)});
  add('OZEL GUN EKLENDI: Pazar da gonderilir', '[1,2,3,4,5,7]', gunler(await cagrilar(p),'aktif'));
  // Ad degisir -> bildirim metni guncellenir
  await sifirla(p); await p.evaluate(()=>{document.getElementById('edName').value='Kosu';edSaveName('aktif')});
  add('AD DEGISTI: yeni adla kurulur', 'Kosu', (sadece(await cagrilar(p),'scheduleReminderDays')[0]||'||').split('|')[1]);
  // Tur degisir -> bildirim metni guncellenir
  await sifirla(p); await p.evaluate(()=>edType('aktif'));
  add('TUR DEGISTI: "temiz kal" metniyle kurulur', true, /temiz kalmay/.test(sadece(await cagrilar(p),'scheduleReminderDays')[0]||''));

  // Kullanici hatirlatici kurar -> izin istenir
  await sifirla(p); await p.evaluate(()=>{openDet('yok');document.getElementById('edRemTime').value='08:15';edReminder('yok')});
  var c2=await cagrilar(p);
  add('KULLANICI KURAR: izin istenir', 1, sadece(c2,'izin').length);
  add('KULLANICI KURAR: alarm kurulur', 'yok', sadece(c2,'scheduleReminderDays').map(idOf).join(','));
  // Duraklatilmis aliskanliga saat kurulursa alarm kurulmaz
  await sifirla(p); await p.evaluate(()=>{openDet('durak');document.getElementById('edRemTime').value='08:15';edReminder('durak')});
  add('DURAKLATILMISA SAAT KURULUR: alarm kurulmaz', '', sadece(await cagrilar(p),'scheduleReminderDays').map(idOf).join(','));

  // Yedekten "uzerine yaz": eski aliskanliklarin alarmi kalmamali
  await sifirla(p);
  const fs=require('fs'),os=require('os');
  const f=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'halka-rem-')),'y.json');
  fs.writeFileSync(f,JSON.stringify({v:3,ob:true,user:{name:'Y'},habits:[hb('yeni1','Yeni',{reminder:'06:00'})]}));
  p.on('dialog',d=>d.accept());   // 1. "Devam?" evet, 2. "Uzerine yaz?" evet
  const [fc]=await Promise.all([p.waitForEvent('filechooser'),p.evaluate(()=>impD())]);
  await Promise.all([p.waitForNavigation(),fc.setFiles(f)]); await p.waitForTimeout(1500);
  var c3=await cagrilar(p);
  add('YEDEK UZERINE YAZ: eski alarmlar iptal edilir', true, ['hafta','ozel','yok'].every(id=>sadece(c3,'cancelReminder').map(idOf).includes(id)));
  add('YEDEK UZERINE YAZ: yenisi kurulur', true, sadece(c3,'scheduleReminderDays').map(idOf).includes('yeni1'));

  // REGRESYON: silme ve hatirlatici kaldirma iptal eder
  await p.evaluate(()=>{S.habits.push({id:'sil',name:'Sil',type:'gain',targetDays:30,color:CL[0],createdAt:td(),days:{},round:1,history:[],notes:{},reminder:'05:00'});sv()});
  await sifirla(p); await p.evaluate(()=>{window.confirm=()=>true;dI='sil';delC()});
  add('REG silince iptal', true, sadece(await cagrilar(p),'cancelReminder').map(idOf).includes('sil'));
  await sifirla(p); await p.evaluate(()=>{openDet('yeni1');delReminder('yeni1')});
  add('REG hatirlatici kaldirilinca iptal', 'cancelReminder(yeni1)', (await cagrilar(p)).join(' '));
  await ctx.close();

  // ===== ESKI KOPRU (yalniz 4 argumanli scheduleReminder) =====
  // Java'daki @JavascriptInterface metodu arguman sayisiyla eslesir; 5 argumanla
  // cagirmak "metot yok" hatasi verir. Eski kopru 4 argumanla cagrilmali.
  var o=await sayfa(false, [hb('aktif','Spor',{reminder:'09:00',schedule:'weekdays'}), hb('arsiv','Eski',{reminder:'10:00',archived:true})]);
  var c4=await o.p.evaluate(()=>__kopru());
  var sr=c4.filter(x=>x.ad==='scheduleReminder');
  add('ESKI KOPRU: yalniz aktif kurulur', 'aktif', sr.map(x=>x.args[0]).join(','));
  add('ESKI KOPRU: 4 argumanla cagrilir', 4, sr.length?sr[0].args.length:0);
  add('ESKI KOPRU: arsivlinin alarmi iptal edilir', 'arsiv', c4.filter(x=>x.ad==='cancelReminder').map(x=>x.args[0]).join(','));
  await o.ctx.close();

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
