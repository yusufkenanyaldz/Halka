package com.halka.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * Telefon yeniden başlayınca, uygulama güncellenince ya da saat/saat dilimi değişince
 * alarmlar silinir ya da kayar: hepsini yeniden kurar. Widget'ı da tazeler (gün değişmiş olabilir).
 */
public class AcilisAlici extends BroadcastReceiver {
    @Override
    public void onReceive(Context bag, Intent niyet) {
        Hatirlatici.hepsiniPlanla(bag);
        HalkaWidget.hepsiniGuncelle(bag);
    }
}
