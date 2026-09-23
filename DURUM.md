# Durum — 22 Eylül 2026

Bu dosya bir oturum devri içindir. İş ilerledikçe güncellensin ya da silinsin.

## Yapılanlar

İlk inceleme sonrası oturum başına bir hata kapatıldı. Hepsi bu dalda:

| Commit | Ne düzeldi |
|---|---|
| `b98a1f9` | Seri hesabı programlı günleri yok sayıyordu. Hafta içi seçilen alışkanlık her hafta sonu serisini kaybediyordu (21 gün işaretliyken "1 gün" yazıyordu). |
| `76eb30c` | Tur kapanınca seri sıfırlanıyordu. Hedefi başaran kullanıcı serisini kaybediyordu. |
| `de7fa2c` | Tur kapanınca puan düşüyordu (252 → 192). Başarınca puan kaybı, seviye gerilemesi. |
| `e0c2e26` | Tur kapanınca haftalık grafikler ve haftalık özet boşalıyordu. |
| `a7073d6` | İlerleme yüzdesi 100'ü aşabiliyordu (%114, %250). Partnerden gelen yüzde de doğrulanmıyordu. |
| `f4ebaf0` | Kutlama sadece "bugünü işaretle" yolunda tetikleniyordu. Geriye dönük doldurma, widget ve joker yollarında tur hiç kapanmıyordu. |
| `6077cd2` | Kaydetme hatası mesajı yanıltıcıydı. Firebase hatası "Depolama dolu!" diye gösteriliyordu. |
| `2cfd4ca` | Firebase güvenlik kuralları yazıldı, oda akışı kurallara uyarlandı. |
| `133cb0f` | Yedek birleştirmede kimlik çakışması. Yeniden adlandırılmış alışkanlığın eski yedeği aynı kimlikle ekleniyordu, "Spor"u işaretlemek "Koşu"yu işaretliyordu. Artık gelene yeni kimlik veriliyor, kilometre taşları taşınıyor, açılışta eski bozulma onarılıyor. 8 sınırını aşanlar arşive ekleniyor; arşivden geri alma da sınırı aşamıyor. |

| `f11eca9` | Firebase yarım inerse oda özelliği sessizce ölüyordu. Ana kütüphane inip alt modül inmeyince yedek kod patlıyor (`enableLogging`), `_fbDone` hiç true olmuyordu; ilk ekrandan "Katıl" hiçbir şey yapmıyordu. Artık modüller tek tek yedek CDN'den deneniyor, eksik kalırsa sahte bağlantı `window.firebase`'e dokunmadan kuruluyor, geç inen SDK'ya kendiliğinden geçiliyor. Mesaj artık sebebi söylüyor: cihaz çevrimiçiyken "İnternet bağlantısı gerekli" yerine "Oda sunucusuna bağlanılamadı". |

| `77349d3` | Çevrimdışı ve kurulum. Yazı tipleri Google yerine `fonts/`'tan geliyor (Türkçe harfler dahil). `manifest.webmanifest` ve simgeler eklendi, Chrome manifesti hatasız okuyor. `sw.js` uygulamayı önbelleğe alıyor: sunucu kapalıyken açılıyor, şebeke cevap vermezse 4 saniyede önbellekten açılıyor, çevrimiçiyken yeni sürüm hemen geliyor. |

| `886d85b` | Hatırlatıcılar. Arşivli ve duraklatılmış alışkanlıkların alarmı her açılışta yeniden kuruluyordu; artık açılışta iptal ediliyor. Duraklat/devam, arşivden çıkar, ad/tür/program değişikliği alarmı eşitliyor. Program Android'e yeni `scheduleReminderDays` ile ISO gün listesi olarak gidiyor (eski köprüde 4 argümanlı metoda düşülüyor). Açılışta izin istenmiyor. "Üzerine yaz" yedek yüklemede eski alarmlar iptal ediliyor. |

| (son commit) | Tur kapanışı. Yeni tur bugün başlıyordu, bugünün kaydı eski turda kalıyordu: kart "yapılmadı", sayaç 0/1, widget ve partner özeti yanlış; 4 gün sonra `autoMiss` o günü yeni turda "missed" yapıp seriyi geriye dönük kırıyordu (ölçüldü: 11 → 4) ya da joker harcıyordu. Artık bugün işaretliyse yeni tur yarın başlıyor ve bugünü gösteren her yer `dayState` okuyor. |

