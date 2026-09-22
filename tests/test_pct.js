const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
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
  await p.click('text=Spor'); await p.click('text=Kitap'); await p.waitForTimeout(300);
  await p.click('#stBtn'); await p.waitForTimeout(1500);
  const out = await p.evaluate(()=>{
    var res=[];
    function dstr(n){var x=new Date();x.setDate(x.getDate()-n);return ds(x)}
    function setup(h,type,target,doneCount){
      // createdAt tam olarak ilk isaretli gune esitleniyor: arada isaretsiz gun
      // birakirsak autoMiss() joker hakkiyla onu 'done' yapip sayiyi kaydiriyor.
      h.type=type; h.targetDays=target; h.days={}; h.history=[]; h.round=1;
      h.freezeUsed={}; h.schedule=null;
      h.createdAt = doneCount>0 ? dstr(doneCount-1) : td();
      for(var i=doneCount-1;i>=0;i--)h.days[dstr(i)]='done';
    }
    // ana halkanin ortasindaki yuzdeyi DOM'dan oku
    function ringPct(){
      renderMain();
      var t=document.getElementById('rCtrActive').innerText;
      var m=t.match(/%\s*(-?\d+)/); return m?parseInt(m[1],10):-999;
    }
    var a=S.habits[0], bb=S.habits[1];

    // === ASIL HATA: hedefi asan gun sayisi ===
    S.habits=[a]; setup(a,'gain',7,8);
    res.push({t:'ASIL HATA 8/7 gun -> %100 (once %114)', beklenen:100, cikan:ringPct()});

    setup(a,'gain',10,25);
    res.push({t:'Cok asan: 25/10 gun', beklenen:100, cikan:ringPct()});

    // === REGRESYON: normal degerler degismemeli ===
    setup(a,'gain',10,5);
    res.push({t:'REG 5/10 gun -> %50', beklenen:50, cikan:ringPct()});
    setup(a,'gain',10,0);
    res.push({t:'REG 0/10 gun -> %0', beklenen:0, cikan:ringPct()});
    setup(a,'gain',10,10);
    res.push({t:'REG 10/10 gun -> %100', beklenen:100, cikan:ringPct()});
    setup(a,'gain',3,1);
    res.push({t:'REG yuvarlama 1/3 -> %33', beklenen:33, cikan:ringPct()});
    setup(a,'gain',3,2);
    res.push({t:'REG yuvarlama 2/3 -> %67', beklenen:67, cikan:ringPct()});

    // === Birden fazla aliskanlik, biri hedefi asmis ===
    S.habits=[a,bb]; setup(a,'gain',10,20); setup(bb,'gain',10,0);
    res.push({t:'Iki aliskanlik 20/10 + 0/10 -> %100 (once %100 ustu)', beklenen:100, cikan:ringPct()});
    setup(a,'gain',10,5); setup(bb,'gain',10,5);
    res.push({t:'REG iki aliskanlik 5/10 + 5/10 -> %50', beklenen:50, cikan:ringPct()});

    // === quit (birakmak) tarafi ===
    S.habits=[a]; setup(a,'quit',10,0);
    res.push({t:'REG quit 0/10 -> %100 temiz', beklenen:100, cikan:ringPct()});
    setup(a,'quit',10,4);
    res.push({t:'REG quit 4/10 -> %60 temiz', beklenen:60, cikan:ringPct()});
    setup(a,'quit',10,30);
    res.push({t:'quit hedefi asmis 30/10 -> %0', beklenen:0, cikan:ringPct()});

    // === pctOf dogrudan ===
    if(typeof pctOf==='function'){
      res.push({t:'pctOf(8,7)', beklenen:100, cikan:pctOf(8,7)});
      res.push({t:'pctOf(0,0) sifira bolme', beklenen:0, cikan:pctOf(0,0)});
      res.push({t:'pctOf(5,0) sifira bolme', beklenen:0, cikan:pctOf(5,0)});
      res.push({t:'pctOf(-3,10) negatif', beklenen:0, cikan:pctOf(-3,10)});
      res.push({t:'pctOf(1,3) yuvarlama', beklenen:33, cikan:pctOf(1,3)});
    } else { res.push({t:'pctOf yok (duzeltme oncesi surum)', beklenen:'var', cikan:'yok'}); }

    // === Partnerden gelen yuzde ===
    S.roomId='r1'; S.roomType='couple'; S.sharedHabits=[a.id];
    function partnerPct(raw){
      S.partnerData={u2:{summary:{name:'P',avatar:'book',done:1,total:1,lastSeen:td()},
        habits:{h1:{name:'X',type:'gain',color:'#8CB4F0',icon:'book',targetDays:10,todayDone:true,streak:3,pct:raw}}}};
      renderRoomMode('couple');
      var t=document.getElementById('roomModeContent').innerText;
      var m=t.match(/%(-?\d+)/g)||[];
      // halka yayinin kaymasi negatif olmamali
      var offs=[].slice.call(document.querySelectorAll('#roomModeContent circle[stroke-dashoffset]'))
        .map(function(c){return parseFloat(c.getAttribute('stroke-dashoffset'))});
      return {etiketler:m.join(','), negatifYay:offs.some(function(o){return o<0||isNaN(o)})};
    }
    var r1=partnerPct(500);
    res.push({t:'Partner %500 gonderdi -> negatif yay yok', beklenen:false, cikan:r1.negatifYay});
    res.push({t:'Partner %500 -> etiket 100 ile sinirli', beklenen:true, cikan:/(^|,)%100(,|$)/.test(r1.etiketler)});
    var r2=partnerPct(-40);
    res.push({t:'Partner negatif gonderdi -> negatif yay yok', beklenen:false, cikan:r2.negatifYay});
    var r3=partnerPct('abc');
    res.push({t:'Partner gecersiz deger -> negatif/NaN yay yok', beklenen:false, cikan:r3.negatifYay});
    var r4=partnerPct(60);
    res.push({t:'REG partner %60 normal', beklenen:true, cikan:/%60/.test(r4.etiketler)});
    return res;
  });
  const errsOut = errs.join(' | ')||'(yok)';
  await b.close();
  return {out, errsOut};
};
(async()=>{
  const {out, errsOut} = await run((process.env.HALKA_URL || 'file://'+require('path').resolve(__dirname,'..','index.html')));
  let fail=0;
  for(const r of out){const ok=String(r.beklenen)===String(r.cikan); if(!ok)fail++;
    console.log((ok?'GECTI ':'KALDI ')+r.t+'  beklenen='+r.beklenen+' cikan='+r.cikan);}
  console.log('\nSonuc: '+(out.length-fail)+'/'+out.length+' gecti');
  console.log('Sayfa hatasi:', errsOut);
  process.exit(fail?1:0);
})();
