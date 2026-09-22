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

  // sayfa tarafi yardimcilar
  await p.evaluate(()=>{
    window.T={
      dstr:function(n){var x=new Date();x.setDate(x.getDate()-n);return ds(x)},
      shown:function(){return document.getElementById('cOv').classList.contains('show')},
      msShown:function(){return document.getElementById('msOv').classList.contains('show')},
      hid:function(){return document.getElementById('cOv').dataset.hid||''},
      hide:function(){document.getElementById('cOv').classList.remove('show');
                      document.getElementById('msOv').classList.remove('show')},
      // hedefe tam 1 gun kala kur; istenen gun bos birakilir
      arm:function(h,target,type,gapDaysBack){
        h.type=type||'gain'; h.targetDays=target; h.days={}; h.history=[]; h.round=1;
        h.freezeUsed={}; h.schedule=null; h.archived=false;
        h.createdAt=T.dstr(target);
        for(var i=target;i>=0;i--)h.days[T.dstr(i)]='done';
        if(gapDaysBack!==undefined){
          delete h.days[T.dstr(gapDaysBack)];
          h.freezeUsed[T.dstr(gapDaysBack)]='blocked'; // autoMiss joker ile doldurmasin
        }
        return h;
      },
      // hedefin altinda, tam N gun isaretli
      setDone:function(h,target,n){
        h.type='gain'; h.targetDays=target; h.days={}; h.history=[]; h.round=1;
        h.freezeUsed={}; h.schedule=null; h.archived=false;
        h.createdAt = n>0?T.dstr(n-1):td();
        for(var i=n-1;i>=0;i--)h.days[T.dstr(i)]='done';
        return h;
      }
    };
  });

  const res=[];
  const add=(t,beklenen,cikan)=>res.push({t,beklenen,cikan});
  const ev=(fn,arg)=>p.evaluate(fn,arg);

  // --- 1. ASIL HATA: gecmis gunu doldurmak ---
  await ev(()=>{S.habits=[S.habits[0]]; T.hide(); T.arm(S.habits[0],7,'gain',1); renderMain(); T.hide();});
  add('Doldurmadan once kutlama yok', false, await ev(()=>T.shown()));
  await ev(()=>{bfY(S.habits[0].id,'done',T.dstr(1))});
  await p.waitForTimeout(400);
  add('ASIL HATA: gecmis gunu doldurunca kutlama acilir', true, await ev(()=>T.shown()));
  add('Kutlama dogru aliskanligi hedefliyor', true, await ev(()=>T.hid()===S.habits[0].id));
  const afterClose = await ev(()=>{closeC();return{tur:S.habits[0].round,gun:cD(S.habits[0]),acik:T.shown()}});
  add('Kapaninca tur artar', 2, afterClose.tur);
  add('Kapaninca gunler sifirlanir', 0, afterClose.gun);
  await ev(()=>renderMain()); await p.waitForTimeout(200);
  add('Dongu yok: sonraki renderMain tekrar acmaz', false, await ev(()=>T.shown()));

  // --- 2. REGRESYON: bugunu isaretlemek hala kutluyor ---
  await ev(()=>{T.hide(); T.arm(S.habits[0],7,'gain',0); renderMain(); T.hide();});
  await ev(()=>{mkDn(S.habits[0].id,null)});
  await p.waitForTimeout(500);
  add('REG bugunu isaretlemek kutlar', true, await ev(()=>T.shown()));
  await ev(()=>{closeC();T.hide()});

  // --- 3. Widget tamamlamasi ---
  await ev(()=>{T.hide(); T.arm(S.habits[0],7,'gain',0); renderMain(); T.hide();});
  await ev(()=>{widgetComplete(S.habits[0].id,td())});
  await p.waitForTimeout(400);
  add('Widget tamamlamasi kutlar', true, await ev(()=>T.shown()));
  await ev(()=>{closeC();T.hide()});

  // --- 4. Joker (autoMiss) hedefi tamamlarsa ---
  await ev(()=>{T.hide();
    var h=S.habits[0];
    h.type='gain';h.targetDays=7;h.days={};h.history=[];h.round=1;h.freezeUsed={};h.schedule=null;h.archived=false;
    h.createdAt=T.dstr(7);
    for(var i=7;i>=0;i--)h.days[T.dstr(i)]='done';
    delete h.days[T.dstr(5)]; // joker hakkiyla doldurulacak eski gun
  });
  await ev(()=>renderMain()); await p.waitForTimeout(400);
  add('Joker hedefi tamamlarsa kutlar', true, await ev(()=>T.shown()));
  await ev(()=>{closeC();T.hide()});

  // --- 5. Iki aliskanlik ayni anda hedefte: zincir ---
  await ev(()=>{
    T.hide();
    var a=S.habits[0];
    var bb=JSON.parse(JSON.stringify(a)); bb.id='hb2'; bb.name='Kitap';
    S.habits=[a,bb];
    T.arm(a,7,'gain'); T.arm(bb,7,'gain');
  });
  await ev(()=>renderMain()); await p.waitForTimeout(300);
  const chain1 = await ev(()=>({acik:T.shown(),hedef:T.hid()}));
  add('Iki hedef: once birincisi kutlanir', true, chain1.acik);
  await ev(()=>closeC()); await p.waitForTimeout(300);
  const chain2 = await ev(()=>({acik:T.shown(),hedef:T.hid(),farkli:T.hid()!=='' }));
  add('Ilkini kapatinca ikincisi kutlanir', true, chain2.acik);
  add('Ikinci kutlama farkli aliskanlik', true, chain1.hedef!==chain2.hedef);
  await ev(()=>closeC()); await p.waitForTimeout(300);
  add('Ikisi de bitince kutlama kalmaz', false, await ev(()=>T.shown()));

  // --- 6. REGRESYON: hedefin altinda kutlama yok ---
  await ev(()=>{T.hide(); S.habits=[S.habits[0]]; T.setDone(S.habits[0],30,5);});
  await ev(()=>renderMain()); await p.waitForTimeout(300);
  add('REG hedefin altinda kutlama yok', false, await ev(()=>T.shown()));

  // --- 7. Kilometre tasi: geriye donuk doldurmada da calisir ---
  await ev(()=>{T.hide(); S.milestones={}; var h=S.habits[0];
    h.type='gain';h.targetDays=30;h.days={};h.history=[];h.round=1;h.freezeUsed={};h.schedule=null;
    h.createdAt=T.dstr(6);
    for(var i=6;i>=0;i--)h.days[T.dstr(i)]='done';
    delete h.days[T.dstr(1)]; h.freezeUsed[T.dstr(1)]='blocked';
    renderMain(); T.hide(); S.milestones={};
  });
  await ev(()=>{bfY(S.habits[0].id,'done',T.dstr(1))});
  await p.waitForTimeout(500);
  add('Geriye donuk doldurma kilometre tasini da acar (7 gun)', true, await ev(()=>T.msShown()));
  add('Kilometre tasi kutlama degil', false, await ev(()=>T.shown()));
  await ev(()=>{closeMs();T.hide()});

  // --- 8. Arsivlenmis aliskanlik kutlanmaz ---
  await ev(()=>{T.hide(); T.arm(S.habits[0],7,'gain'); S.habits[0].archived=true;});
  await ev(()=>renderMain()); await p.waitForTimeout(300);
  add('Arsivlenmis aliskanlik kutlanmaz', false, await ev(()=>T.shown()));
  await ev(()=>{S.habits[0].archived=false});

  // --- 9. Birakma (quit) tarafi ---
  await ev(()=>{T.hide(); T.arm(S.habits[0],7,'quit',1); renderMain(); T.hide();});
  await ev(()=>{bfY(S.habits[0].id,'done',T.dstr(1))});
  await p.waitForTimeout(400);
  add('Quit aliskanlik da kutlanir', true, await ev(()=>T.shown()));
  await ev(()=>{closeC();T.hide()});

  // --- 10. Acik kutlama varken yenisi acilmaz ---
  await ev(()=>{T.hide(); T.arm(S.habits[0],7,'gain'); renderMain();});
  const firstHid = await ev(()=>T.hid());
  await ev(()=>{ // ikinci bir hedefe ulasmis aliskanlik ekle
    var bb=JSON.parse(JSON.stringify(S.habits[0])); bb.id='hb3'; bb.name='Su'; S.habits.push(bb);
    renderMain();
  });
  await p.waitForTimeout(300);
  add('Acik kutlama varken hedef degismez', true, await ev(()=>T.hid())===firstHid);

  await b.close();
  return {res, errs:errs.join(' | ')||'(yok)'};
};
(async()=>{
  const url = process.argv[2] || (process.env.HALKA_URL || 'file://'+require('path').resolve(__dirname,'..','index.html'));
  const {res,errs} = await run(url);
  let fail=0;
  for(const r of res){const ok=String(r.beklenen)===String(r.cikan); if(!ok)fail++;
    console.log((ok?'GECTI ':'KALDI ')+r.t+'  beklenen='+r.beklenen+' cikan='+r.cikan);}
  console.log('\nSonuc: '+(res.length-fail)+'/'+res.length+' gecti');
  console.log('Sayfa hatasi:', errs);
  process.exit(fail?1:0);
})();