Testler: uygulama için 245 senaryo, Firebase kuralları için 59 senaryo. Hepsi geçiyor.
Her düzeltme, düzeltme öncesi sürümde de çalıştırılarak gerçekten bir şeyi
yakaladığı doğrulandı.

## Acil — kullanıcıda bekleyen iş

**Firebase kuralları henüz yayınlanmadı.** `firebase-database-rules.json` dosyasının
içeriği Firebase konsolunda Realtime Database > Kurallar sekmesine yapıştırılıp
yayınlanmalı. Ayrıca Authentication > Sign-in method altında **Anonim** giriş açık olmalı.

Şu anki durum: veritabanı 21 Nisan 2026'da süresi dolan test modu kuralında.
Yani her şey kapalı, oda özelliği beş aydır çalışmıyor. Gizlilik riski yok ama
özellik de yok. Kurallar yayınlanana kadar oda tarafı test edilemez.

## Kalanlar

Hedef platform **Android (WebView)**. Tarayıcıya özgü işler (tarayıcı bildirimleri,
servis çalışanı) öncelik dışı. 23 Eylül'de yeniden denetlendi; aşağıdakilerin hepsi
ölçüldü ya da kodda satırıyla doğrulandı.

### A. Teknik hatalar (Android'de de geçerli)

1. **Haftalık özetin başarı oranı programı yok sayıyor.** Hafta içi alışkanlığı için
   hafta sonu da paydaya giriyor, oran olduğundan düşük çıkıyor.
2. **Partner özetindeki toplam** paylaşılanları değil bütün alışkanlıkları sayıyor
   (`fbSyncShared`, `total:act.length`, `done` da öyle).
3. **Reddedilen davetler** için yerel depoya sürekli anahtar yazılıyor, hiç temizlenmiyor.

### B. Android tarafında yapılması gerekenler (JS hatası değil, WebView ayarı)

- **`scheduleReminderDays(id, ad, saat, mesaj, gunlerJson)`** eklenmeli; günler ISO
  (1=Pzt … 7=Paz). Eklenmezse eski `scheduleReminder` kullanılır ve hafta içi
  alışkanlığı hafta sonu da bildirim atar. Ayrıntı: CLAUDE.md, "Android köprüsü".

- `setDomStorageEnabled(true)` — yoksa `localStorage` yok, veri kaydedilmez.
- `WebChromeClient` atanmalı — atanmazsa `confirm()` hep `false` döner: silme,
  arşivleme, "Tüm Verileri Sil", yedek yükleme hiç çalışmaz. 11 yerde `confirm/alert` var.
- `onShowFileChooser` — "Yedekten Geri Yükle" `<input type=file>` açıyor; WebView bunu
  kendiliğinden açmaz.
- Dışa aktarma `blob:` bağlantısıyla `a.download` kullanıyor; WebView indirmez.
  Köprüye bir "dosya kaydet" metodu gerekir (ör. `HalkaBridge.saveFile(ad, json)`).
- Geri tuşu: `handleBack()` var ama açık katmanları (kutlama, oda penceresi, widget
  ayarları) kapatmıyor ve ana ekrandayken "uygulamadan çık" demiyor; Android'e
  "tükettim / tüketmedim" dönmeli.
- `fonts/` ve `icons/` klasörleri `index.html` ile birlikte assets'e kopyalanmalı.
  `sw.js` ve `manifest.webmanifest` WebView'da kullanılmaz, zararsız.

### C. Arayüz kusurları (360×800 ve 320×640, koyu ve açık tema, dolu veriyle çekildi)

1. **Açık tema okunmuyor.** Açık tema yalnız zemin ve metin rengini değiştiriyor,
   vurgu renkleri koyu temanın pastelleri kalıyor. Açık zeminde kontrast: nane 1,37,
   bal 1,29, gök 1,69, mercan 2,00, lavanta 1,99 (okunabilir metin için en az 4,5).
   Görünmeyenler: "Filiz" seviye rozeti, "kazanılıyor/bırakılıyor", "2 gündür
   duraklatılmış", "Duraklat" düğmesi, detaydaki "%67", seçili hedef günü, "Sağlıklı ✓".
