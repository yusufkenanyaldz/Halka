package com.halka.app;

import android.Manifest;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.webkit.JavascriptInterface;

import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/**
 * Sayfadaki JS'in "HalkaBridge" adıyla gördüğü köprü. Metot adları ve argüman
 * sayıları index.html ile sözleşmedir (bkz. CLAUDE.md, "Android köprüsü"):
 * adını ya da argüman sayısını değiştirme, gerekirse yeni adla yeni metot ekle.
 *
 * Bu metotlar WebView'in kendi iş parçacığında çalışır; ekrana dokunan her şey
 * runOnUiThread ile yapılır.
 */
public class HalkaKopru {

    private final MainActivity etkinlik;
    private final Context bag;

    HalkaKopru(MainActivity etkinlik) {
        this.etkinlik = etkinlik;
        this.bag = etkinlik.getApplicationContext();
    }

    // ---- Ekran ----

    /** Durum çubuğunun yüksekliği, CSS pikseli (dp) olarak. Sayfa üst boşluğunu buna göre bırakır. */
    @JavascriptInterface
    public int getStatusBarHeight() {
        int dp = etkinlik.durumCubuguDp;
        if (dp > 0) return dp;
        int id = bag.getResources().getIdentifier("status_bar_height", "dimen", "android");
        if (id == 0) return 0;
        return Math.round(bag.getResources().getDimensionPixelSize(id)
                / bag.getResources().getDisplayMetrics().density);
    }

    @JavascriptInterface
    public void setLightStatusBar(boolean acik) {
        etkinlik.runOnUiThread(() -> etkinlik.temaUygula(acik));
    }

    // ---- Widget ----

    @JavascriptInterface
    public void updateWidget(String json) {
        HalkaWidget.veriKaydet(bag, json);
        HalkaWidget.hepsiniGuncelle(bag);
    }

    // ---- Hatırlatıcılar ----

    /** gunlerJson: ISO gün numaraları, "[1,2,3,4,5]" = Pzt–Cum (1=Pzt … 7=Paz). */
    @JavascriptInterface
    public void scheduleReminderDays(String id, String ad, String saat, String mesaj, String gunlerJson) {
        Hatirlatici.kur(bag, id, ad, saat, mesaj, gunlerJson);
    }

    /** Eski köprü: günleri bilmez, her gün çalar. */
    @JavascriptInterface
    public void scheduleReminder(String id, String ad, String saat, String mesaj) {
        Hatirlatici.kur(bag, id, ad, saat, mesaj, "[1,2,3,4,5,6,7]");
    }

    @JavascriptInterface
    public void cancelReminder(String id) {
        Hatirlatici.iptal(bag, id);
    }

    @JavascriptInterface
    public void requestNotificationPermission() {
        Hatirlatici.kanalKur(bag);
        if (Build.VERSION.SDK_INT >= 33
                && bag.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
            etkinlik.runOnUiThread(() -> etkinlik.requestPermissions(
                    new String[]{Manifest.permission.POST_NOTIFICATIONS}, MainActivity.IZIN_BILDIRIM));
        }
    }

    @JavascriptInterface
    public void testNotification(String ad, String mesaj) {
        Hatirlatici.bildirimGoster(bag, 424242, ad, mesaj);
    }

    // ---- Yedek dosyası ----

    /**
     * Yedeği kaydeder. Dönüş: kaydedilen yer ("İndirilenler/Halka/..."), "bekle" (kullanıcı
     * konum seçiyor, sonucu Android bildirir) ya da "" (hata).
     */
    @JavascriptInterface
    public String saveFile(String ad, String icerik) {
        if (Build.VERSION.SDK_INT >= 29) {
            try {
                ContentResolver cr = bag.getContentResolver();
                ContentValues d = new ContentValues();
                d.put(MediaStore.MediaColumns.DISPLAY_NAME, ad);
                d.put(MediaStore.MediaColumns.MIME_TYPE, "application/json");
                d.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/Halka");
                Uri u = cr.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, d);
                if (u == null) return "";
                try (OutputStream o = cr.openOutputStream(u)) {
                    if (o == null) return "";
                    o.write(icerik.getBytes(StandardCharsets.UTF_8));
                }
                return "İndirilenler/Halka/" + ad;
            } catch (Exception e) {
                return "";
            }
        }
        etkinlik.runOnUiThread(() -> etkinlik.yedekKonumSor(ad, icerik));
        return "bekle";
    }
}
