package com.halka.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RectF;
import android.graphics.Typeface;
import android.net.Uri;
import android.os.Bundle;
import android.text.TextPaint;
import android.text.TextUtils;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * Ana ekran widget'ı. Veriyi sayfa gönderir (HalkaBridge.updateWidget, index.html pushWidgetData):
 * {date, done, total, streak, tema, habits:[{id, name, color, pct, done, type}]}.
 * tema: "koyu" | "acik" (uygulamadaki Widget Ayarları → Widget Teması).
 *
 * Widget tek bir resim olarak çizilir (başlık + en çok 4 halka). Halkaların üstünde görünmez
 * dokunma alanları var: bugün yapılmamış bir halkaya dokununca uygulama açılır ve o alışkanlık
 * tamamlanır (MainActivity, widgetComplete). Başka yere dokununca uygulama açılır.
 */
public class HalkaWidget extends AppWidgetProvider {

    private static final String DEPO = "widget";
    private static final int[] HUCRE = {R.id.w_h0, R.id.w_h1, R.id.w_h2, R.id.w_h3};

    static void veriKaydet(Context bag, String json) {
        bag.getSharedPreferences(DEPO, Context.MODE_PRIVATE).edit().putString("veri", json).apply();
    }

    static void hepsiniGuncelle(Context bag) {
        AppWidgetManager m = AppWidgetManager.getInstance(bag);
        if (m == null) return;
        int[] idler = m.getAppWidgetIds(new ComponentName(bag, HalkaWidget.class));
        for (int id : idler) guncelle(bag, m, id);
    }

    @Override
    public void onUpdate(Context bag, AppWidgetManager m, int[] idler) {
        for (int id : idler) guncelle(bag, m, id);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context bag, AppWidgetManager m, int id, Bundle yeni) {
        guncelle(bag, m, id);
    }