2. **320 pikselde düğme yazısı kesiliyor:** "Tamamland" (ı düşüyor). Aynı genişlikte
   "4 gün seri" alt alta üç satıra bölünüyor, not kutusunun yer tutucusu kesiliyor.
3. **Gizli bildirim balonu ekranın tepesinde görünüyor.** Balon gizlenirken sabit
   `-90px` kaydırılıyor, yüksekliği metne göre değişiyor; iki satırlık mesajda alt kenarı
   tarih satırının üstünde kalıyor. Android'de `--sb` köprüden büyük gelirse tek satırda da görünür.
   Görünürken de karşılama başlığının üstüne biniyor.
4. **Detay başlığında "Geri" başlığa yapışıyor.** Uzun adda başlık 3 satıra çıkıyor,
   "‹ Geri" ile ilk kelime arasında boşluk yok ("Gerimeditasyon").
5. **Geriye dönük doldurma çubukları listeyi boğuyor.** İşaretlenmemiş her alışkanlık
   için 3 ayrı çubuk ("Dün / 2 gün önce / 3 gün önce — Yaptım / Yapmadım"); 8 alışkanlıkta
   ana liste çubuklarla doluyor. Altı çizili sarı bağlantı görünümü uygulama gibi değil, web sayfası gibi.
6. **Mini halkadaki sayı yüzde ama işareti yok.** "76" yanında "16/21" yazıyor; kullanıcı
   76'yı gün sayısı sanabilir.
7. **Kutlama ve kilometre taşı katmanları yarı saydam.** Alttaki "%5" ve halka yıldızın
   arkasından okunuyor, konfeti başlığın üstüne biniyor.
8. **Uzun adlar taşıyor.** İstatistik detayında ad 3 satıra çıkıp "kazanılıyor" etiketini
   ve renk noktasını kaydırıyor; halka altındaki açıklamada kısaltılmıyor, "Spor" tek başına bir satırda kalıyor.
9. **Widget ayarları ekranında geri düğmesi yok.** Çıkmak için alt menüye basmak gerekiyor.
10. **Oda oluştur'da "Aile / Dost 3–6 kişi" düğmesi iki sütuna bölünüyor**, yanındaki
    "Sevgili / Eş 2 kişi" ile hizası tutmuyor.
11. **Boş ana ekran:** halkanın yerinde küçük "Kazanılacak alışkanlık yok" yazısı ve
    büyük bir boşluk, altında ikinci bir boş durum mesajı.
12. **320 pikselde halka ekranı kaplıyor.** SVG sabit 270 piksel; günün listesine
    ulaşmak için kaydırmak gerekiyor.
13. **Metin tutarlılığı:** "Onboarding Tekrarla" İngilizce; istatistiklerdeki
    "En uzun seri" aslında şu anki en iyi seriyi gösteriyor, rekoru değil.

## Yayın hakkında bir not

Servis çalışanı ve kurulum yalnız uygulama **https** üzerinden sunulunca çalışır
(GitHub Pages, Firebase Hosting vb.). Dosyayı doğrudan açınca (`file://`) sessizce
atlanır, yazı tipleri yine de depodan yüklenir. Android uygulaması `index.html`'i
nasıl yüklüyorsa öyle çalışmaya devam eder; `fonts/` ve `icons/` klasörleri de
uygulamanın içine kopyalanmalı, yoksa yazı tipi sistemdekine düşer.

## Kapasite hakkında bir not

Oda kapasitesi (çift 2, aile 6) sunucuda zorlanamıyor: güvenlik kuralları bir düğümün
kaç çocuğu olduğunu sayamıyor (`numChildren` kurallarda yok). Üye listesini herkese
açmak da olmazdı, çünkü o liste odanın kodunu görünür kılardı. Bu yüzden istemci önce
katılıyor, sonra sayıyor, aşıldıysa kendini geri çıkarıyor. Kararlı biri aşabilir ama
bunun için odanın kodunu bilmesi gerekir, yani zaten davet edilmiş biri.

## Temizlik

Firebase veri sekmesinde mart ayından kalma deneme odaları ve kodları duruyor.
Zararsız, kimse okuyamıyor. Silinebilir.
