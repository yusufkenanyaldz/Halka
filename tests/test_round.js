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
    function dstr(back){var x=new Date();x.setDate(x.getDate()-back);return ds(x)}
    function reset(sched,daysBack,target){ h.schedule=sched||null; h.days={}; h.history=[]; h.round=1;
      h.freezeUsed={}; h.targetDays=target||30; h.createdAt=ds(new Date(Date.now()-daysBack*864e5)); }
    function mark(from,to,state){var n=0;for(var i=from;i>=to;i--){var s=dstr(i);if(isScheduledDay(h,s)){h.days[s]=state||'done';n++}}return n}
    // closeC()'yi DOM'suz calistir: gercek tur kapanis mantiginin aynisi
    function closeRound(){
      h.history.push({round:h.round,days:JSON.parse(JSON.stringify(h.days)),completedAt:td(),createdAt:h.createdAt,targetDays:h.targetDays});
      h.round++; h.days={}; h.createdAt=td();
    }

    // === ASIL HATA ===
    // 1. 21 gunluk tur tamamlandi, tur kapandi -> seri korunmali
    reset(null,21,21); mark(20,0);
    var before=cS(h); closeRound();
    res.push({t:'Tur kapaninca seri korunur', beklenen:before, cikan:cS(h)});

    // 2. Iki tur ust uste -> seri iki turu birden kapsar
    reset(null,42,21); mark(41,21); closeRound();
    h.createdAt=dstr(20); mark(20,0); var before2=cS(h); closeRound();
    res.push({t:'Iki tur ust uste, seri her ikisini kapsar', beklenen:before2, cikan:cS(h)});
    res.push({t:'Iki turluk seri gercekten 42 gun', beklenen:42, cikan:cS(h)});

    // 3. Tur kapandi, ERTESI gun kacirildi -> seri kirilmali
    reset(null,21,21); mark(20,1); h.days[dstr(0)]='done';
    closeRound();           // tur dun kapandi varsayimi yerine bugun kapandi
    h.days[dstr(0)]='missed'; // kullanici bugunu 'yapamadim' isaretledi
    res.push({t:'Tur kapandi ama bugun missed -> seri kirilir', beklenen:0, cikan:cS(h)});

    // 4. Eski tur, arada bosluk, yeni tur bos -> seri 0
    reset(null,60,21);
    for(var i=59;i>=39;i--)h.days[dstr(i)]='done';
    closeRound(); h.createdAt=dstr(38); h.days={};
    res.push({t:'Eski tur + 38 gunluk bosluk -> seri 0', beklenen:0, cikan:cS(h)});

    // 5. Hafta ici programli aliskanlikta tur kapanisi
    reset('weekdays',40,15); var n5=mark(39,0); var b5=cS(h); closeRound();
    res.push({t:'Hafta ici programli, tur kapanisi', beklenen:b5, cikan:cS(h)});
    res.push({t:'Hafta ici seri hala dogru sayida', beklenen:n5, cikan:cS(h)});

    // 6. cD() hala SADECE icinde bulunulan turu saymali
    reset(null,21,21); mark(20,0); closeRound();
    res.push({t:'cD() tur kapaninca sifirlanir (ilerleme dogru)', beklenen:0, cikan:cD(h)});
    h.days[dstr(0)]='done';
    res.push({t:'cD() yeni turda 1 gun sayar', beklenen:1, cikan:cD(h)});

    // 7. history bozuk/eksikse cokmemeli
    reset(null,10,30); mark(9,0);
    h.history=[null,{round:1},{round:1,days:null}];
    res.push({t:'Bozuk history ile cokmez', beklenen:10, cikan:cS(h)});
    delete h.history;
    res.push({t:'history hic yokken calisir (eski veri)', beklenen:10, cikan:cS(h)});

    // === REGRESYON: onceki oturumun testleri ===
    reset('weekdays',31); var r1=mark(30,0);
    res.push({t:'REG hafta ici 30 gun', beklenen:r1, cikan:cS(h)});
    reset([0,2,4],60); var r2=mark(59,0);
    res.push({t:'REG ozel program Pzt/Car/Cum', beklenen:r2, cikan:cS(h)});
    reset([2],700); var r3=mark(699,0);
    res.push({t:'REG haftada tek gun 700 gun', beklenen:r3, cikan:cS(h)});
    reset(null,20); var r4=mark(19,0);
    res.push({t:'REG her gun 20 gun kesintisiz', beklenen:r4, cikan:cS(h)});
    reset(null,20); mark(19,0); h.days[dstr(5)]='missed';
    res.push({t:'REG 5 gun once missed', beklenen:5, cikan:cS(h)});
    reset(null,20); mark(19,0); h.days[dstr(4)]='paused';
    res.push({t:'REG paused gun atlanir', beklenen:19, cikan:cS(h)});
    reset(null,5); mark(19,0);
    res.push({t:'REG createdAt siniri', beklenen:6, cikan:cS(h)});
    reset('weekdays',31); var r5=mark(30,0); var bon=0;
    for(var i=1;i<=7;i++){var s=dstr(i);if(!isScheduledDay(h,s)){h.days[s]='done';bon++}}
    res.push({t:'REG hafta sonu bonus isaret', beklenen:r5+bon, cikan:cS(h)});
    return res;
  });
  let fail=0;
  for(const r of out){const ok=r.beklenen===r.cikan; if(!ok)fail++;
    console.log((ok?'GECTI ':'KALDI ')+r.t+'  beklenen='+r.beklenen+' cikan='+r.cikan);}
  console.log('\nSonuc: '+(out.length-fail)+'/'+out.length+' gecti');
  console.log('Sayfa hatasi:', errs.join(' | ')||'(yok)');
  await b.close();
  process.exit(fail?1:0);
})();
