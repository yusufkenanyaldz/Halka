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

| `4484df2` | Kutlama katmanları. Koyu temada katman %90–92 siyahtı, alttaki ekran piksellerin %2,7–3,4'ünde sızıyordu; konfeti katmanın üstünde (z 201) düşüp başlık ve düğmeyi örtüyordu. Daha ciddisi: konfeti silme zamanlayıcısı kapanış hatasıyla yalnız sonuncuyu siliyordu; her kutlamadan sonra 39 görünmez parça her şeyin üstünde kalıp dokunmaları yutuyordu. Artık katman %97 + bulanıklık, konfeti katmanın içinde yazının altında, dokunma almıyor, 3,5 sn sonra hepsi siliniyor. |

| `bd23083` | Uzun alışkanlık adı düzeni bozuyordu: istatistik satırında 3–4 satır (renk noktası eziliyordu), oda paylaşım listesinde 2–3 satır, halka açıklamasında "Spor" bir satırda yalnız kalıyordu; kart adı ve widget ayarlarında "…" ile kısalıyor ama tam ad hiçbir yerde okunmuyordu. Artık ad her yerde tek satır (`.ad-tek`), kısalınca tam ad `title`'da; açıklama öğesi en çok yarım genişlik. Bütün ekranları gezen test (`test_uzunad.js`). |
| `eef84a9` | Widget ayarları ekranında geri düğmesi yoktu: ayarlar listesinin içine çiziliyor, çıkmak için alt menüye basmak gerekiyordu; Android geri tuşu (`handleBack`) ayarlardan doğrudan ana ekrana atıyordu (widget, oda kur/katıl/paylaş görünümlerinde de). Ekran listenin en altından açıldığı için kaydırma konumu da kayıyordu. Artık alt görünümler `setAltAc`/`setAltKapat`/`setAltBaslik` ile açılıp kapanıyor: üstte "‹ Geri" başlığı, en üstten açılır, geri dönünce liste eski kaydırma konumunda; Android geri tuşu önce ayarlar listesine döner. Ayrıca seçilen widget boyutu hiç işaretlenmiyordu (seçici 0 öğe buluyordu). Test: `test_altgorunum.js`. |
| `0cb15ae` | Boş ana ekran: bireysel alışkanlık yokken (hiç yok, hepsi arşivde ya da hepsi odada) 270 px'lik boş halka ve ortasında "Kazanılacak alışkanlık yok" çiziliyor, altında ikinci boş mesaj duruyordu; 320×640'ta "Alışkanlık Ekle" düğmesi alt menünün altında kalıyor, ekran 101 px kaydırılıyordu. Artık halka bölümü (`#rHero`) gizlenir, tek boş durum mesajı üstte ve düğme kaydırmadan görünür. Test: `test_bosana.js`. |
| `07c9782` | Kısa ekranda halka ekranı kaplıyordu: halka her ekranda sabit 270 px; başlık, halka, seri ve haftalık hedef kartlarından sonra gelen "Bugün" listesinin ilk kartı 320×640, 360×640 ve hatta 360×800'de kaydırmadan hiç görünmüyordu. Kullanıcının seçimiyle (B): halka ekran yüksekliğine göre küçülür (640'ta 180 px, 730 px ve üstünde 270 px) ve "Bugün" listesi halkanın hemen altına alındı (seri ve haftalık hedef listenin altında). Merkezdeki yazı halkayla aynı oranda küçülür (`--hk`, `halkaOlcek`); iç boşluk yazıyı taşıyamazsa merkezde yalnız yüzde kalır, seçili alışkanlığın bilgisi halkanın altına tek satır iner (`#rAlt`). Bu, uzun ekranda da eskiden beri olan bir taşmayı giderdi: 2+ halkada seçili bilgisi halkaların üstüne 10–28 px taşıyordu. Test: `test_kisaekran.js`; ortak ekran turuna `ana-secili` eklendi. |
| `9942f31` | Günlük sayım duraklatılmış ve bugün programında olmayan alışkanlığı da sayıyordu: bir alışkanlık duraklatılınca (ya da hafta sonu hafta içi alışkanlığı varken) etkin olanların hepsi yapılsa bile "1/2 tamamlandı" yazıyor, "Bugünü tamamladın" afişi ve "hepsi bitti" motivasyonu hiç çıkmıyordu; widget ve partnere giden özet de aynı yanlış sayıyı taşıyordu, duraklatılmış bir ortak alışkanlık oda konfetisini engelliyordu. Yalnız duraklatılmış alışkanlık varken "Seri başlatmadın, Bugün ilk adımı at!" ve "harekete geç" yazıyordu; widget'tan dokunulunca duraklatılmış alışkanlık ilerliyordu. Artık hepsi `bugunGerekli(h)` (duraklatılmamış ve bugün programında) ile sayar; hiç gerekli yoksa "Tüm alışkanlıklar duraklatıldı" / "Bugün programında alışkanlık yok". Test: `test_duraklat.js`. |
| `1482189` | Metin tutarlılığı: ayarlarda İngilizce "Onboarding Tekrarla" (ve onay penceresinde "Onboarding") → "Tanıtımı Tekrar Göster". İstatistikteki "En uzun seri" şu anki serinin en büyüğünü gösteriyordu: dün kırılan 10 günlük seri "—", geçmiş turdaki 22 günlük seri "2 gün" görünüyordu; seri rozetleri (7/21/30 gün) de aynı değeri okuduğu için seri kırılınca geri alınıyordu. Artık `enUzunSeri(h)` ömür boyu rekoru hesaplar (cS ile aynı kural, geçmiş turlar dahil). Test: `test_metin.js`. |
| `231c152` | Oda sekmesinde iki başlık alt alta: bireysel başlık (tarih, "Günaydın", bireysel "+", "0/4 alışkanlık tamamlandı", seviye, motivasyon) `#selfModeContent` dışında kaldığı için oda başlığının üstünde de çiziliyordu; tarih ve "+" iki kez. Bireysel başlık bireysel içeriğe alındı; oda sekmesinde yalnız oda başlığı, bireysel başlığın yerinde. Test: `test_odabaslik.js`. |
| `7d72d03` | Haftalık özetin başarı oranı paydası haftanın her gününü sayıyordu: hafta içi alışkanlığı 5/5 yapılınca "5/7 %71", 4 gün duraklatılmış alışkanlık "3/7 %43", pazar sabahı henüz işaretlenmemiş bugün yüzünden "6/7 %86". Artık `haftaGunSayilir`: yapılan her gün; yapılmayan gün yalnız programdaysa, duraklatılmamışsa (süren duraklatma `pausedAt` ile) ve geçmişse sayılır. Test: `test_haftaozet.js`. |
| `44a8e45` | Partnere giden özet (`fbSyncShared` → `summary`) bütün alışkanlıkları sayıyordu: 5 alışkanlıktan 2'si paylaşılırken partner kartında "2/5 bugün" (doğrusu 1/2); paylaşılmayan alışkanlıkların sayısı ve bugünkü durumu odaya gidiyordu, hiç paylaşım yokken de. Artık özet yalnız paylaşılan ve bugün gerekli (`bugunGerekli`) alışkanlıkları sayar. Eski sürümdeki partner güncelleyene kadar eski sayıyı gönderir. Test: `test_partnerozet.js`. |
| `daee05d` | Reddedilen davetler her biri ayrı bir localStorage anahtarı (`inv_<oda>_<hid>_rej`) olarak yazılıyor, odadan ayrılınca ve "Tüm verileri sil"den sonra da kalıyor (ölçüm: 5 ret → 5 anahtar, silmeden sonra yine 5), yedeğe girmiyordu. Artık `S.redDavet[oda][hid]`: yedeğe girer, odadan ayrılınca o odanınki silinir, hiçbir üyenin artık paylaşmadığı alışkanlığın reddi temizlenir; eski anahtarlar açılışta taşınır (önce kaydedilir, sonra silinir). Test: `test_davet.js`. |
| `57289ba` | Android geri tuşu: `handleBack()` hiçbir durumda değer döndürmüyordu (Android uygulamadan ne zaman çıkacağını bilemiyordu); kutlama, kilometre taşı ve davet penceresi geri tuşuyla kapanmıyordu (arkada ekran değişiyor, katman üstte kalıyordu); tanıtımın ilk ekranında geri tuşu tanıtım bitmeden ana ekrana atıyordu; tanıtım 3'teki alt panelden seçime değil 2. ekrana gidiyordu. Artık `true`/`false` döner (Android sözleşmesi CLAUDE.md'de), katmanları üstten kapatır (kutlamada düğmeyle aynı iş), tanıtımda adım adım geri gider. Test: `test_geritusu.js`. |
| `65f1bea` | Android uygulaması: `android/` Android Studio projesi (WebView, `HalkaBridge`, hatırlatıcılar, widget, dosya kaydet/seç, onay pencereleri, geri tuşu) ve adım adım kurulum rehberi `android/BENIOKU.md`. JS: yedek dışa aktarma köprüde `saveFile` varsa onu kullanır (WebView `blob:` indirmez), köprü varken servis çalışanı kaydedilmez. Test: `test_kopru.js` (JS sözleşmesi), `bash tests/calistir.sh android` (XML, kaynaklar, Java derlemesi, hatırlatıcı zamanı). APK bu ortamda derlenemedi (Android SDK indirilemiyor). |
| `6c65139` | Telefonda (Galaxy S25+) görüldü: odasız kullanıcıda ana ekran başlığı (tarih, "Günaydın", "+") durum çubuğunun ve kameranın altına giriyordu; başlıktaki satır içi `padding-top:12px` `--sb`'yi eziyordu (ölçüm: --sb 48 px iken yazılar y=12–25). Artık `--sb` kullanır, oda sekmeleri görünürken (`.sekmeli`) 12 px. Widget teması: Widget Ayarları'na "Uygulamayla aynı / Koyu / Açık"; widget verisine `tema`, Android widget'ı buna göre çizer, uygulamadaki önizleme de. Önizlemenin "x/y bugün" toplamı bugün gerekli olanlarla sayılır (duraklatılmış hariç; önceki işte gözden kaçmıştı). Başlık aşağı inince kısa ekranda ilk kart yine taştı (test_kisaekran yakaladı): halka boyutu artık `--sb`'yi de hesaba katar (144–270 px). Açık widget önizlemesinde adlar okunmuyordu (test_kontrast yakaladı; `okunurRenk` yalnız uygulama açık temadayken çalışıyordu): `okunurRenk(renk, zeminParlakligi)`. Test: `test_ustbosluk.js`, `test_widgettema.js`; ortak ekran turuna `widget-tema`. |
| `9d7f9b7` | Telefonda görüldü, oda sekmesi: "Paylaşımları Düzenle" ana ekrandan basılınca hiçbir şey açmıyordu (liste Ayarlar ekranının içine çiziliyor, o ekrana geçilmiyordu). Artık Ayarlar'a geçer; Tamam / Atla / geri tuşu oda ekranına döner. Odadan ayrılınca ana ekran boş oda görünümünde kalıyordu, sekme de olmadığı için dönüş yolu yoktu (`renderModeTabBar` tek sekmede görünümü bireysele almadan çıkıyordu). Oda ekranına "Odadan Ayrıl" düğmesi (önceden yalnız Ayarlar'ın en altında). Boş odadaki iki düğme 320 px'te yazıları bölünüyordu (eski kusur; `ana-oda` denetime girince taşma testi yakaladı): bölünmez, sığmazsa alt alta. Test: `test_oda.js`; ortak ekran turuna `ana-oda`. |
| (son commit) | Son genel inceleme (kullanıcı gibi 24 günlük veriyle bütün ekranlar gezildi). **Veri kaybı:** Ayarlar'daki "Depolama: x KB Sağlıklı ✓" satırına dokunup onaylamak 90 günden eski gün kayıtlarını siliyordu; hedef "yapılan gün" olduğundan tur 90 günden uzun sürebilir, ilerleme düşüyordu (ölçüm 75 → 55 gün). Artık temizlik yalnız 90 günden eski notları siler, satır sağlıklıyken dokunulmaz. **Tur kapanınca geri gidenler:** ayrıntıdaki "Son 12 Hafta" haritası (23 günün 2'si görünüyordu) ve rozetler (İlk Gün, 100/500 Gün, Dengeci, Geri Dönüşçü, Hafta Yıldızı) `h.days` okuyordu; artık `dayState`/`cDAll`. **Tur takvimi** başlangıç + hedef günde kesiliyordu: tur uzayınca son işaretler ve bugün görünmüyordu (13 günün 12'si). **Tanıtımı Tekrar Göster:** geri tuşu uygulamayı kapatıyor ve her açılışta tanıtım geliyordu, bir alışkanlık seçmeden çıkılamıyordu, 8 sınırı aşılıyordu (9 etkin), isim boş geliyordu; artık ilk ekranda geri tuşu ana ekrana döner, seçim isteğe bağlı ve kalan yer kadar. **Renkler:** tanıtımdan gelen üç alışkanlık üç yakın pembe alıyordu (`CL` sırasında 2 adım); tanıtım ve ekleme ekranı artık tonca en uzak rengi önerir (`farkliRenk`). **Widget:** sonradan eklenen alışkanlık widget'a hiç gelmiyordu, arşivlenen kalıyordu, "Tümünü Kaldır" hepsini geri getiriyordu (liste ilk açılışta donduruluyordu); artık kapatılanlar tutulur (`S.widgetGizli`, eski liste açılışta bırakılır, hepsi görünür başlar). "Tüm Verileri Sil" widget'ı boşaltmıyordu. Önizleme "62%" yazıyordu (widget "%62"). **Küçükler:** selamlamada isim iki kez kaçışlanıyordu ("&lt;" görünüyordu); ayrıntıda ad boşaltılınca kutu boş kalıyor, başka alışkanlığın adı alınabiliyordu; duraklatılmış başlığında "0 gündür · streak korunuyor". Test: `test_inceleme.js`.

Testler: uygulama için 1014 senaryo, Firebase kuralları için 59 senaryo. Hepsi geçiyor.
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

Listedeki bütün maddeler giderildi (bkz. yukarıdaki tablo).

### B. Android tarafı

`android/` projesinde yapıldı: `setDomStorageEnabled`, `WebChromeClient` (confirm/alert),
dosya seçici (`onShowFileChooser`), `saveFile`, `scheduleReminderDays` (AlarmManager, yeniden
başlatmada yeniden kurulur), widget, geri tuşu (`handleBack` false → `finish()`), web
dosyalarının derlemede kopyalanması.

Açık kalanlar:
- **APK hiç derlenmedi.** Bu ortamda Android SDK indirilemiyor; Java derlemesi ve kaynaklar
  denetlendi (`bash tests/calistir.sh android`), Gradle derlemesi ve telefonda çalışma
  Android Studio'da ilk açılışta görülecek. Hata çıkarsa kullanıcı kırmızı yazıyı getirecek.
- Widget çizimi (`HalkaWidget.ciz`) ve dokunma alanları telefonda görülmedi.
- Firebase anonim girişinin `https://appassets.androidplatform.net` kökeninden çalıştığı
  cihazda doğrulanmadı (Firebase konsolunda API anahtarı kısıtı varsa bu alan eklenmeli).

### C. Arayüz kusurları (360×800 ve 320×640, koyu ve açık tema, dolu veriyle çekildi)

Listedeki bütün maddeler giderildi (bkz. yukarıdaki tablo).

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
