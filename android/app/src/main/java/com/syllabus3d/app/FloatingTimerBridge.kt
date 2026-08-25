package com.syllabus3d.app

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.webkit.JavascriptInterface

class FloatingTimerBridge(private val activity: Activity) {
    @JavascriptInterface
    fun isOverlayPermissionGranted(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Settings.canDrawOverlays(activity)
        } else true
    }

    @JavascriptInterface
    fun requestOverlayPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(activity)) {
            val intent = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + activity.packageName))
            activity.startActivity(intent)
        }
    }

    @JavascriptInterface
    fun startFloatingTimer(jsonState: String) {
        val intent = Intent(activity, FloatingTimerService::class.java).apply {
            action = FloatingTimerService.ACTION_START
            putExtra(FloatingTimerService.EXTRA_JSON_STATE, jsonState)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) activity.startForegroundService(intent)
        else activity.startService(intent)
    }

    @JavascriptInterface
    fun updateFloatingTimer(jsonState: String) {
        val intent = Intent(activity, FloatingTimerService::class.java).apply {
            action = FloatingTimerService.ACTION_UPDATE
            putExtra(FloatingTimerService.EXTRA_JSON_STATE, jsonState)
        }
        activity.startService(intent)
    }

    @JavascriptInterface
    fun stopFloatingTimer() {
        val intent = Intent(activity, FloatingTimerService::class.java).apply {
            action = FloatingTimerService.ACTION_STOP
        }
        activity.startService(intent)
    }
}