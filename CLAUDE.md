# Halka

Alışkanlık takip uygulaması. Kodun tamamı tek dosyada: `index.html` (HTML + CSS + JS,
derleme adımı yok). Tarayıcıda dosyayı açarak çalışır. Android'de `HalkaBridge` adlı bir JS köprüsü varsa
bildirim ve widget özellikleri devreye girer, yoksa sessizce atlanır.

## Yapı

Her şey `index.html` içinde:
- `<style>` bölümü: tema değişkenleri `:root` altında, açık tema `body.light` ile
- `<body>`: ekranlar `.screen` sınıfıyla, `goScreen()` ile değiştirilir
  - Ayarların alt görünümleri (widget, oda kur/katıl/paylaş) `#seBox` içine çizilir.
    Yeni bir alt görünüm `setAltAc('ad')` ile başlasın, başlığı `setAltBaslik(...)` olsun,
    kapatan her düğme `setAltKapat()` çağırsın; Android geri tuşu da buradan geçer.
- `<script>`: önce Firebase/oda kodu, sonra ana uygulama

`android/` — Android Studio projesi (Java, AndroidX yok). `index.html`'i WebView'da açar;
derlemede web dosyaları deponun kökünden kopyalanır, yani `index.html` değişince Android'e
ayrıca kopyalamak gerekmez. Kurulum rehberi `android/BENIOKU.md` (kullanıcı için, adım adım).

Yanındaki dosyalar (kod değil, varlık):
- `fonts/` — DM Sans ve Playfair Display, `@font-face` ile `index.html` başında.
- `icons/`, `manifest.webmanifest` — telefona kurulum. Simgeler `araclar/simge_uret.js` ile üretilir.
- `sw.js` — servis çalışanı, çevrimdışı açılış. Yalnız http(s) altında kaydolur;
  `file://` ile açınca atlanır. `index.html` önce ağdan gelir, sürüm artırmak gerekmez.
  **Yazı tipi, simge ya da manifest değişirse `sw.js`'deki `SURUM`'u artır**, yoksa
  kullanıcıda eskisi kalır. Yeni bir kabuk dosyası eklersen `KABUK` listesine de yaz.

Veri `localStorage`'da tek anahtarda tutulur (`halka_v2`), `S` global nesnesi.
Oda (partner) özelliği Firebase Realtime Database kullanır.

## Veri modeli — dikkat edilecek nokta

Bir alışkanlığın hedefi tamamlanınca **tur kapanır**: o turun günleri
`h.history` içine taşınır ve `h.days` sıfırlanır. Bu yüzden:

- **Tur bazlı** şeyler `cD(h)` / `h.days` okur: hedef yüzdesi, "x/hedef" sayacı, tur takvimi.
- **Ömür boyu** şeyler `cDAll(h)` / `dayState(h, tarih)` okur: seri, puan,
  toplam tamamlanan, haftalık grafikler, haftalık özet.

Yeni bir yer eklerken hangisi olduğuna karar ver. Doğrudan `h.days[tarih]` okumak
neredeyse her zaman hatadır — tur kapanınca o veri orada olmaz. **Bugünün durumu**
da buna dahil: kartta, sayaçta, widget'ta hep `dayState(h, td())` oku.

Turu kapatan gün eski tura aittir. `closeC()` bugün eski turda işaretliyse yeni turu
**yarın** başlatır (`h.createdAt` yarın olur). O gün `td() < h.createdAt` doğrudur;
`mkDn`/`mkMs`/`undoDn`/`widgetComplete` bu durumda yazmaz. Yazmalar (`h.days[td()]=...`)
her zaman içinde bulunulan tura gider.

Yüzde her yerde **ilerlemedir**, iki türde de (`pctOf(cD(h), h.targetDays)`); bırakma
türünde halka boştan dolar. "Kalan gün" yalnız etikette yazılır. Partnere giden veride
`pctTur:'ilerleme'` vardır; bu işaret olmayan bırakma yüzdesi eski sürümdendir (kalan).

