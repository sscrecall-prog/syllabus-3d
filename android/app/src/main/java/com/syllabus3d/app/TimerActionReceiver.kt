package com.syllabus3d.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class TimerActionReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val serviceIntent = Intent(context, FloatingTimerService::class.java).apply {
            action = intent.action
        }
        context.startService(serviceIntent)
    }
}