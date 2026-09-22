// Uygulama simgelerini uretir: icons/halka.svg (kaynak) ve PNG'ler.
// Kullanim: PLAYWRIGHT_PATH=/opt/node22/lib/node_modules/playwright node araclar/simge_uret.js
// Halkalar uygulamadaki renklerle: dista lavanta, ortada gok, icte nane.
const fs=require('fs'), path=require('path');
const OUT=path.resolve(__dirname,'..','icons');

// maskable: Android simgeyi daireye/damla bicimine kirpar; icerik ortadaki
// %80'lik guvenli alanda kalmali, arka plan kenara kadar dolu olmali.
function svg(maskable){
  const s=512, c=256, k=maskable?0.72:1;           // guvenli alana sigdirma orani
  const rings=[{r:176,w:34,col:'#b8a5f0',pay:.78},{r:120,w:34,col:'#8ec5f0',pay:.62},{r:64,w:34,col:'#8ee4c8',pay:.88}];
  let g='';
  rings.forEach(o=>{
    const r=o.r*k, w=o.w*k, L=2*Math.PI*r;
    g+=`<circle cx="${c}" cy="${c}" r="${r.toFixed(1)}" fill="none" stroke="${o.col}" stroke-opacity=".14" stroke-width="${w.toFixed(1)}"/>`;
    g+=`<circle cx="${c}" cy="${c}" r="${r.toFixed(1)}" fill="none" stroke="${o.col}" stroke-width="${w.toFixed(1)}" stroke-linecap="round" stroke-dasharray="${(L*o.pay).toFixed(1)} ${L.toFixed(1)}" transform="rotate(-90 ${c} ${c})"/>`;
  });
  const bg=maskable?`<rect width="${s}" height="${s}" fill="#0e0e1a"/>`:`<rect width="${s}" height="${s}" rx="112" fill="#0e0e1a"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}" width="${s}" height="${s}">${bg}${g}</svg>`;
}

(async()=>{
  const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
  fs.writeFileSync(path.join(OUT,'halka.svg'), svg(false)+'\n');
  const b=await chromium.launch();
  const jobs=[['halka-192.png',192,false],['halka-512.png',512,false],['halka-maskable-512.png',512,true],['apple-touch-icon.png',180,true]];
  for(const [ad,px,mask] of jobs){
    const p=await b.newPage({viewport:{width:px,height:px}});
    await p.setContent(`<html><body style="margin:0;background:transparent">${svg(mask).replace('width="512" height="512"',`width="${px}" height="${px}"`)}</body></html>`);
    await p.screenshot({path:path.join(OUT,ad), omitBackground:true});
    await p.close();
    console.log('yazildi', ad, px+'x'+px);
  }
  await b.close();
})();
