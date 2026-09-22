// Halka servis calisani: uygulama kabugunu onbellege alir, cevrimdisi acilir.
//
// index.html: once ag (AG_SURE icinde cevap gelmezse onbellek). Boylece
// cevrimiciyken yeni surum hemen gelir, SURUM'u artirmak gerekmez.
// Diger kabuk dosyalari (yazi tipi, simge, manifest): once onbellek.
// Bunlardan biri degisirse SURUM'u artir, yoksa eskisi kullanilmaya devam eder.
// Baska kaynaklara (Firebase vb.) karisilmaz, tarayici normal yolla ister.
var SURUM='halka-kabuk-1';
var AG_SURE=4000;
var KABUK=[
  'index.html',
  'manifest.webmanifest',
  'fonts/dm-sans-latin-wght-normal.woff2',
  'fonts/dm-sans-latin-ext-wght-normal.woff2',
  'fonts/playfair-display-latin-wght-normal.woff2',
  'fonts/playfair-display-latin-ext-wght-normal.woff2',
  'icons/halka-192.png',
  'icons/halka-512.png',
  'icons/halka-maskable-512.png',
  'icons/apple-touch-icon.png'
];

self.addEventListener('install',function(e){
  e.waitUntil(caches.open(SURUM).then(function(c){return c.addAll(KABUK)}).then(function(){return self.skipWaiting()}));
});

self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.filter(function(k){return k.indexOf('halka-kabuk-')===0&&k!==SURUM}).map(function(k){return caches.delete(k)}));
  }).then(function(){return self.clients.claim()}));
});

function sayfaMi(req){
  if(req.mode==='navigate')return true;
  var p=new URL(req.url).pathname;
  return /\/(index\.html)?$/.test(p);
}

// Once ag; ag hata verirse ya da AG_SURE'de cevap gelmezse onbellekteki index.html
function sayfa(req){
  var agdan=fetch(req).then(function(res){
    if(res&&res.ok){var kopya=res.clone();caches.open(SURUM).then(function(c){c.put('index.html',kopya)})}
    return res;
  });
  var yedek=function(){return caches.open(SURUM).then(function(c){return c.match('index.html')})};
  return new Promise(function(coz,red){
    var bitti=false;
    var t=setTimeout(function(){yedek().then(function(r){if(r&&!bitti){bitti=true;coz(r)}})},AG_SURE);
    agdan.then(function(res){clearTimeout(t);if(!bitti){bitti=true;coz(res)}})
      .catch(function(err){clearTimeout(t);yedek().then(function(r){if(bitti)return;bitti=true;if(r)coz(r);else red(err)})});
  });
}

self.addEventListener('fetch',function(e){
  var req=e.request;
  if(req.method!=='GET')return;
  if(new URL(req.url).origin!==self.location.origin)return;
  if(sayfaMi(req)){e.respondWith(sayfa(req));return}
  e.respondWith(caches.open(SURUM).then(function(c){
    return c.match(req,{ignoreSearch:true}).then(function(r){return r||fetch(req)});
  }));
});
