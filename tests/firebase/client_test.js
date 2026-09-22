const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const NS='halka-d6595-default-rtdb', BASE='http://127.0.0.1:9000';

// Sayfa icine enjekte edilecek: fbDB'yi emulator'un REST ucuna baglayan vekil.
const STUB = (a) => { var ns=a.ns, base=a.base;
  window.__asUser=function(uid){
    var A=encodeURIComponent(JSON.stringify({uid:uid}));
    function u(p){return base+'/'+p+'.json?ns='+ns+'&auth_variable_override='+A}
    function call(method,p,body){
      return fetch(u(p),{method:method,headers:{'Content-Type':'application/json','Authorization':'Bearer owner'},
        body:body===undefined?undefined:JSON.stringify(body)})
        .then(function(r){
          if(r.status>=400)return r.text().then(function(t){
            var e=new Error(r.status===401||r.status===403?'PERMISSION_DENIED':('HTTP '+r.status));
            e.status=r.status; throw e;});
          return r.text().then(function(t){return t?JSON.parse(t):null});
        });
    }
    function ref(p){
      p=String(p).replace(/^\/+|\/+$/g,'');
      return {
        set:function(v){return call('PUT',p,v)},
        update:function(v){return call('PATCH',p,v)},
        remove:function(){return call('DELETE',p)},
        once:function(){return call('GET',p).then(function(v){return{val:function(){return v}}})},
        on:function(ev,cb){call('GET',p).then(function(v){cb({val:function(){return v}})}).catch(function(){});return cb},
        off:function(){}
      };
    }
    window.fbDB={ref:ref};
    window.fbUser={uid:uid};
    window.fbConnected=true;
    return uid;
  };
};

const sleep=ms=>new Promise(r=>setTimeout(r,ms));

