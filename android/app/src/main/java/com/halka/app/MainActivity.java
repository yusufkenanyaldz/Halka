package com.halka.app;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Insets;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/**
 * Halka'nın tek ekranı: index.html'i WebView'da açar.
 *
 * Web dosyaları (index.html, fonts/, icons/) derleme sırasında deponun kökünden
 * assets/www içine kopyalanır (app/build.gradle, webKopyala). Sayfa
 * https://appassets.androidplatform.net/www/ adresinden sunulur: gerçek bir https
 * kökeni olduğu için localStorage kalıcıdır ve Firebase sorunsuz çalışır.
 */
public class MainActivity extends Activity {

    static final String ALAN = "appassets.androidplatform.net";
    static final String ADRES = "https://" + ALAN + "/www/index.html";
    static final String EYLEM_TAMAMLA = "com.halka.app.TAMAMLA";

    static final int KOYU = Color.parseColor("#0e0e1a");
    static final int ACIK = Color.parseColor("#f5f5f8");

    private static final int DOSYA_SEC = 1;
    private static final int YEDEK_KAYDET = 2;
    static final int IZIN_BILDIRIM = 3;

    WebView web;
    private FrameLayout kok;
    private boolean sayfaHazir = false;
    private String bekleyenTamamla = null;
    private ValueCallback<Uri[]> dosyaGeri = null;
    private String bekleyenYedek = null;
    volatile int durumCubuguDp = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // İçerik durum çubuğunun altına kadar uzanır; üst boşluğu sayfa kendisi bırakır
        // (--sb, HalkaBridge.getStatusBarHeight). Alt boşluk (gezinme çubuğu, klavye)
        // aşağıda dolgu olarak verilir.
        Window w = getWindow();
        w.setStatusBarColor(Color.TRANSPARENT);
        w.setNavigationBarColor(KOYU);
        if (Build.VERSION.SDK_INT >= 30) {
            // Klavye payı da aşağıdaki dinleyiciden gelir (adjustResize burada etkisiz)
            w.setDecorFitsSystemWindows(false);
        } else {
            w.getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);
        }

        kok = new FrameLayout(this);
        kok.setBackgroundColor(KOYU);
        web = new WebView(this);
        web.setBackgroundColor(KOYU);
        kok.addView(web, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
        setContentView(kok);

        kok.setOnApplyWindowInsetsListener((v, ins) -> {
            int ust, alt, sol, sag;
            if (Build.VERSION.SDK_INT >= 30) {
                Insets s = ins.getInsets(WindowInsets.Type.systemBars());
                Insets k = ins.getInsets(WindowInsets.Type.ime());
                ust = s.top;
                alt = Math.max(s.bottom, k.bottom);
                sol = s.left;
                sag = s.right;
            } else {
                ust = ins.getSystemWindowInsetTop();
                alt = ins.getSystemWindowInsetBottom();
                sol = ins.getSystemWindowInsetLeft();
                sag = ins.getSystemWindowInsetRight();
            }
            v.setPadding(sol, 0, sag, alt);
            durumCubuguDp = Math.round(ust / getResources().getDisplayMetrics().density);
            if (sayfaHazir) durumCubuguYaz();
            // Pay burada verildi; WebView bir daha uygulamasın (klavyede çift boşluk olmasın)
            return Build.VERSION.SDK_INT >= 30 ? WindowInsets.CONSUMED : ins.consumeSystemWindowInsets();
        });

        WebSettings ws = web.getSettings();
        ws.setJavaScriptEnabled(true);
        ws.setDomStorageEnabled(true);          // localStorage: veri burada durur
        ws.setDatabaseEnabled(true);
        ws.setTextZoom(100);                    // düzen 100'e göre ölçüldü (tests/)
        ws.setAllowFileAccess(false);
        ws.setAllowContentAccess(true);

        web.addJavascriptInterface(new HalkaKopru(this), "HalkaBridge");

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                if (!ALAN.equals(u.getHost())) return null;   // internet (Firebase vb.) olduğu gibi
                String yol = u.getPath() == null ? "" : u.getPath();
                if (yol.startsWith("/")) yol = yol.substring(1);
                try {
                    InputStream in = getAssets().open(yol);
                    String tur = tur(yol);
                    return new WebResourceResponse(tur, tur.startsWith("text/") || tur.endsWith("json")
                            || tur.endsWith("javascript") ? "utf-8" : null, in);
                } catch (IOException e) {
                    return new WebResourceResponse("text/plain", "utf-8", 404, "Yok", null,
                            new ByteArrayInputStream(new byte[0]));
                }
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                if (ALAN.equals(u.getHost())) return false;
                // Dış bağlantılar tarayıcıda açılır, uygulamanın yerine geçmez
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, u));
                } catch (ActivityNotFoundException ignored) {
                }
                return true;
            }

            @Override
            public void onPageFinished(WebView v, String url) {
                sayfaHazir = true;
                durumCubuguYaz();
                if (bekleyenTamamla != null) {
                    // Sayfanın verisi (S) yüklensin diye kısa bir bekleme
                    web.postDelayed(MainActivity.this::tamamlaCalistir, 700);
                }
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            // Bu sınıfın atanmış olması confirm()/alert() pencerelerini açar (atanmazsa
            // confirm hep false döner: silme, arşivleme, yedek yükleme çalışmaz).

            // "Yedekten Geri Yükle": <input type=file>
            @Override
            public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> geri, FileChooserParams p) {
                if (dosyaGeri != null) dosyaGeri.onReceiveValue(null);
                dosyaGeri = geri;
                Intent niyet = new Intent(Intent.ACTION_GET_CONTENT);
                niyet.addCategory(Intent.CATEGORY_OPENABLE);
                niyet.setType("*/*");   // bazı dosya yöneticileri .json'u application/json saymaz
                try {
                    startActivityForResult(Intent.createChooser(niyet, "Yedek dosyasını seç"), DOSYA_SEC);
                } catch (ActivityNotFoundException e) {
                    dosyaGeri = null;
                    return false;
                }
                return true;
            }
        });

        web.loadUrl(ADRES);
        niyetIsle(getIntent());
    }

    static String tur(String yol) {
        String y = yol.toLowerCase();
        if (y.endsWith(".html")) return "text/html";
        if (y.endsWith(".js")) return "text/javascript";
        if (y.endsWith(".css")) return "text/css";
        if (y.endsWith(".json") || y.endsWith(".webmanifest")) return "application/json";
        if (y.endsWith(".svg")) return "image/svg+xml";
        if (y.endsWith(".png")) return "image/png";
        if (y.endsWith(".woff2")) return "font/woff2";
        if (y.endsWith(".woff")) return "font/woff";
        if (y.endsWith(".ttf")) return "font/ttf";
        return "application/octet-stream";
    }

    private void durumCubuguYaz() {
        int dp = durumCubuguDp;
        if (dp > 0) {
            web.evaluateJavascript(
                    "document.documentElement.style.setProperty('--sb','" + dp + "px')", null);
        }
    }

    // ---- Widget'tan gelen "tamamla" ----

    @Override
    protected void onNewIntent(Intent niyet) {
        super.onNewIntent(niyet);
        setIntent(niyet);
        niyetIsle(niyet);
    }

    private void niyetIsle(Intent niyet) {
        if (niyet == null || !EYLEM_TAMAMLA.equals(niyet.getAction())) return;
        String hid = niyet.getStringExtra("hid");
        niyet.setAction(null);   // ekran döndürülünce ikinci kez işlenmesin
        if (hid == null) return;
        bekleyenTamamla = hid;
        if (sayfaHazir) tamamlaCalistir();
    }

    private void tamamlaCalistir() {
        String hid = bekleyenTamamla;
        bekleyenTamamla = null;
        if (hid == null) return;
        web.evaluateJavascript("(function(){if(typeof widgetComplete==='function')widgetComplete("
                + JSONObject.quote(hid) + ",td())})()", null);
    }

    // ---- Geri tuşu: sayfa geri alacak bir şey bulamazsa (false) uygulama kapanır ----

    @Override
    public void onBackPressed() {
        if (!sayfaHazir) {
            super.onBackPressed();
            return;
        }
        web.evaluateJavascript(
                "(function(){try{return handleBack()===true}catch(e){return false}})()",
                deger -> {
                    if (!"true".equals(deger)) finish();
                });
    }

    // ---- Tema: açık temada durum/gezinme çubuğu simgeleri koyu ----

    void temaUygula(boolean acik) {
        int zemin = acik ? ACIK : KOYU;
        kok.setBackgroundColor(zemin);
        web.setBackgroundColor(zemin);
        getWindow().setNavigationBarColor(zemin);
        if (Build.VERSION.SDK_INT >= 30) {
            WindowInsetsController c = getWindow().getInsetsController();
            if (c != null) {
                int bayrak = WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                        | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
                c.setSystemBarsAppearance(acik ? bayrak : 0, bayrak);
            }
        } else {
            View d = getWindow().getDecorView();
            int f = d.getSystemUiVisibility();
            int bayrak = View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
            d.setSystemUiVisibility(acik ? (f | bayrak) : (f & ~bayrak));
        }
    }

    // ---- Yedek kaydetme (Android 9 ve öncesi): kullanıcı konumu seçer ----

    void yedekKonumSor(String ad, String icerik) {
        bekleyenYedek = icerik;
        Intent niyet = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        niyet.addCategory(Intent.CATEGORY_OPENABLE);
        niyet.setType("application/json");
        niyet.putExtra(Intent.EXTRA_TITLE, ad);
        try {
            startActivityForResult(niyet, YEDEK_KAYDET);
        } catch (ActivityNotFoundException e) {
            bekleyenYedek = null;
            jsToast("Yedek kaydedilemedi");
        }
    }

    void jsToast(String mesaj) {
        web.evaluateJavascript("(function(){if(typeof toast==='function')toast("
                + JSONObject.quote(mesaj) + ")})()", null);
    }

    @Override
    protected void onActivityResult(int istek, int sonuc, Intent veri) {
        super.onActivityResult(istek, sonuc, veri);
        if (istek == DOSYA_SEC) {
            if (dosyaGeri != null) {
                Uri[] secilen = null;
                if (sonuc == RESULT_OK && veri != null && veri.getData() != null) {
                    secilen = new Uri[]{veri.getData()};
                }
                dosyaGeri.onReceiveValue(secilen);
                dosyaGeri = null;
            }
        } else if (istek == YEDEK_KAYDET) {
            String icerik = bekleyenYedek;
            bekleyenYedek = null;
            if (sonuc != RESULT_OK || veri == null || veri.getData() == null || icerik == null) return;
            try (OutputStream o = getContentResolver().openOutputStream(veri.getData())) {
                if (o == null) throw new IOException("akış yok");
                o.write(icerik.getBytes(StandardCharsets.UTF_8));
                jsToast("Yedek kaydedildi");
            } catch (IOException e) {
                jsToast("Yedek kaydedilemedi");
            }
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        web.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
        // Gün değişmiş olabilir: sayfa ana ekranı ve widget'ı tazelesin
        if (sayfaHazir) {
            web.evaluateJavascript("(function(){try{if(document.querySelector('#s-main.active')"
                    + "&&typeof renderMain==='function')renderMain();if(typeof pushWidgetData==='function')"
                    + "pushWidgetData()}catch(e){}})()", null);
        }
    }
}
