package com.playra.tv

import android.net.Uri
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.widget.ProgressBar
import android.widget.TextView
import androidx.fragment.app.FragmentActivity
import com.google.android.exoplayer2.ExoPlayer
import com.google.android.exoplayer2.MediaItem
import com.google.android.exoplayer2.ui.PlayerView
import com.google.android.exoplayer2.util.Util

class VideoPlayerActivity : FragmentActivity() {

    private var player: ExoPlayer? = null
    private lateinit var playerView: PlayerView
    private lateinit var progressBar: ProgressBar
    private lateinit var titleText: TextView
    private var playWhenReady = true
    private var currentWindow = 0
    private var playbackPosition = 0L

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_player)

        playerView = findViewById(R.id.video_view)
        progressBar = findViewById(R.id.progress_bar)
        titleText = findViewById(R.id.video_title)

        val videoUrl = intent.getStringExtra("VIDEO_URL") ?: ""
        val videoTitle = intent.getStringExtra("VIDEO_TITLE") ?: ""

        titleText.text = videoTitle

        // Keep screen on during playback
        window.addFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    }

    private fun initializePlayer(videoUrl: String) {
        player = ExoPlayer.Builder(this)
            .build()
            .also { exoPlayer ->
                playerView.player = exoPlayer

                val mediaItem = MediaItem.fromUri(videoUrl)
                exoPlayer.setMediaItem(mediaItem)
                exoPlayer.playWhenReady = playWhenReady
                exoPlayer.seekTo(currentWindow, playbackPosition)
                exoPlayer.prepare()
            }
    }

    private fun releasePlayer() {
        player?.run {
            playbackPosition = this.currentPosition
            currentWindow = this.currentWindowIndex
            playWhenReady = this.playWhenReady
            release()
        }
        player = null
    }

    // Handle TV remote controls
    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        when (keyCode) {
            KeyEvent.KEYCODE_DPAD_CENTER,
            KeyEvent.KEYCODE_ENTER,
            KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE -> {
                player?.let {
                    if (it.isPlaying) {
                        it.pause()
                    } else {
                        it.play()
                    }
                }
                return true
            }
            KeyEvent.KEYCODE_DPAD_RIGHT,
            KeyEvent.KEYCODE_MEDIA_FAST_FORWARD -> {
                player?.seekForward()
                return true
            }
            KeyEvent.KEYCODE_DPAD_LEFT,
            KeyEvent.KEYCODE_MEDIA_REWIND -> {
                player?.seekBack()
                return true
            }
            KeyEvent.KEYCODE_MEDIA_STOP -> {
                player?.stop()
                finish()
                return true
            }
            KeyEvent.KEYCODE_BACK -> {
                // Show controls before exiting
                playerView.showController()
                finish()
                return true
            }
        }
        return super.onKeyDown(keyCode, event)
    }

    public override fun onStart() {
        super.onStart()
        if (Util.SDK_INT > 23) {
            val videoUrl = intent.getStringExtra("VIDEO_URL") ?: ""
            initializePlayer(videoUrl)
        }
    }

    public override fun onResume() {
        super.onResume()
        hideSystemUi()
        if ((Util.SDK_INT <= 23 || player == null)) {
            val videoUrl = intent.getStringExtra("VIDEO_URL") ?: ""
            initializePlayer(videoUrl)
        }
    }

    public override fun onPause() {
        super.onPause()
        if (Util.SDK_INT <= 23) {
            releasePlayer()
        }
    }

    public override fun onStop() {
        super.onStop()
        if (Util.SDK_INT > 23) {
            releasePlayer()
        }
    }

    private fun hideSystemUi() {
        playerView.systemUiVisibility = (View.SYSTEM_UI_FLAG_LOW_PROFILE
                or View.SYSTEM_UI_FLAG_FULLSCREEN
                or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION)
    }
}
