const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport:{width:390,height:844} });
  const p = await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.route('**/fonts.googleapis.com/**', r=>r.abort());
  await p.goto((process.env.HALKA_URL || 'file://'+require('path').resolve(__dirname,'..','index.html')));
  await p.waitForTimeout(7000);
  await p.click('text=Başlayalım'); await p.waitForTimeout(400);
  await p.fill('#inpName','Y'); await p.click('text=Devam'); await p.waitForTimeout(400);
  await p.click('text=Alışkanlık Seç'); await p.waitForTimeout(300);
  await p.click('text=Spor'); await p.waitForTimeout(200);
  await p.click('#stBtn'); await p.waitForTimeout(1200);

  const out = await p.evaluate(()=>{
    var res=[]; var h=S.habits[0];
    function dstr(n){var x=new Date();x.setDate(x.getDate()-n);return ds(x)}
    function reset(sched,back,target){h.schedule=sched||null;h.days={};h.history=[];h.round=1;
      h.freezeUsed={};h.targetDays=target||21;h.createdAt=ds(new Date(Date.now()-back*864e5))}
    function mark(from,to){var n=0;for(var i=from;i>=to;i--){var s=dstr(i);if(isScheduledDay(h,s)){h.days[s]='done';n++}}return n}
    function closeRound(){h.history.push({round:h.round,days:JSON.parse(JSON.stringify(h.days)),
      completedAt:td(),createdAt:h.createdAt,targetDays:h.targetDays});h.round++;h.days={};h.createdAt=td()}
    S.habits=[h]; // tek aliskanlik, puan izole olsun

    // 1. ASIL HATA: tur kapaninca puan dusmemeli
    reset(null,21,21); mark(20,0);
    var xpBefore=calcXP(); closeRound(); var xpAfter=calcXP();
    res.push({t:'Tur kapaninca puan dusmez', beklenen:true, cikan:xpAfter>=xpBefore});
    res.push({t:'Puan tam 150 artar (100 tur + 50 gecmis)', beklenen:xpBefore+150, cikan:xpAfter});
    res.push({t:'Gun puani korunur (21 gun x 10)', beklenen:210, cikan:cDAll(h)*10});

    // 2. Sinir gunu iki kez sayilmaz
    reset(null,21,21); mark(20,0); closeRound();
    h.days[dstr(0)]='done'; // bugunu yeni turda tekrar isaretle
    res.push({t:'Sinir gunu tek sayilir', beklenen:21, cikan:cDAll(h)});

    // 3. Ust uste 3 tur boyunca puan hic dusmez
    reset(null,63,21);
    var seq=[],prev=0,monoton=true;
    for(var r=0;r<3;r++){
      h.createdAt=dstr(62-r*21);
      for(var i=62-r*21;i>=42-r*21;i--)h.days[dstr(i)]='done';
      var x1=calcXP(); closeRound(); var x2=calcXP();
      seq.push(x1+'->'+x2); if(x2<x1)monoton=false; if(x1<prev)monoton=false; prev=x2;
    }
    res.push({t:'3 tur boyunca puan hic dusmez ['+seq.join(', ')+']', beklenen:true, cikan:monoton});

    // 4. Seviye geri gitmez
    reset(null,90,90); mark(89,0);
    function lvIdx(n){for(var i=0;i<LEVELS.length;i++)if(LEVELS[i].name===n)return i;return -1}
    var xpB=calcXP(),lb=getLevel(xpB); closeRound(); var xpA=calcXP(),la=getLevel(xpA);
    res.push({t:'Seviye geri gitmez ('+lb.name+' '+xpB+'XP -> '+la.name+' '+xpA+'XP)',
      beklenen:true, cikan:lvIdx(la.name)>=lvIdx(lb.name)&&xpA>=xpB});

    // 5. cD() dokunulmadi: ilerleme hala tur bazli
    reset(null,21,21); mark(20,0); closeRound();
    res.push({t:'cD() tur kapaninca 0 (ilerleme dogru)', beklenen:0, cikan:cD(h)});
    h.days[dstr(0)]='done';
    res.push({t:'cD() yeni turda 1', beklenen:1, cikan:cD(h)});

    // 6. Tek turda puan eskisi gibi (regresyon)
    reset(null,10,30); mark(9,0);
    res.push({t:'REG tek tur puani = 10gun*10 + seri*2', beklenen:100+cS(h)*2, cikan:calcXP()});

    // 7. missed/paused gunler puan vermez
    reset(null,10,30); mark(9,0); h.days[dstr(3)]='missed'; h.days[dstr(4)]='paused';
    res.push({t:'missed/paused gun puan vermez', beklenen:8, cikan:cDAll(h)});

    // 8. Bozuk/eksik history ile cokmez
    reset(null,10,30); mark(9,0);
    h.history=[null,{round:1},{round:1,days:null}];
    res.push({t:'Bozuk history ile cDAll calisir', beklenen:10, cikan:cDAll(h)});
    delete h.history;
    res.push({t:'history yokken cDAll calisir (eski veri)', beklenen:10, cikan:cDAll(h)});

    return res;
  });
  let fail=0;
  for(const r of out){const ok=String(r.beklenen)===String(r.cikan); if(!ok)fail++;
    console.log((ok?'GECTI ':'KALDI ')+r.t+'  beklenen='+r.beklenen+' cikan='+r.cikan);}
  console.log('\nSonuc: '+(out.length-fail)+'/'+out.length+' gecti');
  console.log('Sayfa hatasi:', errs.join(' | ')||'(yok)');
  await b.close();
  process.exit(fail?1:0);
})();
