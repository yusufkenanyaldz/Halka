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

| (son commit) | Firebase yarım inerse oda özelliği sessizce ölüyordu. Ana kütüphane inip alt modül inmeyince yedek kod patlıyor (`enableLogging`), `_fbDone` hiç true olmuyordu; ilk ekrandan "Katıl" hiçbir şey yapmıyordu. Artık modüller tek tek yedek CDN'den deneniyor, eksik kalırsa sahte bağlantı `window.firebase`'e dokunmadan kuruluyor, geç inen SDK'ya kendiliğinden geçiliyor. Mesaj artık sebebi söylüyor: cihaz çevrimiçiyken "İnternet bağlantısı gerekli" yerine "Oda sunucusuna bağlanılamadı". |

Testler: uygulama için 169 senaryo, Firebase kuralları için 59 senaryo. Hepsi geçiyor.
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

Öncelik sırasına yakın:

1. **Çevrimdışı eksik.** Servis çalışanı ve uygulama tanım dosyası yok, yazı tipi
   Google'dan çekiliyor. Telefona kurulabilir olması için ikisi de gerekli.
2. **Bildirimler tarayıcıda çalışmıyor.** Dakikada bir tam saat eşleşmesi aranıyor,
   arka planda zamanlayıcı kısılınca o dakika kaçıyor. Ayrıca planlı günleri yok sayıyor.
   Android köprüsü varsa sorun yok.
3. **Haftalık özetin başarı oranı programı yok sayıyor.** Hafta içi alışkanlığı için
   hafta sonu da paydaya giriyor, oran olduğundan düşük çıkıyor.
4. **320 piksel ekranda halka yer kaplıyor.** SVG sabit 270 piksel, küçültülmüyor.
   Günün listesine ulaşmak için boş bir halkayı geçip kaydırmak gerekiyor.
5. **Küçük tutarsızlıklar.** Sabit metinde "0 / 5 seçildi" yazıyor ama sınır 8.
   Bildirim balonu karşılama yazısının üstüne biniyor. Reddedilen davetler için yerel
   depoya sürekli anahtar yazılıyor, hiç temizlenmiyor. Partner özetindeki toplam
   paylaşılanları değil bütün alışkanlıkları sayıyor. İstatistiklerdeki "En uzun seri"
   aslında şu anki en iyi seriyi gösteriyor, rekoru değil.

## Kapasite hakkında bir not

Oda kapasitesi (çift 2, aile 6) sunucuda zorlanamıyor: güvenlik kuralları bir düğümün
kaç çocuğu olduğunu sayamıyor (`numChildren` kurallarda yok). Üye listesini herkese
açmak da olmazdı, çünkü o liste odanın kodunu görünür kılardı. Bu yüzden istemci önce
katılıyor, sonra sayıyor, aşıldıysa kendini geri çıkarıyor. Kararlı biri aşabilir ama
bunun için odanın kodunu bilmesi gerekir, yani zaten davet edilmiş biri.

## Temizlik

Firebase veri sekmesinde mart ayından kalma deneme odaları ve kodları duruyor.
Zararsız, kimse okuyamıyor. Silinebilir.
