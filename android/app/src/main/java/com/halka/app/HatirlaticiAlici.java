package com.halka.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Hatırlatıcı alarmı çaldığında: bildirimi gösterir, bir sonraki günü kurar. */
public class HatirlaticiAlici extends BroadcastReceiver {
    @Override
    public void onReceive(Context bag, Intent niyet) {
        String id = niyet.getStringExtra("id");
        if (id != null) Hatirlatici.caldi(bag, id);
    }
}
