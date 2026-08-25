package com.syllabus3d.app

import android.content.Context
import android.graphics.PixelFormat
import android.os.Build
import android.view.Gravity
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.ImageButton
import android.widget.ProgressBar
import android.widget.TextView

class FloatingTimerOverlay(
    private val context: Context,
    private val listener: OverlayListener
) {
    interface OverlayListener {
        fun onPauseClicked()
        fun onResumeClicked()
        fun onCloseClicked()
        fun onBodyClicked()
    }

    private val windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
    private var floatView: View? = null
    private var isViewAdded = false
    private var params: WindowManager.LayoutParams? = null
    private var initialX = 0
    private var initialY = 0
    private var initialTouchX = 0f
    private var initialTouchY = 0f
    private var hasMoved = false

    init {
        val layoutFlag = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }
        params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            layoutFlag,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
            WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
            WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = 30
            y = 150
        }
    }

    fun show() {
        if (isViewAdded) return
        floatView = LayoutInflater.from(context).inflate(R.layout.layout_floating_timer, null)
        setupListeners()
        try {
            windowManager.addView(floatView, params)
            isViewAdded = true
        } catch (e: Exception) { e.printStackTrace() }
    }

    private fun setupListeners() {
        val view = floatView ?: return
        val btnPlayPause = view.findViewById<ImageButton>(R.id.btn_play_pause)
        val btnClose = view.findViewById<ImageButton>(R.id.btn_close)
        btnPlayPause?.setOnClickListener {
            if (btnPlayPause.tag == "paused") listener.onResumeClicked()
            else listener.onPauseClicked()
        }
        btnClose?.setOnClickListener { listener.onCloseClicked() }
        view.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initialX = params?.x ?: 0
                    initialY = params?.y ?: 0
                    initialTouchX = event.rawX
                    initialTouchY = event.rawY
                    hasMoved = false
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    val dx = (event.rawX - initialTouchX).toInt()
                    val dy = (event.rawY - initialTouchY).toInt()
                    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) hasMoved = true
                    params?.x = initialX + dx
                    params?.y = initialY + dy
                    try { windowManager.updateViewLayout(floatView, params) } catch (e: Exception) {}
                    true
                }
                MotionEvent.ACTION_UP -> {
                    if (!hasMoved) listener.onBodyClicked()
                    true
                }
                else -> false
            }
        }
    }

    fun updateCountdown(timeText: String, progress: Float, isPaused: Boolean) {
        val view = floatView ?: return
        val tvTime = view.findViewById<TextView>(R.id.tv_countdown)
        val tvSub = view.findViewById<TextView>(R.id.tv_subtitle)
        val btnPlayPause = view.findViewById<ImageButton>(R.id.btn_play_pause)
        val progressBar = view.findViewById<ProgressBar>(R.id.pb_progress)
        tvTime?.text = "🛡 " + timeText
        tvSub?.text = if (isPaused) "Paused" else "Time remaining"
        tvSub?.setTextColor(if (isPaused) 0xFFFACC15.toInt() else 0xFF94A3B8.toInt())
        if (isPaused) {
            btnPlayPause?.setImageResource(android.R.drawable.ic_media_play)
            btnPlayPause?.tag = "paused"
        } else {
            btnPlayPause?.setImageResource(android.R.drawable.ic_media_pause)
            btnPlayPause?.tag = "running"
        }
        progressBar?.progress = (progress * 100).toInt()
    }

    fun hide() {
        if (!isViewAdded || floatView == null) return
        try {
            windowManager.removeView(floatView)
            isViewAdded = false
            floatView = null
        } catch (e: Exception) { e.printStackTrace() }
    }
}