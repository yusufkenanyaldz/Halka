// Tasma denetimi: dar ekranda metnin bozuldugu uc durum.
//  kirpik  : metin kutusundan tasiyor ve gorunmeden kesiliyor (overflow:hidden),
//            ama kasitli "..." kisaltmasi degil (text-overflow:ellipsis olanlar sayilmaz)
//  bolunmus: en fazla 3 kelimelik kisa bir etiket birden cok satira bolunmus
//            ("4 / gun / seri" gibi). Tasarim geregi cok satira izin verilen oge
//            ya da atasi data-satir="N" tasir (orn. rozet adi: 2); o sinira kadar sayilmaz.
//  yertutucu: giris kutusunun aciklama metni (placeholder) kutuya sigmiyor
// Yatay kaydirilan satirlar (overflow-x:auto/scroll) kirpik sayilmaz.
// sayfaya enjekte edilir: page.evaluate(TASMA_DENETIM)
const TASMA_DENETIM = () => {
  if(!window.__kdGoruldu)window.__kdGoruldu=new WeakSet();
  function gorunur(el){
    var r=el.getBoundingClientRect(); if(r.width<1||r.height<1)return false;
    if(r.bottom<0||r.top>innerHeight||r.right<0||r.left>innerWidth)return false;
    for(var e=el;e&&e!==document.documentElement;e=e.parentElement){
      var s=getComputedStyle(e); if(s.display==='none'||s.visibility==='hidden'||parseFloat(s.opacity)===0)return false;
    }
    var cx=Math.min(Math.max(r.left+Math.min(r.width,20)/2,0),innerWidth-1), cy=Math.min(Math.max(r.top+r.height/2,0),innerHeight-1);
    var ust=document.elementFromPoint(cx,cy); if(ust&&!el.contains(ust)&&!ust.contains(el))return false;
    return true;
  }
  function kirpan(el){
    // metni kesen ilk ata: overflow hidden/clip ve metin onun kutusundan tasiyor
    var s=getComputedStyle(el);
    if(/hidden|clip/.test(s.overflowX)&&s.textOverflow!=='ellipsis'&&el.scrollWidth>el.clientWidth+1)return el;
    var r=el.getBoundingClientRect();
    for(var e=el.parentElement;e&&e!==document.body;e=e.parentElement){
      var es=getComputedStyle(e);
      if(/auto|scroll/.test(es.overflowX))return null;          // kaydirilabilir: kesilmiyor
      if(/hidden|clip/.test(es.overflowX)){
        var ar=e.getBoundingClientRect();
        if(r.right>ar.right+1||r.left<ar.left-1)return e;
        return null;
      }
    }
    return null;
  }
  function satirSayisi(t){
    var rg=document.createRange(); rg.selectNodeContents(t);
    var ust=[]; [].forEach.call(rg.getClientRects(),function(q){if(q.width<1)return;var y=Math.round(q.top);if(!ust.some(function(u){return Math.abs(u-y)<3}))ust.push(y)});
    return ust.length;
  }
  var kalanlar=[], toplam=0;
  var yuruyen=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  while(yuruyen.nextNode()){
    var t=yuruyen.currentNode, metin=t.textContent.replace(/\s+/g,' ').trim(); if(!metin)continue;
    var el=t.parentElement; if(!el||/^(SCRIPT|STYLE|NOSCRIPT|OPTION)$/.test(el.tagName))continue;
    if(window.__kdGoruldu.has(t))continue;
    if(!gorunur(el))continue;
    window.__kdGoruldu.add(t); toplam++;
    var sinif=(typeof el.className==='string'&&el.className)||el.tagName;
    var k=kirpan(el);
    if(k){kalanlar.push({tur:'kirpik',metin:metin.slice(0,40),sinif:sinif,ayrinti:'kutu '+Math.round(k.clientWidth||k.getBoundingClientRect().width)+'px, metin '+k.scrollWidth+'px'});continue}
    var kelime=metin.split(' ').length;
    if(kelime<=3&&metin.length>=2){
      var n=satirSayisi(t), izin=el.closest('[data-satir]'), en=izin?parseInt(izin.getAttribute('data-satir'))||1:1;
      if(n>en)kalanlar.push({tur:'bolunmus',metin:metin.slice(0,40),sinif:sinif,ayrinti:n+' satir'+(izin?' (izin '+en+')':'')});
    }
  }
  // Yer tutucular
  var cv=document.createElement('canvas').getContext('2d');
  document.querySelectorAll('input[placeholder],textarea[placeholder]').forEach(function(f){
    if(window.__kdGoruldu.has(f)||!f.placeholder||f.value||!gorunur(f))return;
    window.__kdGoruldu.add(f); toplam++;
    var s=getComputedStyle(f); cv.font=s.fontStyle+' '+s.fontWeight+' '+s.fontSize+' '+s.fontFamily;
    var gen=f.clientWidth-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight);
    if(f.tagName==='INPUT'){
      var w=cv.measureText(f.placeholder).width;
      if(w>gen+1)kalanlar.push({tur:'yertutucu',metin:f.placeholder.slice(0,40),sinif:f.id||f.className,ayrinti:'kutu '+Math.round(gen)+'px, metin '+Math.round(w)+'px'});
    } else {
      // kelime kelime satira dok, satir yuksekligiyle karsilastir
      var satir=1, cur=0; f.placeholder.split(/\s+/).forEach(function(k){var kw=cv.measureText((cur?' ':'')+k).width;if(cur+kw>gen&&cur>0){satir++;cur=cv.measureText(k).width}else cur+=kw});
      var lh=parseFloat(s.lineHeight)||parseFloat(s.fontSize)*1.2;
      var yuk=f.clientHeight-parseFloat(s.paddingTop)-parseFloat(s.paddingBottom);
      if(satir*lh>yuk+1)kalanlar.push({tur:'yertutucu',metin:f.placeholder.slice(0,40),sinif:f.id||f.className,ayrinti:satir+' satir gerekiyor, '+Math.floor(yuk/lh)+' sigiyor'});
    }
  });
  return {toplam:toplam, kalanlar:kalanlar};
};
module.exports = { TASMA_DENETIM };
