package com.halka.app;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Calendar;

/**
 * Hatırlatıcılar: her alışkanlık için bir alarm. Bilgi SharedPreferences'ta tutulur
 * (id -> {ad, saat, mesaj, gunler}); alarm çalınca bildirim gösterilir ve bir sonraki
 * uygun gün için yeniden kurulur. Telefon yeniden başlayınca AcilisAlici hepsini yeniden kurar.
 * Uygulama her açılışta bütün hatırlatıcıları zaten yeniden gönderir (index.html, syncNotif).
 */
final class Hatirlatici {

    static final String KANAL = "hatirlatici";
    private static final String DEPO = "hatirlaticilar";

    private Hatirlatici() {
    }

    static void kur(Context bag, String id, String ad, String saat, String mesaj, String gunlerJson) {
        try {
            JSONObject o = new JSONObject();
            o.put("ad", ad);
            o.put("saat", saat);
            o.put("mesaj", mesaj);
            o.put("gunler", new JSONArray(gunlerJson));
            depo(bag).edit().putString(id, o.toString()).apply();
        } catch (Exception e) {
            return;
        }
        kanalKur(bag);
        planla(bag, id);
    }

    static void iptal(Context bag, String id) {
        AlarmManager am = (AlarmManager) bag.getSystemService(Context.ALARM_SERVICE);
        PendingIntent pi = PendingIntent.getBroadcast(bag, id.hashCode(), alarmNiyeti(bag, id),
                PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE);
        if (pi != null && am != null) {
            am.cancel(pi);
            pi.cancel();
        }
        depo(bag).edit().remove(id).apply();
    }

    static void hepsiniPlanla(Context bag) {
        for (String id : depo(bag).getAll().keySet()) planla(bag, id);
    }

    /** Alarm çaldığında: bildirimi göster, sonraki günü kur. */
    static void caldi(Context bag, String id) {
        JSONObject o = oku(bag, id);
        if (o == null) return;
        bildirimGoster(bag, id.hashCode(), o.optString("ad", "Halka"), o.optString("mesaj", ""));
        planla(bag, id);
    }

    static void planla(Context bag, String id) {
        JSONObject o = oku(bag, id);
        if (o == null) return;
        long zaman = sonraki(o.optString("saat", ""), o.optJSONArray("gunler"), System.currentTimeMillis());
        if (zaman <= 0) return;
        AlarmManager am = (AlarmManager) bag.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        PendingIntent pi = PendingIntent.getBroadcast(bag, id.hashCode(), alarmNiyeti(bag, id),
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        // Tam zamanlı alarm izni yoksa (Android 12+ ayarı) birkaç dakika sapabilen alarm
        if (Build.VERSION.SDK_INT >= 31 && !am.canScheduleExactAlarms()) {
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, zaman, pi);
        } else {
            am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, zaman, pi);
        }
    }

    /**
     * "SS:DD" saatinde, gunler (ISO: 1=Pzt … 7=Paz) içindeki bir sonraki an. Boş gün listesi
     * ya da bozuk saat için 0.
     */
    static long sonraki(String saat, JSONArray gunler, long simdi) {
        String[] p = saat.split(":");
        if (p.length != 2 || gunler == null || gunler.length() == 0) return 0;
        int ss, dd;
        try {
            ss = Integer.parseInt(p[0].trim());
            dd = Integer.parseInt(p[1].trim());
        } catch (NumberFormatException e) {
            return 0;
        }
        Calendar c = Calendar.getInstance();
        c.setTimeInMillis(simdi);
        c.set(Calendar.HOUR_OF_DAY, ss);
        c.set(Calendar.MINUTE, dd);
        c.set(Calendar.SECOND, 0);
        c.set(Calendar.MILLISECOND, 0);
        for (int i = 0; i < 8; i++) {
            if (c.getTimeInMillis() > simdi + 1000 && gunIcinde(gunler, iso(c))) return c.getTimeInMillis();
            c.add(Calendar.DAY_OF_MONTH, 1);
        }
        return 0;
    }

    /** Calendar gününü ISO'ya çevirir: Pazartesi 1 … Pazar 7. */
    static int iso(Calendar c) {
        int g = c.get(Calendar.DAY_OF_WEEK);   // Pazar=1 … Cumartesi=7
        return g == Calendar.SUNDAY ? 7 : g - 1;
    }

    private static boolean gunIcinde(JSONArray gunler, int iso) {
        for (int i = 0; i < gunler.length(); i++) if (gunler.optInt(i) == iso) return true;
        return false;
    }

    static void kanalKur(Context bag) {
        NotificationManager nm = (NotificationManager) bag.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null || nm.getNotificationChannel(KANAL) != null) return;
        NotificationChannel k = new NotificationChannel(KANAL, "Hatırlatıcılar",
                NotificationManager.IMPORTANCE_DEFAULT);
        k.setDescription("Alışkanlık hatırlatıcıları");
        nm.createNotificationChannel(k);
    }

    static void bildirimGoster(Context bag, int no, String baslik, String metin) {
        kanalKur(bag);
        NotificationManager nm = (NotificationManager) bag.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;
        Intent ac = new Intent(bag, MainActivity.class);
        ac.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pi = PendingIntent.getActivity(bag, 0, ac,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification n = new Notification.Builder(bag, KANAL)
                .setSmallIcon(R.drawable.ic_bildirim)
                .setContentTitle(baslik)
                .setContentText(metin)
                .setStyle(new Notification.BigTextStyle().bigText(metin))
                .setAutoCancel(true)
                .setContentIntent(pi)
                .build();
        try {
            nm.notify(no, n);
        } catch (SecurityException ignored) {
            // Bildirim izni verilmemiş (Android 13+)
        }
    }

    private static Intent alarmNiyeti(Context bag, String id) {
        Intent i = new Intent(bag, HatirlaticiAlici.class);
        i.setAction("com.halka.app.HATIRLAT");
        i.putExtra("id", id);
        return i;
    }

    private static JSONObject oku(Context bag, String id) {
        String s = depo(bag).getString(id, null);
        if (s == null) return null;
        try {
            return new JSONObject(s);
        } catch (Exception e) {
            return null;
        }
    }

    private static SharedPreferences depo(Context bag) {
        return bag.getSharedPreferences(DEPO, Context.MODE_PRIVATE);
    }
}
