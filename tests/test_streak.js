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

  const results = await p.evaluate(()=>{
    var out=[];
    var h=S.habits[0];
    function reset(sched,daysBack){ h.schedule=sched; h.days={}; h.freezeUsed={};
      h.createdAt=ds(new Date(Date.now()-daysBack*864e5)); }
    function dstr(back){var x=new Date();x.setDate(x.getDate()-back);return ds(x)}
    function markScheduled(from,to,state){ // inclusive days-back range
      var n=0;
      for(var i=from;i>=to;i--){var s=dstr(i);if(isScheduledDay(h,s)){h.days[s]=state||'done';n++}}
      return n;
    }

    // 1. HAFTA İÇİ: son 30 günün tüm planlı günleri done
    reset('weekdays',31);
    var n1=markScheduled(30,0);
    out.push({t:'Hafta içi, 30 günün tüm planlı günleri done', beklenen:n1, cikan:cS(h)});

    // 2. HAFTA İÇİ: bugün henüz işaretsiz, dünden geriye hepsi done
    reset('weekdays',31);
    var n2=markScheduled(30,1);
    var todayCounts=isScheduledDay(h,td())?0:0;
    out.push({t:'Hafta içi, bugün işaretsiz', beklenen:n2, cikan:cS(h)});

    // 3. ÖZEL PROGRAM: Pzt/Çar/Cum
    reset([0,2,4],60);
    var n3=markScheduled(59,0);
    out.push({t:'Özel program Pzt/Çar/Cum, 60 gün', beklenen:n3, cikan:cS(h)});

    // 4. HAFTADA TEK GÜN, uzun seri (döngü sınırı testi)
    reset([2],700);
    var n4=markScheduled(699,0);
    out.push({t:'Haftada tek gün, 700 gün (~100 hafta)', beklenen:n4, cikan:cS(h)});

    // 5. REGRESYON: her gün, kesintisiz
    reset(null,20);
    var n5=markScheduled(19,0);
    out.push({t:'REGRESYON her gün, 20 gün kesintisiz', beklenen:n5, cikan:cS(h)});

    // 6. REGRESYON: her gün, 5 gün önce missed
    reset(null,20);
    markScheduled(19,0);
    h.days[dstr(5)]='missed';
    out.push({t:'REGRESYON her gün, 5 gün önce missed', beklenen:5, cikan:cS(h)});

    // 7. HAFTA İÇİ: planlı bir gün gerçekten kaçırılmış -> seri kırılmalı
    reset('weekdays',31);
    markScheduled(30,0);
    // en yakın planlı geçmiş günü missed yap
    var broke=null;
    for(var i=1;i<=10;i++){var s=dstr(i);if(isScheduledDay(h,s)){h.days[s]='missed';broke=i;break}}
    var expected=0;
    for(var i=0;i<broke;i++){var s=dstr(i);if(isScheduledDay(h,s)&&h.days[s]==='done')expected++}
    out.push({t:'Hafta içi, planlı gün kaçırılmış (seri kırılmalı)', beklenen:expected, cikan:cS(h)});

    // 8. HAFTA İÇİ: planlı gün hiç işaretlenmemiş (silinmiş) -> seri kırılmalı
    reset('weekdays',31);
    markScheduled(30,0);
    var broke2=null;
    for(var i=1;i<=10;i++){var s=dstr(i);if(isScheduledDay(h,s)){delete h.days[s];broke2=i;break}}
    var expected2=0;
    for(var i=0;i<broke2;i++){var s=dstr(i);if(isScheduledDay(h,s)&&h.days[s]==='done')expected2++}
    out.push({t:'Hafta içi, planlı gün işaretsiz (seri kırılmalı)', beklenen:expected2, cikan:cS(h)});

    // 9. REGRESYON: paused günler atlanıyor
    reset(null,20);
    markScheduled(19,0);
    h.days[dstr(4)]='paused';
    out.push({t:'REGRESYON paused gün atlanır', beklenen:19, cikan:cS(h)});

    // 10. createdAt sınırı: oluşturulmadan öncesi sayılmaz
    reset(null,5);
    markScheduled(19,0);
    out.push({t:'createdAt sınırı (5 gün önce kuruldu)', beklenen:6, cikan:cS(h)});

    // 11. Planlı olmayan günde işaretlenen bonus gün sayılır
    reset('weekdays',31);
    var n11=markScheduled(30,0);
    var bonus=0;
    for(var i=1;i<=7;i++){var s=dstr(i);if(!isScheduledDay(h,s)){h.days[s]='done';bonus++}}
    out.push({t:'Hafta içi + hafta sonu bonus işaret', beklenen:n11+bonus, cikan:cS(h)});

    return out;
  });
  console.log('Bugün:', await p.evaluate(()=>td()+' ('+new Date().getDay()+')'));
  let fail=0;
  for(const r of results){ const ok = r.beklenen===r.cikan; if(!ok)fail++;
    console.log((ok?'GECTI ':'KALDI ')+r.t+'  beklenen='+r.beklenen+' cikan='+r.cikan); }
  console.log('\nSonuc: '+(results.length-fail)+'/'+results.length+' gecti');
  console.log('Sayfa hatasi:', errs.join(' | ')||'(yok)');
  await b.close();
  process.exit(fail?1:0);
})();