(async()=>{
  const b=await chromium.launch();
  const ctx=await b.newContext({viewport:{width:390,height:844}});
  const p=await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.route('**/fonts.googleapis.com/**', r=>r.abort());
  await p.goto((process.env.HALKA_URL || 'file://'+require('path').resolve(__dirname,'..','..','index.html'))); await p.waitForTimeout(7000);
  await p.click('text=Başlayalım'); await p.waitForTimeout(400);
  await p.fill('#inpName','Yusuf'); await p.click('text=Devam'); await p.waitForTimeout(400);
  await p.click('text=Alışkanlık Seç'); await p.waitForTimeout(300);
  await p.click('text=Spor'); await p.waitForTimeout(200);
  await p.click('#stBtn'); await p.waitForTimeout(1200);
  await p.evaluate(STUB, {ns:NS, base:BASE});

  const res=[];
  const add=(t,b_,c)=>res.push({t,beklenen:b_,cikan:c});
  const toast=()=>p.evaluate(()=>document.getElementById('sToast').textContent);
  const clearToast=()=>p.evaluate(()=>{document.getElementById('sToast').textContent=''});

  // CORS calisiyor mu?
  const ping=await p.evaluate(async()=>{
    try{ __asUser('ping'); await fbDB.ref('codes/__yok__').once('value'); return 'ok' }
    catch(e){ return 'HATA: '+e.message }
  });
  if(ping!=='ok'){ console.log('Emulator\'a sayfadan ulasilamiyor:',ping); await b.close(); process.exit(2); }

  // --- 1. u1 oda kurar ---
  await clearToast();
  await p.evaluate(()=>{__asUser('u1'); delete S.roomId; delete S.roomCode; delete S.roomType; createRoom('family')});
  await sleep(1500);
  const st1=await p.evaluate(()=>({id:S.roomId||'',code:S.roomCode||'',type:S.roomType||''}));
  add('Oda kuruldu (roomId atandi)', true, !!st1.id);
  add('Oda kodu atandi (6 hane)', true, /^[A-Z0-9]{6}$/.test(st1.code));
  add('Oda kurulurken hata mesaji yok', true, !/olusturulamadi|Hata/.test(await toast()));

  // kod ve oda gercekten yazilmis mi (yonetici gozuyle)
  const stored=await p.evaluate(async()=>{
    __asUser('u1');
    var c=await fbDB.ref('codes/'+S.roomCode).once('value');
    var r=await fbDB.ref('rooms/'+S.roomId).once('value');
    return {code:c.val(), room:r.val()};
  });
  add('codes kaydi odayi gosteriyor', st1.id, stored.code&&stored.code.roomId);
  add('Oda sahibi uye olarak kayitli', true, !!(stored.room&&stored.room.members&&stored.room.members.u1));

  // --- 2. u1 paylasim yazar (fbSyncShared) ---
  await clearToast();
  const syncOk=await p.evaluate(async()=>{
    __asUser('u1'); S.sharedHabits=[S.habits[0].id];
    try{ fbSyncShared(); await new Promise(r=>setTimeout(r,600));
         var s=await fbDB.ref('shared/'+S.roomId+'/u1/summary').once('value');
         return !!s.val(); }catch(e){ return 'HATA '+e.message }
  });
  add('Sahibi paylasimlarini yazabiliyor', true, syncOk);

  // --- 3. u2 dogru kodla katilir ---
  await clearToast();
  const roomCode=st1.code;
  await p.evaluate(async(code)=>{
    __asUser('u2'); delete S.roomId; delete S.roomCode; delete S.roomType;
    joinRoom(code);
  }, roomCode);
  await sleep(1800);
  const st2=await p.evaluate(()=>({id:S.roomId||'',msg:document.getElementById('sToast').textContent}));
  add('u2 dogru kodla katildi', st1.id, st2.id);
  add('u2 katilma mesaji dogru', true, /katıldın/.test(st2.msg));

  // --- 4. u3 yanlis kodla katilamaz ---
  await clearToast();
  await p.evaluate(async(code)=>{
    __asUser('u3'); delete S.roomId; delete S.roomCode; delete S.roomType;
    // kodu dogru okuyor ama uye kaydina yanlis kod yaziyor gibi davranalim:
    // gercekte kural, kodu bilmeyenin yazmasini engelliyor
    var snap=await fbDB.ref('codes/'+code).once('value');
    var d=snap.val();
    try{ await fbDB.ref('rooms/'+d.roomId+'/members/u3').set({name:'Davetsiz',joinedAt:'2026-09-21',role:'member',code:'YANLIS'});
         window.__r4='izin'; }catch(e){ window.__r4='RED'; }
  }, roomCode);
  await sleep(800);
  add('Yanlis kodla uye olunamiyor', 'RED', await p.evaluate(()=>window.__r4));

  // --- 5. u3 odayi okuyamiyor ---
  const r5=await p.evaluate(async(id)=>{
    __asUser('u3');
    try{ var s=await fbDB.ref('shared/'+id).once('value'); return 'izin' }catch(e){ return 'RED' }
  }, st1.id);
  add('Uye olmayan paylasimlari okuyamiyor', 'RED', r5);

  // --- 6. Cift odasinda kapasite: 3. kisi geri cikarilir ---
  await clearToast();
  const cplCode=await p.evaluate(async()=>{
    __asUser('c1'); delete S.roomId; delete S.roomCode; delete S.roomType;
    createRoom('couple'); await new Promise(r=>setTimeout(r,1200));
    return S.roomCode;
  });
  await p.evaluate(async(code)=>{ __asUser('c2'); delete S.roomId; joinRoom(code); }, cplCode);
  await sleep(1500);
  await clearToast();
  await p.evaluate(async(code)=>{ __asUser('c3'); delete S.roomId; joinRoom(code); }, cplCode);
  await sleep(2000);
  const st6=await p.evaluate(()=>({id:S.roomId||'',msg:document.getElementById('sToast').textContent}));
  add('Dolu cift odasina 3. kisi giremiyor', '', st6.id);
  add('Dolu oda mesaji cikiyor', true, /dolu/.test(st6.msg));
  const left=await p.evaluate(async(code)=>{
    __asUser('c1');
    var s=await fbDB.ref('codes/'+code).once('value');
    var m=await fbDB.ref('rooms/'+s.val().roomId+'/members').once('value');
    return Object.keys(m.val()||{}).length;
  }, cplCode);
  add('3. kisi odadan geri cikarildi (2 uye kaldi)', 2, left);

  // --- 7. Var olmayan kod ---
  await clearToast();
  await p.evaluate(()=>{__asUser('u9'); delete S.roomId; joinRoom('ZZZZZZ')});
  await sleep(1000);
  add('Var olmayan kod icin dogru mesaj', true, /bulunamadı/.test(await toast()));

  let fail=0;
  for(const r of res){const ok=String(r.beklenen)===String(r.cikan); if(!ok)fail++;
    console.log((ok?'GECTI ':'KALDI ')+r.t+'  beklenen='+r.beklenen+' cikan='+r.cikan)}
  console.log('\nSonuc: '+(res.length-fail)+'/'+res.length+' gecti');
  console.log('Sayfa hatasi:', errs.join(' | ')||'(yok)');
  await b.close();
  process.exit(fail?1:0);
})();