Yardımcılar (hepsi `index.html` içinde, `cD`'nin yakınında):
- `dayState(h, tarih)` — günün durumu, geçmiş turlar dahil
- `cDAll(h)` — tüm turlardaki benzersiz "done" gün sayısı
- `hStart(h)` — alışkanlığın ilk turunun başlangıç tarihi
- `pctOf(pay, payda)` — 0-100 arası tamsayı yüzde
- `enUzunSeri(h)` — ömür boyu en uzun seri (rekor); "En uzun seri" ve seri rozetleri. Şu anki seri `cS(h)`
- `bugunGerekli(h)` — bugün yapılması gerekiyor mu (duraklatılmamış, bugün programında).
  Günlük "x/y", "Bugünü tamamladın", widget ve partner özeti bununla sayar
- `checkGoals()` — hedefe ulaşıldı mı; `renderMain()` sonunda çağrılır

## Test

```bash
bash tests/calistir.sh            # uygulama testleri (32 takım, 921 senaryo)
bash tests/calistir.sh firebase   # Firebase güvenlik kuralları (59 senaryo)
bash tests/calistir.sh android    # android/: XML, kaynak bağlantıları, Java derlemesi, hatırlatıcı
```

Bu ortamda Android SDK (`dl.google.com`) kapalı: APK derlenemez. `android` kipi Java'yı
Robolectric'in `android-all` (Android 14 sınıfları, Maven Central) paketine karşı derler,
sahte `R` sınıfını kaynaklardan üretir ve eksik kaynak bağlantısını yakalar. XML yorumunda
`--` yasaktır (bir kez derlemeyi bozuyordu).

Testler Playwright ile gerçek tarayıcıda çalışır. Playwright genel kurulumdaysa:
`PLAYWRIGHT_PATH=/opt/node22/lib/node_modules/playwright bash tests/calistir.sh`

Firebase testleri `firebase-tools`'u ilk çalıştırmada kendisi kurar ve yerel
öykünücüde çalışır, gerçek veritabanına dokunmaz.

### Test yazarken düşülen tuzaklar

Bunların hepsi bu depoda gerçekten yaşandı:

1. **Öykünücü ad alanı.** Kurallar `halka-d6595-default-rtdb` ad alanına yüklenir.
   Başka bir `ns` kullanırsan öykünücü kuralsız yeni bir ad alanı açar ve testler
   sahte geçer.
2. **Kimlik taklidi.** `auth_variable_override` tek başına yetmez, istek kimliksiz
   sayılır. `Authorization: Bearer owner` başlığıyla birlikte gönderilmeli.
   Yalnız `owner` ise kuralları tamamen atlar, onu sadece kurulum verisinde kullan.
3. **localStorage'ı taklit etme.** `setItem`/`getItem` `Storage.prototype` üzerinde;
   `localStorage` nesnesi üzerinden gölgelenmez, prototipi değiştir.
4. **Joker (freeze) özelliği.** `autoMiss()` işaretsiz bir geçmiş günü haftalık joker
   hakkıyla "done" yapabilir. Test kurgusunda boşluk bırakırsan sayılar kayar;
   `h.createdAt`'i ilk işaretli güne eşitle ya da `h.freezeUsed` ile o günü kapat.
5. **Sayfa `load` olayını bekleme.** Firebase betikleri dinamik ekleniyor; asılı
   kalan bir betik `load`'u bekletir. Firebase CDN'lerini taklit eden testlerde
   `goto(url,{waitUntil:'domcontentloaded'})` kullan (bkz. `tests/test_fbload.js`).
   Günler geçince olan hatalar için saati `page.clock.setFixedTime` ile ilerlet ve sayfayı
   yenile; veriyi geriye kaydırarak taklit etmek `autoMiss`'in gerçek yolunu atlayabilir
   (bkz. `tests/test_turkapanis.js`).
6. **`elementFromPoint` `pointer-events:none` öğeyi görmez.** Boyama sırasını
   ölçüyorsan (ör. konfeti yazının üstünde mi) o öğeye geçici olarak
   `pointer-events:auto` ver; yoksa ölçüm boşuna geçer (bkz. `tests/test_kutlama.js`).
7. **Çevrimdışını `setOffline` ile taklit etme.** Servis çalışanının isteklerini her
   zaman kesmiyor, test sahte geçer. `tests/test_offline.js` yerel sunucuyu gerçekten
   kapatıyor; zayıf şebeke için isteği cevapsız bırakıyor.
8. **Düzeneği sına.** Kuralları kasten açıp testlerin kırmızıya döndüğünü gör.
   Geçen bir test, bir şey ölçtüğünü kanıtlamaz.

## Android köprüsü (`HalkaBridge`)

Android tarafı `@JavascriptInterface` ile şu metotları sunar; hepsi isteğe bağlı,
yoksa JS sessizce atlar. **Java metodu argüman sayısıyla eşleşir**: bir metoda
argüman eklemek yerine yeni adla yeni metot aç, JS varlığını denetlesin.

| Metot | Ne zaman |
|---|---|
| `scheduleReminderDays(id, ad, "SS:DD", mesaj, gunlerJson)` | Hatırlatıcı kur. `gunlerJson` ISO gün numaraları: `"[1,2,3,4,5]"` = Pzt–Cum (1=Pzt … 7=Paz, `java.time.DayOfWeek` ile aynı). Aynı `id` ile gelirse eskisinin yerine geçer. |
| `scheduleReminder(id, ad, "SS:DD", mesaj)` | Eski köprü; `scheduleReminderDays` yoksa kullanılır, günleri bilmez (her gün çalar). |
| `cancelReminder(id)` | Alarmı kaldır. Olmayan bir `id` için de güvenle çağrılabilmeli. |
| `requestNotificationPermission()` | Yalnız kullanıcı saat kurduğunda çağrılır. |
| `testNotification(ad, mesaj)` | Ayrıntı ekranındaki test düğmesi. |
| `updateWidget(json)` | Widget verisi. |
| `getStatusBarHeight()` / `setLightStatusBar(bool)` | Durum çubuğu (dp). |
| `saveFile(ad, icerik)` | Yedek dosyası (`expD`). Dönüş: kaydedilen yer, `"bekle"` (kullanıcı konum seçiyor, sonucu Android `toast` ile bildirir) ya da `""` (hata). Yoksa JS `blob:` indirmeyi dener (WebView'da çalışmaz). |

Uygulama (`android/`) bunların hepsini `HalkaKopru` sınıfında sunar. Köprü varken servis
çalışanı kaydedilmez (dosyalar zaten cihazda). Widget'tan tamamlama: Android uygulamayı
açar ve `widgetComplete(id, td())` çağırır.

**Geri tuşu (Android → JS):** `onBackPressed` içinde
`webView.evaluateJavascript("handleBack()") { v -> if (v == "false") finish() }`.
`handleBack()` önce açık katmanı kapatır (davet, kilometre taşı, kutlama), sonra ayarların
alt görünümünü, tanıtım adımlarını, ekran geçmişini; geri alınacak bir şey yoksa `false`
döner. Yeni bir katman ya da alt adım eklersen buraya da ekle (`tests/test_geritusu.js`).

Hatırlatıcı kuralı (`remActive`): saati var, arşivde değil, duraklatılmamış. Uygulama
her açılışta bütün alarmları bu kurala göre eşitler (`syncNotif`), yani Android
tarafının açılışlar arasında alarm tutması yeterli; JS fazlasını iptal eder.
Alışkanlığın durumunu değiştiren yeni bir yer eklersen `syncNotif(h,true)` çağır.

## Firebase

Proje `halka-d6595`, Realtime Database, europe-west1.
Güvenlik kuralları `firebase-database-rules.json` dosyasında; Firebase konsoluna
elle yapıştırılır. Kurallar anonim girişin açık olmasını şart koşar.

Kural mantığı: oda kodu sırdır. Kodu bilen odaya katılabilir; katılan üye
odayı ve paylaşılan alışkanlıkları okuyabilir. Kod listesi taranamaz, var olan
bir kodun üstüne yazılamaz.

## Tema ve renk

Açık tema (`body.light`) vurgu değişkenlerini (`--mint`, `--lav`, `--sky`, `--honey`,
`--coral`, …) metin olarak okunur koyu tonlarla yeniden tanımlar; `--*2` (zemin tonu)
ve `--*g` (parıltı) pastel kalır. Yeni öğede renk için **değişken kullan**, sabit
renk yazma; açık tema için tek tek `body.light .x{color:#...}` yaması ekleme.
Alışkanlığın kendi rengini (`h.color`) metin olarak kullanıyorsan `okunurRenk(h.color)`
ile geçir. Soldurmak için `opacity` verme (açık zeminde metni eşiğin altına iter);
gerekiyorsa sınıf ver ve `body.light`'ta kaldır (bkz. `.hc-paused`, `.yd-lbl`).

`tests/test_kontrast.js` her ekranın metin kontrastını WCAG AA'ya göre ölçer
(`--ayrinti` ile hangi metin, hangi renk). İki tema da her ekranda 0 kusur ister.
Açık gri kutu (`--sf2`/`--sf3`) üzerinde `--tx3` sınırda kalır; orada `--tx2` kullan.

## Dar ekran

`tests/test_tasma.js` ekranları (`tests/ekranlar.js`) 320, 360 ve 412 piksel genişlikte
gezer; kırpılan metin, satıra bölünen kısa etiket (en çok 3 kelime), sığmayan yer
tutucu ve üst üste binen metin/düğme arar. Açılır kapanır bir parça eklersen açık
hâlini de `EKRANLAR`'a ekle (bkz. `ana-doldur`); yoksa denetim onu hiç görmez.
- Esnek kutudaki düğmeye `min-width:0` verme: yazısından dar olup `overflow:hidden`
  ile kırpılır. Yer yetmezse satır kırılsın (`flex-wrap:wrap`), yazı kesilmesin.
- Birden çok parçalı kısa bilgi ("4 gün seri", "16/21"): her parça `white-space:nowrap`,
  kapsayıcı `flex-wrap:wrap`. Parça kendi içinde bölünmez, bütün olarak alt satıra iner.
- Kasıtlı kısaltma `text-overflow:ellipsis` ile yapılır, denetim onu saymaz.
- Alışkanlık adını gösterirken ad kendi öğesinde olsun, `class="ad-tek"` (tek satır,
  "…") ve `title="'+esc(h.name)+'"` versin; yanındaki nokta/etiket `flex-shrink:0`.
  `tests/test_uzunad.js` bütün ekranlarda uzun adı ölçer.
- Tasarım gereği çok satıra izin verilen etikete `data-satir="N"` ver (rozet adı: 2).
- Dokunma alanını büyütmek için eksi `margin` verme: komşuyu üstüne çeker (geri
  düğmesi başlığa yapışıyordu). Alanı dolgu ve `min-height:44px` ile büyüt.
- Ekran dışına kaydırarak gizlenen öğede sabit piksel kullanma (yüksekliği ve
  `--sb` değişir): `translate(..., calc(-100% - var(--sb) - pay))` ve kayma bitince
  `visibility:hidden` (bkz. `.toast`, `tests/test_toast.js`).
- Ana ekranın halkası ekran yüksekliğine göre boyutlanır (`.medal-wrapper`, 180–270 px);
  merkezdeki yazı 270 px'e göre yazılır ve `--hk` oranıyla küçülür (`halkaOlcek`/`hkYaz`).
  Merkeze yeni bir satır eklersen iç boşluğa sığmayacağı durumda gizle (`hk-kucuk`/`hk-dar`);
  `tests/test_kisaekran.js` sığmayı ve en az 11 px etkin boyutu ölçer. "Bugün" listesi
  halkanın hemen altındadır; araya yeni kart koyma, listenin altına ekle.
- Ölçümden önce `document.fonts.ready` beklenir; yazı tipi yüklenmeden genişlikler
  yedek yazı tipine göre çıkar ve sonuç oynar.

## Yazım

Kod ve yorumlar Türkçe. Arayüz metinleri Türkçe.
Mevcut üslup: `var`, kısa fonksiyon adları, `function(){}`. Yeni kod da buna uysun.
