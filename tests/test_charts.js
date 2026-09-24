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
    var res=[]; var h=S.habits[0]; S.habits=[h];
    function dstr(n){var x=new Date();x.setDate(x.getDate()-n);return ds(x)}
    function reset(back,target){h.schedule=null;h.days={};h.history=[];h.round=1;h.freezeUsed={};
      h.targetDays=target||14;h.createdAt=ds(new Date(Date.now()-back*864e5))}
    function fill(from,to){for(var i=from;i>=to;i--)h.days[dstr(i)]='done'}
    function closeRound(){h.history.push({round:h.round,days:JSON.parse(JSON.stringify(h.days)),
      completedAt:td(),createdAt:h.createdAt,targetDays:h.targetDays});h.round++;h.days={};h.createdAt=td()}
    // haftalik hedef kutusunu DOM'dan oku
    function goalDays(){renderWeeklyGoal();
      var t=document.getElementById('weeklyGoalArea').innerText;
      var m=t.match(/(\d+)\s*\/\s*(\d+)/); return m?parseInt(m[1],10):-1}

    // === ASIL HATA: tur kapanisi grafikleri silmemeli ===
    reset(13,14); fill(13,0);
    var gecenOnce=getWeekData(1).join(','), buOnce=getWeekData(0).join(','), goalOnce=goalDays();
    closeRound();
    res.push({t:'Gecen hafta grafigi tur kapanisindan sonra', beklenen:gecenOnce, cikan:getWeekData(1).join(',')});
    res.push({t:'Bu hafta grafigi tur kapanisindan sonra', beklenen:buOnce, cikan:getWeekData(0).join(',')});
    res.push({t:'Haftalik hedef tur kapanisindan sonra', beklenen:goalOnce, cikan:goalDays()});
    res.push({t:'Gecen hafta gercekten dolu', beklenen:'1,1,1,1,1,1,1', cikan:getWeekData(1).join(',')});

    // === Haftalik ozet ===
    function wkSum(){
      var el=document.getElementById('wkSumArea');
      el.innerHTML=''; // erken donus halinde eski icerigi okumayalim
      renderWeeklySummary();
      var m=el.innerText.match(/(\d+)\s*\/\s*(\d+)/); return m?m[0]:'(bos)'}
    var realTd=td;
    function withTd(fake,fn){ window.td=function(){return fake}; try{return fn()}finally{window.td=realTd} }
    // Gercek bir hafta olusturmak icin "bugun"u persembeye sabitle
    var thu=(function(){var d=new Date();d.setDate(d.getDate()-((d.getDay()===0?6:d.getDay()-1)+4));return ds(d)})();
    reset(30,14); fill(30,0);
    var sumOnce=withTd(thu,wkSum);
    // Turu persembe kapatilmis gibi yap: o gune kadarki gunler history'ye gider
    h.history.push({round:1,days:JSON.parse(JSON.stringify(h.days)),completedAt:thu,createdAt:h.createdAt,targetDays:14});
    h.round=2; h.days={}; h.createdAt=thu;
    res.push({t:'Haftalik ozet tur kapanisindan sonra ('+thu+')', beklenen:sumOnce, cikan:withTd(thu,wkSum)});
    res.push({t:'Haftalik ozet gercekten dolu (bos degil)', beklenen:true, cikan:sumOnce!=='(bos)'});

    // === Sinir gunu iki kez sayilmaz (grafik gun basina aliskanlik sayar) ===
    reset(13,14); fill(13,0); closeRound(); h.days[dstr(0)]='done';
    var bugunIdx=(function(){var n=new Date().getDay();return n===0?6:n-1})();
    res.push({t:'Sinir gunu grafikte 1 sayilir', beklenen:1, cikan:getWeekData(0)[bugunIdx]});

    // === Iki tur ust uste ===
    reset(27,14); fill(27,14); closeRound(); h.createdAt=dstr(13); fill(13,0);
    var g2=getWeekData(1).join(','); closeRound();
    res.push({t:'Iki tur sonrasi gecen hafta grafigi', beklenen:g2, cikan:getWeekData(1).join(',')});

    // === REGRESYON: history yokken grafikler eskisi gibi ===
    reset(13,14); fill(13,0); delete h.history;
    res.push({t:'REG history yokken gecen hafta', beklenen:'1,1,1,1,1,1,1', cikan:getWeekData(1).join(',')});
    res.push({t:'REG history yokken bu hafta bugun', beklenen:1, cikan:getWeekData(0)[bugunIdx]});

    // === REGRESYON: missed gun grafige girmez ===
    // Gecen haftanin cumasi (bugunden n+3 gun once; n = pazartesiden beri gecen gun). Eskiden
    // "3 gun once" yaziyordu: yalniz pazartesi-carsamba gecen haftaya dusuyordu, persembe kaliyordu.
    var gecenCuma=(function(){var n=new Date().getDay();n=n===0?6:n-1;return n+3})();
    reset(13,14); h.history=[]; fill(13,0); h.days[dstr(gecenCuma)]='missed';
    var wd=getWeekData(1);
    res.push({t:'REG missed gun grafikte 0 (gecen hafta 7 yerine 6)', beklenen:6, cikan:wd.reduce(function(a,c){return a+c},0)});

    // === REGRESYON: hic isaret yoksa hepsi 0 ===
    reset(13,14); h.history=[];
    res.push({t:'REG bos veri', beklenen:'0,0,0,0,0,0,0', cikan:getWeekData(1).join(',')});
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
