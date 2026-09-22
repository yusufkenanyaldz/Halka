// Kurallar varsayilan ornegin ad alanina yukleniyor; baska bir ad kullanirsak
// emulator kuralsiz yeni bir ad alani acar ve testler sahte gecer.
const NS='halka-d6595-default-rtdb', BASE='http://127.0.0.1:9000';
const fs=require('fs');
// Emulator'de kimlik taklidi: 'Bearer owner' + auth_variable_override birlikte
// kullanilmali. Override tek basina gonderilirse istek kimliksiz sayilir ve her
// sey reddedilir, yani testler yanlis sebepten gecer.
// owner tek basina kurallari tamamen atlar; onu yalnizca kurulum verisinde kullaniyoruz.
const url=(path,uid)=>{
  const q=new URLSearchParams({ns:NS});
  q.set('auth_variable_override', uid===null?'null':JSON.stringify({uid}));
  return `${BASE}/${path}.json?${q}`;
};
async function req(method,path,uid,body){
  const r=await fetch(url(path,uid),{method,
    headers:{'Content-Type':'application/json','Authorization':'Bearer owner'},
    body:body===undefined?undefined:JSON.stringify(body)});
  return {ok:r.status>=200&&r.status<300, status:r.status};
}
const read=(p,u)=>req('GET',p,u), write=(p,u,b)=>req('PUT',p,u,b), del=(p,u)=>req('DELETE',p,u);

// Kurulum verisi: emulator'de 'Bearer owner' kurallari atlar, boylece
// kurallari gecici acip kapamaya gerek kalmiyor.
async function seed(path,value){
  const r=await fetch(`${BASE}/${path}.json?ns=${NS}`,{method:'PUT',
    headers:{'Authorization':'Bearer owner','Content-Type':'application/json'},
    body:JSON.stringify(value)});
  if(!r.ok)throw new Error('kurulum yazilamadi '+r.status);
}

const res=[];
const T=async(name,beklenen,fn)=>{let c;try{c=(await fn()).ok?'izin':'RED'}catch(e){c='HATA '+e.message}
  res.push({name,beklenen,cikan:c})};

