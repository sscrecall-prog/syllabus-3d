package com.syllabus3d.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.SystemClock
import android.provider.Settings
import androidx.core.app.NotificationCompat
import org.json.JSONObject

class FloatingTimerService : Service() {
    companion object {
        const val CHANNEL_ID = "syllabus3d_focus_timer_channel"
        const val NOTIFICATION_ID = 3001
        const val ACTION_START = "com.syllabus3d.app.ACTION_START"
        const val ACTION_PAUSE = "com.syllabus3d.app.ACTION_PAUSE"
        const val ACTION_RESUME = "com.syllabus3d.app.ACTION_RESUME"
        const val ACTION_STOP = "com.syllabus3d.app.ACTION_STOP"
        const val ACTION_UPDATE = "com.syllabus3d.app.ACTION_UPDATE"
        const val EXTRA_JSON_STATE = "extra_json_state"
    }

    private var overlay: FloatingTimerOverlay? = null
    private val handler = Handler(Looper.getMainLooper())
    private var isRunning = false
    private var isPaused = false
    private var targetElapsedRealtime: Long = 0
    private var totalDurationSec: Int = 25 * 60
    private var remainingSec: Int = 25 * 60
    private var topicName: String = "Study Session"

    private val tickRunnable = object : Runnable {
        override fun run() {
            if (isRunning && !isPaused) {
                val nowElapsed = SystemClock.elapsedRealtime()
                val rem = Math.max(0L, (targetElapsedRealtime - nowElapsed + 999L) / 1000L).toInt()
                remainingSec = rem
                overlay?.updateCountdown(formatTime(rem), (totalDurationSec - rem).toFloat() / totalDurationSec.toFloat(), isPaused)
                updateNotification()
                if (rem <= 0) {
                    onTimerCompleted()
                    return
                }
            }
            handler.postDelayed(this, 500)
        }
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                val jsonStr = intent.getStringExtra(EXTRA_JSON_STATE)
                parseJsonAndStart(jsonStr)
            }
            ACTION_PAUSE -> pauseTimer()
            ACTION_RESUME -> resumeTimer()
            ACTION_STOP -> stopTimer()
            ACTION_UPDATE -> {
                val jsonStr = intent.getStringExtra(EXTRA_JSON_STATE)
                updateStateFromJson(jsonStr)
            }
        }
        return START_STICKY
    }

    private fun parseJsonAndStart(jsonStr: String?) {
        if (jsonStr != null) {
            try {
                val json = JSONObject(jsonStr)
                totalDurationSec = json.optInt("totalDurationSec", 25 * 60)
                remainingSec = json.optInt("remainingSec", totalDurationSec)
                topicName = json.optString("topicName", "Study Focus")
            } catch (e: Exception) {}
        }
        targetElapsedRealtime = SystemClock.elapsedRealtime() + (remainingSec * 1000L)
        isRunning = true
        isPaused = false
        startForeground(NOTIFICATION_ID, buildNotification())
        if (Settings.canDrawOverlays(this)) {
            if (overlay == null) {
                overlay = FloatingTimerOverlay(this, object : FloatingTimerOverlay.OverlayListener {
                    override fun onPauseClicked() = pauseTimer()
                    override fun onResumeClicked() = resumeTimer()
                    override fun onCloseClicked() { overlay?.hide() }
                    override fun onBodyClicked() {
                        val openAppIntent = Intent(this@FloatingTimerService, MainActivity::class.java).apply {
                            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
                        }
                        startActivity(openAppIntent)
                    }
                })
            }
            overlay?.show()
            overlay?.updateCountdown(formatTime(remainingSec), 0f, isPaused)
        }
        handler.removeCallbacks(tickRunnable)
        handler.post(tickRunnable)
    }

    private fun pauseTimer() {
        if (!isRunning || isPaused) return
        isPaused = true
        val nowElapsed = SystemClock.elapsedRealtime()
        remainingSec = Math.max(0L, (targetElapsedRealtime - nowElapsed + 999L) / 1000L).toInt()
        overlay?.updateCountdown(formatTime(remainingSec), (totalDurationSec - remainingSec).toFloat() / totalDurationSec.toFloat(), true)
        updateNotification()
    }

    private fun resumeTimer() {
        if (!isRunning || !isPaused) return
        isPaused = false
        targetElapsedRealtime = SystemClock.elapsedRealtime() + (remainingSec * 1000L)
        overlay?.updateCountdown(formatTime(remainingSec), (totalDurationSec - remainingSec).toFloat() / totalDurationSec.toFloat(), false)
        updateNotification()
    }

    private fun stopTimer() {
        isRunning = false
        isPaused = false
        handler.removeCallbacks(tickRunnable)
        overlay?.hide()
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun updateStateFromJson(jsonStr: String?) {
        if (jsonStr == null) return
        try {
            val json = JSONObject(jsonStr)
            val status = json.optString("status", "running")
            val rem = json.optInt("remainingSec", remainingSec)
            remainingSec = rem
            if (status == "paused") pauseTimer()
            else if (status == "running" && isPaused) resumeTimer()
            else if (status == "idle" || status == "completed") stopTimer()
        } catch (e: Exception) {}
    }

    private fun onTimerCompleted() {
        isRunning = false
        isPaused = false
        handler.removeCallbacks(tickRunnable)
        overlay?.hide()
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun buildNotification(): Notification {
        val openIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val pendingOpen = PendingIntent.getActivity(this, 0, openIntent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        val pauseIntent = Intent(this, FloatingTimerService::class.java).apply { action = ACTION_PAUSE }
        val pendingPause = PendingIntent.getService(this, 1, pauseIntent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        val resumeIntent = Intent(this, FloatingTimerService::class.java).apply { action = ACTION_RESUME }
        val pendingResume = PendingIntent.getService(this, 2, resumeIntent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        val stopIntent = Intent(this, FloatingTimerService::class.java).apply { action = ACTION_STOP }
        val pendingStop = PendingIntent.getService(this, 3, stopIntent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        val statusText = if (isPaused) "Paused • $topicName" else "${formatTime(remainingSec)} remaining • $topicName"
        val builder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Syllabus 3D — Focus Timer")
            .setContentText(statusText)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentIntent(pendingOpen)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
        if (isPaused) {
            builder.addAction(android.R.drawable.ic_media_play, "Resume", pendingResume)
        } else {
            builder.addAction(android.R.drawable.ic_media_pause, "Pause", pendingPause)
        }
        builder.addAction(android.R.drawable.ic_menu_close_clear_cancel, "Stop", pendingStop)
        return builder.build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(CHANNEL_ID, "Focus Study Timer", NotificationManager.IMPORTANCE_LOW).apply {
                description = "Active floating focus timer notification"
                setShowBadge(false)
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    private fun formatTime(secs: Int): String {
        val m = secs / 60
        val s = secs % 60
        return String.format("%02d:%02d", m, s)
    }

    override fun onDestroy() {
        super.onDestroy()
        handler.removeCallbacks(tickRunnable)
        overlay?.hide()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}