    static void guncelle(Context bag, AppWidgetManager m, int wid) {
        Bundle o = m.getAppWidgetOptions(wid);
        int gDp = o.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 0);
        int yDp = o.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, 0);
        if (gDp <= 0) gDp = 250;
        if (yDp <= 0) yDp = 110;
        boolean kucuk = yDp < 100;          // 4x1 gibi alçak widget: başlık yok, yalnız halkalar

        Veri v = Veri.oku(bag);
        int enCok = gDp >= 230 ? 4 : (gDp >= 160 ? 3 : 2);
        int n = Math.min(v.adet(), enCok);

        float d = bag.getResources().getDisplayMetrics().density;
        float olcek = Math.min(1f, 1100f / (gDp * d));   // çok büyük resim göndermeyelim
        int W = Math.max(1, Math.round(gDp * d * olcek));
        int H = Math.max(1, Math.round(yDp * d * olcek));
        Bitmap bmp = ciz(v, n, W, H, d * olcek, kucuk);

        RemoteViews rv = new RemoteViews(bag.getPackageName(),
                kucuk ? R.layout.widget_kucuk : R.layout.widget_buyuk);
        rv.setImageViewBitmap(R.id.w_resim, bmp);
        rv.setOnClickPendingIntent(R.id.w_resim, acNiyeti(bag));
        for (int i = 0; i < HUCRE.length; i++) {
            if (i < n) {
                rv.setViewVisibility(HUCRE[i], View.VISIBLE);
                JSONObject h = v.aliskanlik(i);
                boolean yapildi = h.optBoolean("done", false);
                rv.setOnClickPendingIntent(HUCRE[i], yapildi ? acNiyeti(bag)
                        : tamamlaNiyeti(bag, wid, i, h.optString("id", "")));
            } else {
                rv.setViewVisibility(HUCRE[i], View.GONE);
            }
        }
        m.updateAppWidget(wid, rv);
    }

    private static PendingIntent acNiyeti(Context bag) {
        Intent i = new Intent(bag, MainActivity.class);
        i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        return PendingIntent.getActivity(bag, 1, i,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private static PendingIntent tamamlaNiyeti(Context bag, int wid, int sira, String hid) {
        Intent i = new Intent(bag, MainActivity.class);
        i.setAction(MainActivity.EYLEM_TAMAMLA);
        i.setData(Uri.parse("halka://tamamla/" + Uri.encode(hid)));   // her halka ayrı niyet
        i.putExtra("hid", hid);
        i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        return PendingIntent.getActivity(bag, 100 + wid * 10 + sira, i,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    // ---- Çizim ----

    static Bitmap ciz(Veri v, int n, int W, int H, float d, boolean kucuk) {
        Bitmap bmp = Bitmap.createBitmap(W, H, Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(bmp);
        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);

        boolean acik = v.acik;
        int yazi1 = Color.parseColor(acik ? "#111111" : "#f0f0f5");      // başlık, yüzde
        int yazi2 = Color.parseColor(acik ? "#44445a" : "#a8a8bc");      // alt satır
        int yaziAd = Color.parseColor(acik ? "#44445a" : "#c8c8d8");     // alışkanlık adı

        // Zemin: uygulamanın yüzeyi, yuvarlak köşe
        p.setColor(Color.parseColor(acik ? "#ffffff" : "#121220"));
        RectF zemin = new RectF(0, 0, W, H);
        c.drawRoundRect(zemin, 20 * d, 20 * d, p);
        p.setStyle(Paint.Style.STROKE);
        p.setStrokeWidth(1 * d);
        p.setColor(acik ? Color.argb(22, 0, 0, 0) : Color.argb(28, 255, 255, 255));
        c.drawRoundRect(new RectF(d / 2, d / 2, W - d / 2, H - d / 2), 20 * d, 20 * d, p);
        p.setStyle(Paint.Style.FILL);

        TextPaint t = new TextPaint(Paint.ANTI_ALIAS_FLAG);
        float ust = 0;
        if (!kucuk) {
            float basY = H * 0.34f;
            t.setTypeface(Typeface.create(Typeface.SERIF, Typeface.BOLD));
            t.setTextSize(17 * d);
            t.setColor(yazi1);
            c.drawText("Halka", 16 * d, basY * 0.55f + 6 * d, t);

            t.setTypeface(Typeface.DEFAULT);
            t.setTextSize(12 * d);
            t.setColor(yazi2);
            String alt = v.toplam > 0 ? v.yapilan + "/" + v.toplam + " bugün" : "Bugün plan yok";
            if (v.seri > 0) alt += "  ·  " + v.seri + " gün seri";
            c.drawText(TextUtils.ellipsize(alt, t, W - 32 * d, TextUtils.TruncateAt.END).toString(),
                    16 * d, basY * 0.55f + 24 * d, t);
            ust = basY;
        }

        float satirY = H - ust;
        if (n == 0) {
            t.setTextSize(13 * d);
            t.setColor(yazi2);
            String m = "Uygulamada alışkanlık ekle";
            float tw = t.measureText(m);
            c.drawText(m, (W - tw) / 2, ust + satirY / 2 + 5 * d, t);
            return bmp;
        }

        float hucreG = (float) W / n;
        float yaziY = 11 * d;                                    // ad satırı
        float r = Math.min(hucreG * 0.36f, (satirY - yaziY - 14 * d) / 2f);
        if (r < 8 * d) r = 8 * d;
        float kalinlik = Math.max(3 * d, r * 0.22f);
        float cy = ust + (satirY - yaziY - 4 * d) / 2f + 2 * d;

        for (int i = 0; i < n; i++) {
            JSONObject h = v.aliskanlik(i);
            int renk = renk(h.optString("color", "#b8a5f0"));
            int koyuRenk = acik ? koyulastir(renk) : renk;   // beyaz zeminde okunur ton
            int yuzde = Math.max(0, Math.min(100, h.optInt("pct", 0)));
            boolean yapildi = h.optBoolean("done", false);
            float cx = hucreG * i + hucreG / 2f;
            RectF kutu = new RectF(cx - r, cy - r, cx + r, cy + r);

            p.setStyle(Paint.Style.STROKE);
            p.setStrokeWidth(kalinlik);
            p.setStrokeCap(Paint.Cap.ROUND);
            p.setColor(Color.argb(acik ? 55 : 40, Color.red(renk), Color.green(renk), Color.blue(renk)));
            c.drawArc(kutu, 0, 360, false, p);
            if (yuzde > 0) {
                p.setColor(renk);
                c.drawArc(kutu, -90, 360f * yuzde / 100f, false, p);
            }

            if (yapildi) {
                // Bugün tamam: halkanın içinde onay işareti
                p.setStrokeWidth(Math.max(2 * d, r * 0.16f));
                p.setColor(koyuRenk);
                Path onay = new Path();
                onay.moveTo(cx - r * 0.38f, cy + r * 0.02f);
                onay.lineTo(cx - r * 0.1f, cy + r * 0.3f);
                onay.lineTo(cx + r * 0.42f, cy - r * 0.28f);
                c.drawPath(onay, p);
            } else {
                p.setStyle(Paint.Style.FILL);
                t.setTypeface(Typeface.DEFAULT_BOLD);
                t.setTextSize(Math.max(9 * d, r * 0.42f));
                t.setColor(yazi1);
                String y = "%" + yuzde;
                c.drawText(y, cx - t.measureText(y) / 2, cy + t.getTextSize() * 0.36f, t);
            }
            p.setStyle(Paint.Style.FILL);

            t.setTypeface(Typeface.DEFAULT);
            t.setTextSize(10.5f * d);
            t.setColor(yaziAd);
            String ad = TextUtils.ellipsize(h.optString("name", ""), t, hucreG - 8 * d,
                    TextUtils.TruncateAt.END).toString();
            c.drawText(ad, cx - t.measureText(ad) / 2, cy + r + kalinlik / 2 + yaziY + 2 * d, t);
        }
        return bmp;
    }

    /** Pastel rengi açık zeminde okunur olacak kadar koyulaştırır. */
    static int koyulastir(int c) {
        float[] hsv = new float[3];
        Color.colorToHSV(c, hsv);
        hsv[1] = Math.min(1f, hsv[1] * 1.3f + 0.15f);
        hsv[2] = Math.min(hsv[2], 0.55f);
        return Color.HSVToColor(hsv);
    }

    private static int renk(String s) {
        try {
            return Color.parseColor(s.trim());
        } catch (Exception e) {
            return Color.parseColor("#b8a5f0");
        }
    }

    /** Sayfanın gönderdiği son veri. Tarih bugün değilse gün değişmiş: bugün için hiçbir şey yapılmadı. */
    static final class Veri {
        int yapilan, toplam, seri;
        boolean acik;
        JSONArray liste = new JSONArray();

        int adet() {
            return liste.length();
        }

        JSONObject aliskanlik(int i) {
            JSONObject o = liste.optJSONObject(i);
            return o != null ? o : new JSONObject();
        }

        static Veri oku(Context bag) {
            Veri v = new Veri();
            String s = bag.getSharedPreferences(DEPO, Context.MODE_PRIVATE).getString("veri", null);
            if (s == null) return v;
            try {
                JSONObject o = new JSONObject(s);
                v.yapilan = o.optInt("done", 0);
                v.toplam = o.optInt("total", 0);
                v.seri = o.optInt("streak", 0);
                v.acik = "acik".equals(o.optString("tema", "koyu"));
                JSONArray a = o.optJSONArray("habits");
                if (a != null) v.liste = a;
                String bugun = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
                if (!bugun.equals(o.optString("date", bugun))) {
                    v.yapilan = 0;
                    for (int i = 0; i < v.liste.length(); i++) {
                        JSONObject h = v.liste.optJSONObject(i);
                        if (h != null) h.put("done", false);
                    }
                }
            } catch (Exception ignored) {
            }
            return v;
        }
    }
}
