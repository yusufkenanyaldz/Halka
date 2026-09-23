// Uzun aliskanlik adi hicbir ekranda duzeni bozmasin.
// Butun ekranlari (tests/ekranlar.js) 320/360/412px'te gezer; metni tam olarak
// uzun ad olan her ogeyi olcer:
//  - en cok 1 satir (tasarim geregi izin verilen yerde data-satir="N", orn. ayrinti basligi 2)
//  - kisaltildiysa ("...") tam ad title ile okunur (oge ya da 3 kusaga kadar atasi)
// Ayrica: istatistik satirinda renk noktasi ezilmez, halka aciklamasinda her oge tek satir
// ve son satir disinda hicbir satirda tek oge kalmaz.
const path=require('path');
const { gez } = require('./ekranlar.js');
const UZUN='Her sabah yirmi dakika meditasyon ve nefes egzersizi';
const AYRINTI=process.argv.includes('--ayrinti');

const DENETIM = (() => {
  var UZUN='Her sabah yirmi dakika meditasyon ve nefes egzersizi';
  if(!window.__kdGoruldu)window.__kdGoruldu=new WeakSet();
  function satir(t){var r=document.createRange();r.selectNodeContents(t);var u=[];[].forEach.call(r.getClientRects(),function(q){if(q.width<1)return;var y=Math.round(q.top);if(!u.some(function(v){return Math.abs(v-y)<4}))u.push(y)});return u}
  var kalanlar=[], w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  while(w.nextNode()){
    var t=w.currentNode, m=t.textContent.replace(/\s+/g,' ').trim(); if(m!==UZUN)continue;
    var el=t.parentElement; if(!el||window.__kdGoruldu.has(el))continue;
    var r=el.getBoundingClientRect(); if(r.width<1||r.height<1||r.bottom<0||r.top>innerHeight)continue;
    var gizli=false;for(var e=el;e&&e!==document.body;e=e.parentElement){var cs=getComputedStyle(e);if(cs.display==='none'||cs.visibility==='hidden'){gizli=true;break}}
    if(gizli)continue;
    window.__kdGoruldu.add(el);
    var s=getComputedStyle(el), izin=el.closest('[data-satir]'), en=izin?parseInt(izin.getAttribute('data-satir'))||1:1;
    // Gorunen satir: ogenin (ya da kirpan atanin) kutusu icindekiler
    var kutu=el.getBoundingClientRect(), n=satir(t).filter(function(y){return y>=kutu.top-2&&y<kutu.bottom-4}).length;
    var sinif=(typeof el.className==='string'&&el.className)||el.tagName;
    if(n>en)kalanlar.push({tur:'satir',sinif:sinif,ayrinti:n+' satir (izin '+en+')'});
    var kisa=(s.textOverflow==='ellipsis'&&el.scrollWidth>el.clientWidth+1)||(s.webkitLineClamp&&s.webkitLineClamp!=='none'&&el.scrollHeight>el.clientHeight+1);
    if(kisa){var tt='';for(var a=el,i=0;a&&i<4;a=a.parentElement,i++){if(a.getAttribute&&a.getAttribute('title')){tt=a.getAttribute('title');break}}
      if(tt!==UZUN)kalanlar.push({tur:'title',sinif:sinif,ayrinti:'kisaltilmis, title="'+tt+'"'})}
  }
  // Istatistik satiri renk noktasi (10x10 tasarlanmis)
  document.querySelectorAll('.screen.active .sc-nokta').forEach(function(d){var q=d.getBoundingClientRect();if(q.width&&(Math.round(q.width)<10||Math.round(q.height)<10))kalanlar.push({tur:'nokta',sinif:'sc-nokta',ayrinti:Math.round(q.width)+'x'+Math.round(q.height)})});
  // Halka aciklamasi: her oge tek satir
  document.querySelectorAll('.screen.active .rl-i').forEach(function(i){var q=i.getBoundingClientRect();if(q.height>22&&q.width)kalanlar.push({tur:'aciklama',sinif:'rl-i',ayrinti:'"'+i.textContent.trim().slice(0,20)+'" '+Math.round(q.height)+'px yuksek'})});
  // Halka aciklamasi: son satir disinda tek basina kalan oge olmasin (uzun ad
  // yuzunden "Spor" bir satirda yalniz kaliyordu)
  document.querySelectorAll('.screen.active .ring-leg').forEach(function(L){
    var it=[].slice.call(L.querySelectorAll('.rl-i')).filter(function(i){return i.getBoundingClientRect().width>0});if(it.length<2)return;
    var sat={};it.forEach(function(i){var y=Math.round(i.getBoundingClientRect().top/4);sat[y]=(sat[y]||[]).concat(i.textContent.trim().slice(0,12))});
    var ys=Object.keys(sat).map(Number).sort(function(a,b){return a-b});
    ys.slice(0,-1).forEach(function(y){if(sat[y].length<2)kalanlar.push({tur:'aciklama',sinif:'ring-leg',ayrinti:'"'+sat[y][0]+'" satirda yalniz'})});
  });
  return {kalanlar:kalanlar};
});

(async()=>{
  const url = process.argv.slice(2).find(a=>/^(file|https?):/.test(a)) || (process.env.HALKA_URL || 'file://'+path.resolve(__dirname,'..','index.html'));
  let fail=0; const satirlar=[]; const hatalar=[];
  for(const g of [320,360,412]){
    const {ekranlar,errs}=await gez(url,{tema:'dark',genislik:g,yukseklik:800},DENETIM);
    errs.forEach(e=>hatalar.push(e));
    for(const [ad,r] of Object.entries(ekranlar)){
      const ok=r.kalanlar.length===0; if(!ok)fail++;
      satirlar.push((ok?'GECTI ':'KALDI ')+g+'px '+ad+': uzun ad duzeni bozmaz  beklenen="0" cikan="'+r.kalanlar.length+'"'+(r.kalanlar.length?'  '+r.kalanlar.slice(0,3).map(k=>k.tur+' .'+String(k.sinif).split(' ')[0]+' '+k.ayrinti).join(', '):''));
    }
  }
  if(hatalar.length){fail++;satirlar.push('KALDI sayfa hatasi: '+hatalar.join(' | '))}
  satirlar.forEach(s=>{if(AYRINTI||s.startsWith('KALDI'))console.log(s)});
  const n=satirlar.length;
  console.log('\nSonuc: '+(n-fail)+'/'+n+' gecti');
  console.log('Sayfa hatasi:', hatalar.join(' | ')||'(yok)');
  process.exit(fail?1:0);
})();