(async()=>{
  const M=(n,code)=>{const o={name:n,avatar:'book',joinedAt:'2026-09-21',role:'member'};
                     if(code)o.code=code;return o};
  const ROOM={type:'family',code:'ABC123',createdAt:'2026-09-21',createdBy:'u1',
              members:{u1:{name:'Yusuf',avatar:'book',joinedAt:'2026-09-21',role:'owner'}}};

  // ===== UYGULAMANIN YAPTIGI ISLER — IZIN VERILMELI =====
  await T('u1 kendi profilini yazar (fbInit)','izin',()=>write('users/u1','u1',{name:'Yusuf',avatar:'book',lastSeen:'2026-09-21'}));
  await T('u1 bos kod var mi diye bakar (createRoom)','izin',()=>read('codes/ABC123','u1'));
  await T('u1 oda kurar (createRoom)','izin',()=>write('rooms/R1','u1',ROOM));
  await T('u1 oda kodunu kaydeder (createRoom)','izin',()=>write('codes/ABC123','u1',{roomId:'R1',type:'family',createdAt:'2026-09-21'}));
  await T('u2 kodu okur, uye degilken (joinRoom)','izin',()=>read('codes/ABC123','u2'));
  await T('u2 dogru kodla katilir (joinRoom)','izin',()=>write('rooms/R1/members/u2','u2',M('Ayse','ABC123')));
  await T('u1 paylasilan aliskanliklarini yazar','izin',()=>write('shared/R1/u1/habits','u1',{h1:{name:'Spor',pct:50}}));
  await T('u1 ozetini yazar','izin',()=>write('shared/R1/u1/summary','u1',{name:'Yusuf',done:1,total:2,lastSeen:'2026-09-21'}));
  await T('u2 odanin paylasimlarini dinler (startRoomListener)','izin',()=>read('shared/R1','u2'));
  await T('u1 odayi okur (uye)','izin',()=>read('rooms/R1','u1'));
  await T('u2 uye olarak kendi kaydini gunceller','izin',()=>write('rooms/R1/members/u2','u2',M('Ayse2')));
  await T('u2 kendi paylasimini siler (leaveRoom)','izin',()=>del('shared/R1/u2','u2'));
  await T('u2 kendi uyeligini siler (leaveRoom)','izin',()=>del('rooms/R1/members/u2','u2'));
  await T('u1 kendi odasinin kodunu degistirir (cakisma yeniden deneme)','izin',()=>write('rooms/R1/code','u1','NEW456'));
  await seed('rooms/R1/code','ABC123');

  // ===== IZIN VERILMEMELI =====
  await T('Giris yapmamis kisi kodu okur','RED',()=>read('codes/ABC123',null));
  await T('Giris yapmamis kisi paylasimlari okur','RED',()=>read('shared/R1',null));
  await T('Giris yapmamis kisi oda kurar','RED',()=>write('rooms/RX',null,ROOM));
  await T('u3 baskasinin profilini okur','RED',()=>read('users/u1','u3'));
  await T('u3 baskasinin profiline yazar','RED',()=>write('users/u1','u3',{name:'x'}));
  await T('u3 uye olmadan paylasimlari okur','RED',()=>read('shared/R1','u3'));
  await T('u3 uye olmadan odayi okur','RED',()=>read('rooms/R1','u3'));
  await T('u3 uye listesini okur (oda kimligini bilse bile)','RED',()=>read('rooms/R1/members','u3'));
  await T('u3 odanin kodunu okur','RED',()=>read('rooms/R1/code','u3'));
  await T('u3 KODU BILMEDEN katilir','RED',()=>write('rooms/R1/members/u3','u3',M('Davetsiz')));
  await T('u3 YANLIS kodla katilir','RED',()=>write('rooms/R1/members/u3','u3',M('Davetsiz','YANLIS')));
  await T('u3 baskasinin paylasimina yazar','RED',()=>write('shared/R1/u1/habits','u3',{h:{}}));
  await T('u3 uye olmadan kendi paylasimini yazar','RED',()=>write('shared/R1/u3/habits','u3',{h:{}}));
  await T('u3 baskasini uye yapar','RED',()=>write('rooms/R1/members/u1','u3',M('sahte','ABC123')));
  await T('u3 baskasinin uyeligini siler','RED',()=>del('rooms/R1/members/u1','u3'));
  await T('u3 baskasinin oda kodunu degistirir','RED',()=>write('rooms/R1/code','u3','HACKED'));
  await T('Var olan kod ezilir (kod kacirma)','RED',()=>write('codes/ABC123','u3',{roomId:'R9',type:'family',createdAt:'x'}));
  await T('Sahibi bile var olan kodu ezer (cakisma korumasi)','RED',()=>write('codes/ABC123','u1',{roomId:'R1',type:'family',createdAt:'x'}));
  await T('Baskasinin odasina kod yazilir','RED',()=>write('codes/ZZZ999','u3',{roomId:'R1',type:'family',createdAt:'x'}));
  await T('Var olan odanin ustune yazilir','RED',()=>write('rooms/R1','u1',ROOM));
  await T('Baskasi adina oda kurulur (createdBy sahte)','RED',()=>write('rooms/RY','u3',Object.assign({},ROOM,{members:{u1:{name:'a',joinedAt:'x'}}})));
  await T('TUM kodlar listelenir','RED',()=>read('codes','u3'));
  await T('TUM odalar listelenir','RED',()=>read('rooms','u3'));
  await T('TUM paylasimlar listelenir','RED',()=>read('shared','u3'));
  await T('TUM kullanicilar listelenir','RED',()=>read('users','u3'));
  await T('Veritabani koku okunur','RED',()=>read('','u3'));
  await T('Veritabani koku yazilir','RED',()=>write('','u3',{x:1}));
  await T('Bilinmeyen bir dala yazilir','RED',()=>write('rastgele/sey','u3',{x:1}));

  // ===== BICIM DOGRULAMA =====
  await T('Kod kaydi eksik alanla yazilir','RED',()=>write('codes/QQQ111','u1',{roomId:'R1'}));
  await T('Kod kaydi gecersiz tur ile yazilir','RED',()=>write('codes/QQQ222','u1',{roomId:'R1',type:'sirket',createdAt:'x'}));
  await T('Uye kaydi eksik alanla yazilir','RED',()=>write('rooms/R1/members/u4','u4',{code:'ABC123'}));

  let fail=0;
  for(const r of res){const ok=r.beklenen===r.cikan;if(!ok)fail++;
    console.log((ok?'GECTI ':'KALDI ')+r.name+'  beklenen='+r.beklenen+' cikan='+r.cikan)}
  console.log('\nSonuc: '+(res.length-fail)+'/'+res.length+' gecti');
  process.exit(fail?1:0);
})();
