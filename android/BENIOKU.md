# Halka — Android uygulaması

Bu klasör, Halka'yı telefona kurulabilen gerçek bir Android uygulaması yapan
Android Studio projesidir. Kod yazman gerekmez; aşağıdaki adımları sırayla yap.

Uygulamada neler var:
- Halka'nın kendisi (bu deponun `index.html` dosyası, internetsiz de açılır)
- Hatırlatıcı bildirimleri (seçtiğin günlerde, seçtiğin saatte)
- Ana ekran widget'ı (halkaya dokununca o alışkanlık tamamlanır)
- Yedekle / Yedekten geri yükle (dosya **İndirilenler/Halka** klasörüne kaydedilir)
- Onay pencereleri (silme, arşivleme…) ve telefonun geri tuşu

---

## 1. Android Studio'yu kur (bir kez)

1. https://developer.android.com/studio adresinden **Android Studio**'yu indir ve kur.
2. İlk açılışta kurulum sihirbazı çıkar: hep **Next**, kurulum türünde **Standard**,
   en sonda **Finish**. Gerekli parçaları kendisi indirir (internet gerekir, 10–20 dk sürebilir).

## 2. Projeyi bilgisayarına koy

- Sana gönderilen **halka-android.zip** dosyasını aç (sağ tık → Tümünü ayıkla).
- Çıkan **Halka** klasörünü kısa bir yere taşı, örneğin `C:\Halka` (Mac'te `Belgeler/Halka`).
- İçinde `index.html`, `fonts`, `icons` ve **android** klasörleri yan yana durmalı.
  (Uygulama derlenirken `index.html` buradan alınır; bu yüzden **android** klasörünü tek
  başına başka yere taşıma.)

## 3. Projeyi aç

1. Android Studio → **Open** (ya da File → Open).
2. `Halka` klasörünün **içindeki `android`** klasörünü seç → **OK**.
3. "Trust project?" diye sorarsa → **Trust Project**.
4. Alt kısımda "Gradle sync" / "Indexing" yazıları görünür; **bitmesini bekle**
   (ilk seferde birkaç dakika). Bitince sol üstte proje ağacı görünür.
   - "Android Gradle Plugin güncellemesi" (Upgrade) önerirse kabul edebilirsin.
   - Kırmızı bir hata çıkarsa → bölüm 8.

## 4. Telefonu hazırla (bir kez)

1. Telefonda **Ayarlar → Telefon hakkında** → **Yapı numarası**na **7 kez** dokun
   ("Artık geliştiricisin" yazar). (Samsung: Ayarlar → Telefon hakkında → Yazılım bilgileri.)
2. **Ayarlar → Sistem → Geliştirici seçenekleri** → **USB hata ayıklama**'yı aç.
3. Telefonu USB kablosuyla bilgisayara tak. Telefonda "USB hata ayıklamaya izin verilsin mi?"
   çıkar → **İzin ver** (ve "Bu bilgisayara her zaman izin ver").

Telefonun yoksa: Android Studio → sağdaki **Device Manager** → **+** → bir telefon seç →
**Next / Finish**. Bu, bilgisayarda sanal bir telefon açar.

## 5. Çalıştır

- Üstteki araç çubuğunda telefonunun adı seçili olsun.
- Yeşil **▶ (Run)** düğmesine bas.
- Birkaç dakika sonra Halka telefonunda açılır. Artık telefonun uygulama listesinde de durur;
  kabloyu çıkarsan da çalışır.

## 6. Telefonda ilk ayarlar

- **Bildirim izni:** bir alışkanlığa hatırlatıcı saati koyunca izin sorar → **İzin ver**.
- **Tam zamanında bildirim** (isteğe bağlı): Ayarlar → Uygulamalar → Halka →
  **Alarmlar ve hatırlatıcılar** → aç. Kapalıysa bildirim birkaç dakika gecikebilir.
- **Widget:** ana ekranda boş bir yere uzun bas → **Widget'lar** → **Halka** → sürükle bırak.
  Boyutunu kenarlarından çekerek değiştirebilirsin (4x1, 4x2, 2x2).
  Halkaya dokununca o alışkanlık bugün için tamamlanır.

## 7. APK dosyası üretmek (kablosuz kurmak / başkasına vermek için)

- Android Studio → **Build → Build App Bundle(s) / APK(s) → Build APK(s)**.
- Sağ altta "APK(s) generated" çıkınca **locate**'e bas: `app-debug.apk` dosyası.
- Bu dosyayı telefona gönder (e-posta, Drive…), telefonda aç → "bilinmeyen kaynaklara izin ver"
  → **Yükle**.

## 8. Sorun olursa

- **Kırmızı hata / "Build failed":** Alttaki **Build** penceresinde kırmızı yazıyı seç,
  kopyala ve bana gönder. Genelde tek satırlık bir düzeltmeyle geçer.
- **"SDK location not found":** File → **Project Structure** → SDK Location →
  Android SDK yolunu seç (Android Studio kendisi önerir) → OK.
- **"index.html bulunamadi":** 2. adımdaki klasör düzenine bak; `android` klasörünü
  `Halka` klasörünün içinden açmalısın.
- **Sync takıldı:** File → **Sync Project with Gradle Files**.
- **Telefon görünmüyor:** kabloyu çıkar-tak, telefonda USB bildirimine dokunup
  "Dosya aktarımı" seç, izin penceresine **İzin ver** de.

## 9. Bilmen gerekenler

- **Verilerin** uygulamanın içinde durur. Uygulamayı kaldırırsan silinir: önce
  Ayarlar → **Verileri Yedekle** yap (dosya İndirilenler/Halka'ya gider).
- Tarayıcıda kullandığın Halka'nın verileri uygulamaya kendiliğinden geçmez:
  tarayıcıda yedek al, uygulamada **Yedekten Geri Yükle** ile yükle.
- `index.html` değiştiğinde (yeni bir düzeltme gelince) yeniden **▶ Run** yapman yeterli;
  yeni sürüm otomatik alınır.
- **Oda** (eş/aile) özelliği internet ister ve Firebase'i kullanır; ek bir ayar gerekmez.

---

Teknik not (geliştirici için): Java, AndroidX yok. Sayfa
`https://appassets.androidplatform.net/www/index.html` adresinden sunulur
(`MainActivity.shouldInterceptRequest`); web dosyaları derlemede deponun kökünden
`build/halkaWeb/www`'ye kopyalanır (`app/build.gradle`, `webKopyala`). JS köprüsü
`HalkaKopru` ("HalkaBridge"); sözleşme kök dizindeki CLAUDE.md'de. Bu ortamda Android SDK
indirilemediği için `bash tests/calistir.sh android` yalnız XML/kaynak/Java derlemesini ve
hatırlatıcı hesabını denetler; APK derlemesi Android Studio'da yapılır.
