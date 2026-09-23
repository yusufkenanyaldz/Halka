// Kontrast denetimi: sayfadaki gorunur her metin icin yazi rengi ile gercek
// zemin arasindaki WCAG kontrast oranini hesaplar.
//
// Zemin: ogeden yukari cikilarak arka plan renkleri alttan uste birlestirilir
// (yari saydam katmanlar dahil). Ata ogelerin opacity'si yazinin rengini zemine
// dogru soldurur, o da hesaba katilir. Degrade zeminde ve degrade yazida
// (-webkit-text-fill-color: transparent) her renk duragi ayri olculur, en kotusu alinir.
// Resim (url) zeminler olculemez, "belirsiz" sayilir.
//
// Esik (WCAG AA): normal yazi 4.5, buyuk yazi (>=24px ya da >=18.66px ve kalin) 3.0.
// sayfaya enjekte edilir: page.evaluate(KONTRAST_DENETIM)
const KONTRAST_DENETIM = () => {
  function parse(c){
    var m=c&&c.match(/rgba?\(([^)]+)\)/); if(!m)return null;
    var p=m[1].split(/[ ,\/]+/).filter(Boolean).map(parseFloat);
    return {r:p[0],g:p[1],b:p[2],a:p.length>3?p[3]:1};
  }
  function over(top,bot){   // top'u bot uzerine bindir (bot opak)
    var a=top.a; return {r:top.r*a+bot.r*(1-a),g:top.g*a+bot.g*(1-a),b:top.b*a+bot.b*(1-a),a:1};
  }
  // "linear-gradient(135deg, rgb(..), rgba(..))" -> renk duraklari
  function duraklar(img){
    if(!img||img==='none'||/url\(/.test(img))return null;
    var m=img.match(/rgba?\([^)]+\)/g); return m?m.map(parse):null;
  }
  function lum(c){var f=function(v){v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)};return 0.2126*f(c.r)+0.7152*f(c.g)+0.0722*f(c.b)}
  function oran(a,b){var x=lum(a),y=lum(b);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05)}
  function gorunur(el){
    var r=el.getBoundingClientRect(); if(r.width<1||r.height<1)return false;
    if(r.bottom<0||r.top>innerHeight||r.right<0||r.left>innerWidth)return false;
    for(var e=el;e&&e!==document.documentElement;e=e.parentElement){
      var s=getComputedStyle(e); if(s.display==='none'||s.visibility==='hidden'||parseFloat(s.opacity)===0)return false;
    }
    // Ustune baska bir katman binmis mi (orn. kapali kutlama katmani degil, acik bir pencere)
    var cx=Math.min(Math.max(r.left+Math.min(r.width,20)/2,0),innerWidth-1), cy=Math.min(Math.max(r.top+r.height/2,0),innerHeight-1);
    var ust=document.elementFromPoint(cx,cy); if(ust&&!el.contains(ust)&&!ust.contains(el))return false;
    return true;
  }
  var sonuc=[], belirsiz=0;
  var yuruyen=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  var goruldu=new Set();
  // Ayni ekranin farkli kaydirma konumlarinda ayni oge bir kez sayilir (metne gore
  // degil: takvimde "12" gibi ayni metin bircok ogede gecer). window.__kdGoruldu
  // ekran degisince sifirlanir.
  if(!window.__kdGoruldu)window.__kdGoruldu=new WeakSet();
  while(yuruyen.nextNode()){
    var t=yuruyen.currentNode; if(!t.textContent.trim())continue;
    var el=t.parentElement; if(!el||goruldu.has(el))continue; goruldu.add(el);
    if(/^(SCRIPT|STYLE|NOSCRIPT)$/.test(el.tagName))continue;
    if(window.__kdGoruldu.has(el))continue;
    if(!gorunur(el))continue;
    window.__kdGoruldu.add(el);
    var s=getComputedStyle(el);
    var renkler;
    if(s.webkitTextFillColor&&/rgba\(0, 0, 0, 0\)|transparent/.test(s.webkitTextFillColor)){
      renkler=duraklar(s.backgroundImage); if(!renkler){belirsiz++;continue}
    } else { var rk=parse(s.color); if(!rk)continue; renkler=[rk]; }
    // zemin: yukari dogru katmanlari topla
    var katman=[], opak=null, degrade=null, op=1;
    var er=el.getBoundingClientRect(), mx=er.left+er.width/2, my=er.top+er.height/2;
    for(var e=el;e;e=e.parentElement){
      var es=getComputedStyle(e);
      op*=parseFloat(es.opacity);
      // Mutlak konumla atasinin kutusundan tasan metin (orn. cubugun altindaki gun
      // etiketi) o atanin zemininin uzerinde degildir; zeminini sayma.
      if(e!==el&&e!==document.body&&e!==document.documentElement){
        var ar=e.getBoundingClientRect();
        if(mx<ar.left||mx>ar.right||my<ar.top||my>ar.bottom)continue;
      }
      // Degrade zemin: yazi kendisi degradeyse (background-clip:text) o zemin degil
      var yaziDegrade=(e===el&&renkler.length>1);
      if(!yaziDegrade&&es.backgroundImage&&es.backgroundImage!=='none'){
        var d=duraklar(es.backgroundImage); if(!d){degrade='resim';break}
        if(d.every(function(x){return x.a>=1})){degrade=d;break}
      }
      var bg=yaziDegrade?null:parse(es.backgroundColor);
      if(bg&&bg.a>0){ if(bg.a>=1){opak=bg;break} katman.push(bg); }
    }
    if(degrade==='resim'){belirsiz++;continue}
    var tabanlar=Array.isArray(degrade)?degrade:[opak||parse(getComputedStyle(document.body).backgroundColor)||{r:255,g:255,b:255,a:1}];
    var o=Infinity;
    tabanlar.forEach(function(taban){
      if(taban.a<1)taban=over(taban,{r:255,g:255,b:255,a:1});
      var zemin=taban; for(var i=katman.length-1;i>=0;i--)zemin=over(katman[i],zemin);
      renkler.forEach(function(renk){
        var yazi=over({r:renk.r,g:renk.g,b:renk.b,a:renk.a*op},zemin);
        o=Math.min(o,oran(yazi,zemin));
      });
    });
    var px=parseFloat(s.fontSize), kalin=parseInt(s.fontWeight)>=700;
    var buyuk=px>=24||(px>=18.66&&kalin), esik=buyuk?3:4.5;
    sonuc.push({metin:t.textContent.trim().slice(0,40), oran:Math.round(o*100)/100, esik:esik,
      kalir:o<esik, renk:renkler.length>1?'degrade':s.color, sinif:(el.className&&el.className.baseVal===undefined?el.className:'')||el.tagName});
  }
  return {toplam:sonuc.length, belirsiz:belirsiz, kalanlar:sonuc.filter(function(x){return x.kalir}).sort(function(a,b){return a.oran-b.oran})};
};
module.exports = { KONTRAST_DENETIM };
