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

| `6e915b9` | Tur kapanışı. Yeni tur bugün başlıyordu, bugünün kaydı eski turda kalıyordu: kart "yapılmadı", sayaç 0/1, widget ve partner özeti yanlış; 4 gün sonra `autoMiss` o günü yeni turda "missed" yapıp seriyi geriye dönük kırıyordu (ölçüldü: 11 → 4) ya da joker harcıyordu. Artık bugün işaretliyse yeni tur yarın başlıyor ve bugünü gösteren her yer `dayState` okuyor. |

| `55fb908` | Açık tema okunmuyordu. Vurgu değişkenleri açık temada yeniden tanımlanmıyordu (kontrast 1,3–2,2), 115 ayrı yamanın bir kısmı eski griyi sabitliyordu, soldurmalar (`opacity`) metni eşiğin altına itiyordu. Artık açık temada 15 ekranın hepsinde WCAG AA'nın altında metin yok (önce 239). Ayrıca iki temada da: haftalık grafikte gün etiketi soldurulmuyor, widget önizlemesi okunuyor. |

| `3cf1ae8` | Koyu tema kontrastı. 218 metin WCAG AA'nın altındaydı; 175'i üçüncül metin rengi `--tx3` (#5c5a72, 2,88). `--tx3` #8886a2 oldu (5,45; `--tx2`'nin altında, hiyerarşi korunuyor). Takvim iki temada ortak kurala bağlandı: yapılan günde koyu rakam, yapılmayan günde tam görünür mercan, jokerli günde açık rakam. Artık iki temada da 15 ekranın hepsinde 0 kusur. |

| `fea0b4f` | Dar ekranda kesilen/bölünen metin. 320 pikselde "Tamamlandı" kırpılıyordu (kutu 74 px, metin 90 px): düğme `min-width:0` ile yazısından dar olabiliyordu. "5 gün seri" üç satıra, "2 gün önce" iki satıra bölünüyordu; oda düğmelerinde ad ve kişi sayısı yan yana sıkışıyordu (360'ta da); not kutusunun yer tutucusu sığmıyordu. Artık 320/360/412'de 15 ekranın hepsinde kırpılan ya da bölünen kısa metin yok. |

| `e94b14a` | Gizli bildirim balonu ekranın tepesinde görünüyordu. Gizlerken sabit `-90px` kaydırılıyordu; balonun yüksekliği ve durum çubuğu payı (`--sb`, Android'de köprüden) değişken olduğundan gövdesi ve gölgesi ekranda kalıyordu (varsayılan payda gövdenin 2 px'i + 46 px gölge) ve üstteki dokunmaları yakalıyordu. Artık kendi yüksekliği + pay + gölge kadar kayıyor, kayma bitince `visibility:hidden`. Balon genişliği ekranın yarısıyla sınırlıydı (orta mesaj 2-3 satır); artık ekran eksi 32 px. |

| `e278aee` | Ayrıntı başlığında "Geri" başlığa yapışıyordu (ölçülen boşluk 0 px; 320'de orta uzunlukta adda bile). Geri düğmesinin eksi sağ boşluğu başlığı üstüne çekiyordu, çubukta boşluk yoktu; uzun ad 3 satıra iniyor, tek kelimelik uzun ad ekrandan taşıyordu. Artık 12 px boşluk, başlık ortalı ve en çok 2 satır ("…", tam ad `title`'da), dar ekranda (≤359 px) yalnız geri oku. Geri düğmesinin dokunma alanı 34 px'ten 44 px'e çıktı. |

| `7eee0d0` | Geriye dönük doldurma çubukları listeyi boğuyordu: 8 alışkanlıkta 23 ayrı çubuk, listeye 973 px (ekranın 1,2 katı), 40 altı çizili bağlantı, 17 px dokunma hedefi; oda görünümünde ayrı kopya kod 2 günle. Artık alışkanlık başına tek özet satırı ("İşaretsiz: Dün, Pzt, Paz" + "Doldur"), açılınca her gün için 44 px düğmeler, son gün işaretlenince kayboluyor; iki görünüm aynı `ydHtml`'i kullanıyor. Liste yükü 973 → 331 px. Taşma denetimine "üst üste binme" eklendi. |

| `0eaad7f` | Mini halkadaki sayı yüzde ama işaretsizdi ("76" yanında "16/21"; gün sayısı sanılabiliyordu), ekran okuyucuya anlamı söylenmiyordu. Artık "%76", yüzde işareti küçük ki "%100" iç daireye payla sığsın (23×13 px, iç daire 29 px); halkada `aria-label` "%76 tamamlandı" / bırakmada "%78 kaldı". Ana liste ve oda görünümü. |

| `8c2a890` | Bırakma türü kalan yüzdeyi gösteriyordu ("Sigara %97 · 1/30", halka azalıyor), kazanma türü ilerlemeyi; ilerleme sanılabiliyordu. Karar: iki tür de ilerleme. Kart, büyük halka (sayı ve yay), oda halkası, ayrıntı, istatistik, widget verisi ve partnere giden veri; etiketlerde "Y kaldı" duruyor. Partner verisine `pctTur:'ilerleme'` eklendi; eski sürümden gelen bırakma yüzdesi (işaretsiz) okurken çevriliyor. |

| (son commit) | Kutlama katmanları. Koyu temada katman %90–92 siyahtı, alttaki ekran piksellerin %2,7–3,4'ünde sızıyordu; konfeti katmanın üstünde (z 201) düşüp başlık ve düğmeyi örtüyordu. Daha ciddisi: konfeti silme zamanlayıcısı kapanış hatasıyla yalnız sonuncuyu siliyordu; her kutlamadan sonra 39 görünmez parça her şeyin üstünde kalıp dokunmaları yutuyordu. Artık katman %97 + bulanıklık, konfeti katmanın içinde yazının altında, dokunma almıyor, 3,5 sn sonra hepsi siliniyor. |

Testler: uygulama için 643 senaryo, Firebase kuralları için 59 senaryo. Hepsi geçiyor.
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

1. **Uzun adlar taşıyor.** İstatistik detayında ad 3 satıra çıkıp "kazanılıyor" etiketini
   ve renk noktasını kaydırıyor; halka altındaki açıklamada kısaltılmıyor, "Spor" tek başına bir satırda kalıyor.
2. **Widget ayarları ekranında geri düğmesi yok.** Çıkmak için alt menüye basmak gerekiyor.
3. **Boş ana ekran:** halkanın yerinde küçük "Kazanılacak alışkanlık yok" yazısı ve
    büyük bir boşluk, altında ikinci bir boş durum mesajı.
4. **320 pikselde halka ekranı kaplıyor.** SVG sabit 270 piksel; günün listesine
    ulaşmak için kaydırmak gerekiyor.
5. **Metin tutarlılığı:** "Onboarding Tekrarla" İngilizce; istatistiklerdeki
    "En uzun seri" aslında şu anki en iyi seriyi gösteriyor, rekoru değil.
6. **Oda görünümünde iki başlık alt alta.** "Eş / Sevgili" sekmesinde bireysel başlık
   ("Günaydın, Yusuf", tarih, "+") ve oda başlığı (tarih, "Eş / Sevgili", "+") birlikte
   görünüyor; tarih satırı ve "+" düğmesi iki kez. (23 Eylül, doldurma çubuğu işinde görüldü.)

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
