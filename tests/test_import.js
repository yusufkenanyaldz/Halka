// Yedek ice aktarma (birlestirme modu): kimlik cakismasi ve 8 aliskanlik siniri.
// impD() gercek dosya secici, confirm/alert pencereleri ve sayfa yenilemesiyle
// uctan uca suruluyor; ic yardimcilara dayanmiyor, bu yuzden duzeltme oncesi
// surumde de ayni sekilde calisir.
const fs = require('fs'), path = require('path'), os = require('os');

function hb(id, name, extra){
  return Object.assign({id:id,name:name,type:'gain',targetDays:30,color:'#8ee4c8',
    createdAt:'2026-09-01',days:{},round:1,history:[],notes:{},paused:false,archived:false}, extra||{});
}

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
  await p.click('text=Spor'); await p.waitForTimeout(200);
  await p.click('#stBtn'); await p.waitForTimeout(1500);

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(),'halka-imp-'));
  let n=0, alerts=[];

  // Mevcut veriyi kur, yedegi birlestirme moduyla ice aktar, yenilenmis sayfanin S'ini don.
  async function importMerge(existing, backup){
    await p.evaluate(h=>{S.habits=h;S.milestones={};sv()}, existing);
    const f = path.join(tmp, 'yedek'+(n++)+'.json');
    fs.writeFileSync(f, JSON.stringify(backup));
    alerts=[]; let confirms=0;
    const onDialog = async d=>{
      if(d.type()==='confirm'){confirms++;
        // 1. "Devam?" -> evet, 2. "Uzerine yazsin mi?" -> hayir (birlestir)
        if(confirms===1)await d.accept(); else await d.dismiss();
      } else {alerts.push(d.message()); await d.accept();}
    };
    p.on('dialog', onDialog);
    const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.evaluate(()=>impD())]);
    await Promise.all([p.waitForNavigation(), fc.setFiles(f)]);
    await p.waitForTimeout(1500);
    p.off('dialog', onDialog);
    return p.evaluate(()=>({
      habits:S.habits.map(h=>({id:h.id,name:h.name,archived:!!h.archived,days:h.days})),
      ms:S.milestones||{},
      fhOk:S.habits.every(h=>fH(h.id)===h),
      uniq:new Set(S.habits.map(h=>h.id)).size===S.habits.length,
      active:S.habits.filter(h=>!h.archived).length
    }));
  }
  const byName=(r,nm)=>r.habits.find(h=>h.name===nm);
  const res=[];

  // --- 1. ASIL HATA: yeniden adlandirilmis aliskanligin eski yedegi ---
  // Kullanici yedek alir, "Spor"u "Kosu" yapar, sonra eski yedegi birlestirir.
  var r1 = await importMerge([hb('aaa','Koşu')],
    {habits:[hb('aaa','Spor',{days:{'2026-09-10':'done','2026-09-11':'done'}})],
     milestones:{'ms_aaa_7_1':true}});
  res.push({t:'ASIL HATA: kimlikler benzersiz kalir', beklenen:true, cikan:r1.uniq});
  res.push({t:'ASIL HATA: her aliskanlik fH ile kendisine ulasilir', beklenen:true, cikan:r1.fhOk});
  res.push({t:'Iki aliskanlik da var', beklenen:'Koşu,Spor', cikan:r1.habits.map(h=>h.name).join(',')});
  res.push({t:'Mevcut aliskanligin kimligi degismez', beklenen:'aaa', cikan:(byName(r1,'Koşu')||{}).id});
  // Yalniz yedekteki iki gune bakilir; sonraki bosluklari autoMiss/joker doldurur.
  var sd=(byName(r1,'Spor')||{days:{}}).days;
  res.push({t:'Gelen aliskanligin verisi korunur', beklenen:'done,done', cikan:sd['2026-09-10']+','+sd['2026-09-11']});
  res.push({t:'Gelen kilometre tasi mevcut aliskanliga yapismaz', beklenen:undefined, cikan:r1.ms['ms_aaa_7_1']});
  var sporId=(byName(r1,'Spor')||{}).id;
  res.push({t:'Gelen kilometre tasi yeni kimlige tasinir', beklenen:true, cikan:r1.ms['ms_'+sporId+'_7_1']});

  // Hatanin kullaniciya gorunen yuzu: Spor kartindaki "Tamamlandi" Kosu'yu isaretler
  var clickRes = await p.evaluate(sid=>{
    var t=td(), spor=S.habits.find(h=>h.name==='Spor'), kosu=S.habits.find(h=>h.name==='Koşu');
    mkDn(sid);
    return {spor:spor.days[t]||'', kosu:kosu.days[t]||''};
  }, sporId);
  res.push({t:'ASIL HATA: Spor isaretlenince Spor isaretlenir', beklenen:'done', cikan:clickRes.spor});
  res.push({t:'ASIL HATA: Spor isaretlenince Kosu degismez', beklenen:'', cikan:clickRes.kosu});

  // --- 2. Yedek dosyasinin kendi icinde ayni kimlik iki kez ---
  var r2 = await importMerge([hb('x1','Okuma')],
    {habits:[hb('bbb','Su'),hb('bbb','Yuruyus')]});
  res.push({t:'Dosya ici cakisma: kimlikler benzersiz', beklenen:true, cikan:r2.uniq});
  res.push({t:'Dosya ici cakisma: uc aliskanlik da var', beklenen:3, cikan:r2.habits.length});

  // --- 3. 8 aliskanlik siniri ---
  var six=[1,2,3,4,5,6].map(i=>hb('m'+i,'Mevcut '+i));
  var five=[1,2,3,4,5].map(i=>hb('g'+i,'Gelen '+i));
  var r3 = await importMerge(six, {habits:five});
  res.push({t:'SINIR: aktif aliskanlik 8i gecmez', beklenen:8, cikan:r3.active});
  res.push({t:'SINIR: fazlasi silinmez, arsive girer', beklenen:11, cikan:r3.habits.length});
  res.push({t:'SINIR: arsive girenler sona kalanlar', beklenen:'Gelen 3,Gelen 4,Gelen 5',
            cikan:r3.habits.filter(h=>h.archived).map(h=>h.name).join(',')});
  res.push({t:'SINIR: kullaniciya ne oldugu soylenir', beklenen:true, cikan:alerts.some(a=>/arşiv/i.test(a))});
  // Arsivden geri alarak sinir asilamaz
  var r3b = await p.evaluate(h=>{S.habits=h;sv();unarchiveH('ar');
    return S.habits.filter(x=>!x.archived).length},
    [1,2,3,4,5,6,7,8].map(i=>hb('a'+i,'Aktif '+i)).concat([hb('ar','Arsivli',{archived:true})]));
  res.push({t:'SINIR: arsivden geri alma siniri asamaz', beklenen:8, cikan:r3b});

  // Gelen arsivli aliskanliklar sinira sayilmaz
  var r3c = await importMerge(six, {habits:[hb('g1','Eski',{archived:true}),hb('g2','Yeni A'),hb('g3','Yeni B')]});
  res.push({t:'SINIR: arsivli gelen yer kaplamaz', beklenen:8, cikan:r3c.active});
  res.push({t:'SINIR: arsivli gelen arsivde kalir', beklenen:true, cikan:(byName(r3c,'Eski')||{}).archived});

  // --- 4. Onceden bozulmus veri acilista onarilir ---
  await p.evaluate(()=>{
    var d=JSON.parse(localStorage.getItem(SK));
    d.habits=[{id:'dup',name:'Birinci',type:'gain',targetDays:30,color:'#8ee4c8',createdAt:'2026-09-01',days:{},round:1},
              {id:'dup',name:'Ikinci',type:'gain',targetDays:30,color:'#8ee4c8',createdAt:'2026-09-01',days:{},round:1}];
    localStorage.setItem(SK,JSON.stringify(d));
  });
  await p.reload(); await p.waitForTimeout(1500);
  var r4 = await p.evaluate(()=>({ids:S.habits.map(h=>h.id), ok:S.habits.every(h=>fH(h.id)===h),
    saved:JSON.parse(localStorage.getItem(SK)).habits.map(h=>h.id)}));
  res.push({t:'ONARIM: acilista cakisan kimlik ayrilir', beklenen:true, cikan:r4.ok});
  res.push({t:'ONARIM: ilki kimligini korur', beklenen:'dup', cikan:r4.ids[0]});
  res.push({t:'ONARIM: onarim kaydedilir', beklenen:true, cikan:new Set(r4.saved).size===2});

  // --- 5. REGRESYON ---
  var r5 = await importMerge([hb('k1','Kitap')],
    {habits:[hb('k9','kitap'),hb('z1','Meditasyon')],milestones:{'ms_z1_7_1':true}});
  res.push({t:'REG ayni adli aliskanlik atlanir', beklenen:'Kitap,Meditasyon', cikan:r5.habits.map(h=>h.name).join(',')});
  res.push({t:'REG cakisma yoksa kimlik korunur', beklenen:'z1', cikan:(byName(r5,'Meditasyon')||{}).id});
  res.push({t:'REG cakisma yoksa kilometre tasi korunur', beklenen:true, cikan:r5.ms['ms_z1_7_1']});
  res.push({t:'REG atlanan aliskanligin kilometre tasi gelmez', beklenen:0,
            cikan:Object.keys(r5.ms).filter(k=>k.indexOf('ms_k9_')===0).length});

  fs.rmSync(tmp,{recursive:true,force:true});
  const e = errs.join(' | ')||'(yok)';
  await b.close();
  return {out:res, errs:e};
};
(async()=>{
  const url = process.argv[2] || (process.env.HALKA_URL || 'file://'+require('path').resolve(__dirname,'..','index.html'));
  const {out,errs} = await run(url);
  let fail=0;
  for(const r of out){const ok=String(r.beklenen)===String(r.cikan); if(!ok)fail++;
    console.log((ok?'GECTI ':'KALDI ')+r.t+'  beklenen="'+r.beklenen+'" cikan="'+r.cikan+'"');}
  console.log('\nSonuc: '+(out.length-fail)+'/'+out.length+' gecti');
  console.log('Sayfa hatasi:', errs);
  process.exit(fail?1:0);
})();
