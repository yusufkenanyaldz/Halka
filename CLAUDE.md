# Halka

Alışkanlık takip uygulaması. Tek dosya: `index.html` (HTML + CSS + JS, derleme adımı yok).
Tarayıcıda dosyayı açarak çalışır. Android'de `HalkaBridge` adlı bir JS köprüsü varsa
bildirim ve widget özellikleri devreye girer, yoksa sessizce atlanır.

## Yapı

Her şey `index.html` içinde:
- `<style>` bölümü: tema değişkenleri `:root` altında, açık tema `body.light` ile
- `<body>`: ekranlar `.screen` sınıfıyla, `goScreen()` ile değiştirilir
- `<script>`: önce Firebase/oda kodu, sonra ana uygulama

Veri `localStorage`'da tek anahtarda tutulur (`halka_v2`), `S` global nesnesi.
Oda (partner) özelliği Firebase Realtime Database kullanır.

## Veri modeli — dikkat edilecek nokta

Bir alışkanlığın hedefi tamamlanınca **tur kapanır**: o turun günleri
`h.history` içine taşınır ve `h.days` sıfırlanır. Bu yüzden:

- **Tur bazlı** şeyler `cD(h)` / `h.days` okur: hedef yüzdesi, "x/hedef" sayacı, tur takvimi.
- **Ömür boyu** şeyler `cDAll(h)` / `dayState(h, tarih)` okur: seri, puan,
  toplam tamamlanan, haftalık grafikler, haftalık özet.

Yeni bir yer eklerken hangisi olduğuna karar ver. Doğrudan `h.days[tarih]` okumak
neredeyse her zaman hatadır — tur kapanınca o veri orada olmaz.

Yardımcılar (hepsi `index.html` içinde, `cD`'nin yakınında):
- `dayState(h, tarih)` — günün durumu, geçmiş turlar dahil
- `cDAll(h)` — tüm turlardaki benzersiz "done" gün sayısı
- `hStart(h)` — alışkanlığın ilk turunun başlangıç tarihi
- `pctOf(pay, payda)` — 0-100 arası tamsayı yüzde
- `checkGoals()` — hedefe ulaşıldı mı; `renderMain()` sonunda çağrılır

## Test

```bash
bash tests/calistir.sh            # uygulama testleri (8 takım, 144 senaryo)
bash tests/calistir.sh firebase   # Firebase güvenlik kuralları (59 senaryo)
```

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
5. **Düzeneği sına.** Kuralları kasten açıp testlerin kırmızıya döndüğünü gör.
   Geçen bir test, bir şey ölçtüğünü kanıtlamaz.

## Firebase

Proje `halka-d6595`, Realtime Database, europe-west1.
Güvenlik kuralları `firebase-database-rules.json` dosyasında; Firebase konsoluna
elle yapıştırılır. Kurallar anonim girişin açık olmasını şart koşar.

Kural mantığı: oda kodu sırdır. Kodu bilen odaya katılabilir; katılan üye
odayı ve paylaşılan alışkanlıkları okuyabilir. Kod listesi taranamaz, var olan
bir kodun üstüne yazılamaz.

## Yazım

Kod ve yorumlar Türkçe. Arayüz metinleri Türkçe.
Mevcut üslup: `var`, kısa fonksiyon adları, `function(){}`. Yeni kod da buna uysun.
