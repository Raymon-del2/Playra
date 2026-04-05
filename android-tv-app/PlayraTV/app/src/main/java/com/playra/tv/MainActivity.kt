package com.playra.tv

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.os.Bundle
import android.util.Log
import android.view.KeyEvent
import android.view.View
import android.webkit.*
import android.widget.FrameLayout
import androidx.appcompat.app.AppCompatActivity
import androidx.webkit.WebViewClientCompat
import java.io.File
import java.io.FileOutputStream

class MainActivity : AppCompatActivity() {
    
    companion object {
        const val TAG = "PlayraTV"
        const val BASE_URL = "https://playra.vercel.app" // Change to your URL
    }

    private lateinit var webView: WebView
    private lateinit var container: FrameLayout
    private var lastClickTime: Long = 0
    
    // UI Injection - Load custom CSS/JS from assets
    private val uiInjectionEnabled = true

    @SuppressLint("SetJavaScriptEnabled", "AddJavascriptInterface")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        container = FrameLayout(this)
        setContentView(container)

        webView = WebView(this)
        container.addView(webView, FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT
        ))

        setupWebView()
        loadUrl(BASE_URL)
    }

    private fun setupWebView() {
        val settings = webView.settings
        
        // Basic settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.cacheMode = WebSettings.LOAD_DEFAULT
        settings.mediaPlaybackRequiresUserGesture = false
        
        // Allow mixed content for development
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        
        // User agent for TV
        settings.userAgentString = "Mozilla/5.0 (Linux; Android 11; Build/RP1A.200720.012) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"

        // WebView client
        webView.webViewClient = object : WebViewClientCompat() {
            override fun shouldOverrideUrlLoading(view: WebView, url: String): Boolean {
                Log.d(TAG, "Loading URL: $url")
                
                // Handle external links
                return when {
                    url.startsWith("playra://") -> {
                        handleDeepLink(url)
                        true
                    }
                    url.startsWith("http://") || url.startsWith("https://") -> {
                        if (url.contains("signin") || url.contains("login")) {
                            // Open auth in browser instead of in-app
                            openInBrowser(url)
                            true
                        } else {
                            false
                        }
                    }
                    else -> {
                        try {
                            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                            startActivity(intent)
                        } catch (e: Exception) {
                            Log.e(TAG, "Failed to handle URL: $url", e)
                        }
                        true
                    }
                }
            }

            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                Log.d(TAG, "Page started: $url")
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                Log.d(TAG, "Page finished: $url")
                
                // Inject UI modifications after page loads
                if (uiInjectionEnabled && url != null) {
                    injectUIModifications()
                }
            }
        }

        // WebChrome client for video
        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                super.onProgressChanged(view, newProgress)
                if (newProgress == 100) {
                    injectUIModifications()
                }
            }
        }

        // JavaScript interface for TV controls
        webView.addJavascriptInterface(TVInterface(), "PlayraTV")
    }

    private fun loadUrl(url: String) {
        webView.loadUrl(url)
    }

    private fun handleDeepLink(url: String) {
        Log.d(TAG, "Deep link: $url")
        // Handle custom URL scheme
    }

    private fun openInBrowser(url: String) {
        try {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
            startActivity(intent)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to open browser", e)
        }
    }

    // Inject custom CSS/JS from assets for UI modifications
    private fun injectUIModifications() {
        try {
            val js = """
                (function() {
                    // Check if already injected
                    if (window.__playraTVInjected) return;
                    window.__playraTVInjected = true;
                    
                    console.log('Playra TV: Injecting UI modifications...');
                    
                    // Add TV-specific styles
                    const style = document.createElement('style');
                    style.textContent = `
                        /* Make UI larger for TV */
                        body { font-size: 120% !important; }
                        .video-card, .channel-card { transform: scale(1.05); }
                        /* Hide mobile-only elements */
                        .mobile-only { display: none !important; }
                        /* Improve navigation */
                        button, a { min-height: 48px; min-width: 48px; }
                    `;
                    document.head.appendChild(style);
                    
                    // Notify web app it's running on TV
                    window.isTV = true;
                    window.isAndroidTV = true;
                })();
            """.trimIndent()
            webView.evaluateJavascript(js, null)
        } catch (e: Exception) {
            Log.e(TAG, "Injection failed", e)
        }
    }

    // Handle D-pad / Remote navigation
    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        val keyCode = event.keyCode
        
        if (event.action == KeyEvent.ACTION_DOWN) {
            when (keyCode) {
                KeyEvent.KEYCODE_DPAD_UP -> {
                    Log.d(TAG, "DPAD UP")
                    simulateKeyPress("ArrowUp")
                    return true
                }
                KeyEvent.KEYCODE_DPAD_DOWN -> {
                    Log.d(TAG, "DPAD DOWN")
                    simulateKeyPress("ArrowDown")
                    return true
                }
                KeyEvent.KEYCODE_DPAD_LEFT -> {
                    Log.d(TAG, "DPAD LEFT")
                    simulateKeyPress("ArrowLeft")
                    return true
                }
                KeyEvent.KEYCODE_DPAD_RIGHT -> {
                    Log.d(TAG, "DPAD RIGHT")
                    simulateKeyPress("ArrowRight")
                    return true
                }
                KeyEvent.KEYCODE_DPAD_CENTER, KeyEvent.KEYCODE_ENTER -> {
                    Log.d(TAG, "DPAD CENTER/ENTER")
                    simulateKeyPress("Enter")
                    return true
                }
                KeyEvent.KEYCODE_BACK -> {
                    Log.d(TAG, "BACK")
                    if (webView.canGoBack()) {
                        webView.goBack()
                    } else {
                        onBackPressed()
                    }
                    return true
                }
                KeyEvent.KEYCODE_HOME -> {
                    Log.d(TAG, "HOME")
                    loadUrl(BASE_URL)
                    return true
                }
                KeyEvent.KEYCODE_MENU -> {
                    Log.d(TAG, "MENU")
                    showOptionsMenu()
                    return true
                }
                // Volume controls
                KeyEvent.KEYCODE_VOLUME_UP -> {
                    webView.evaluateJavascript("document.dispatchEvent(new CustomEvent('volumechange', {detail: 'up'}))", null)
                    return true
                }
                KeyEvent.KEYCODE_VOLUME_DOWN -> {
                    webView.evaluateJavascript("document.dispatchEvent(new CustomEvent('volumechange', {detail: 'down'}))", null)
                    return true
                }
            }
        }
        
        return super.dispatchKeyEvent(event)
    }

    private fun simulateKeyPress(key: String) {
        val js = """
            (function() {
                const event = new KeyboardEvent('keydown', {
                    key: '$key',
                    code: 'Key${key.replaceFirstChar { it.uppercase() }}',
                    keyCode: ${getKeyCode(key)},
                    which: ${getKeyCode(key)},
                    bubbles: true
                });
                document.activeElement?.dispatchEvent(event) || document.dispatchEvent(event);
            })();
        """.trimIndent()
        webView.evaluateJavascript(js, null)
    }

    private fun getKeyCode(key: String): Int {
        return when (key) {
            "ArrowUp" -> 38
            "ArrowDown" -> 40
            "ArrowLeft" -> 37
            "ArrowRight" -> 39
            "Enter" -> 13
            else -> 0
        }
    }

    private fun showOptionsMenu() {
        // Show TV options menu
        val popup = android.widget.PopupMenu(this, findViewById(android.R.id.content))
        popup.menu.add(0, 1, 0, "Refresh")
        popup.menu.add(0, 2, 1, "Go to Home")
        popup.menu.add(0, 3, 2, "Clear Cache")
        popup.menu.add(0, 4, 3, "Open in Browser")
        
        popup.setOnMenuItemClickListener { item ->
            when (item.itemId) {
                1 -> webView.reload()
                2 -> loadUrl(BASE_URL)
                3 -> {
                    webView.clearCache(true)
                    webView.clearHistory()
                    android.widget.Toast.makeText(this, "Cache cleared", android.widget.Toast.LENGTH_SHORT).show()
                }
                4 -> openInBrowser(webView.url)
            }
            true
        }
        popup.show()
    }

    // JavaScript Interface exposed to web app
    inner class TVInterface {
        @JavascriptInterface
        fun getDeviceInfo(): String {
            return """
                {
                    "isTV": true,
                    "platform": "android-tv",
                    "version": "${packageManager.getPackageInfo(packageName, 0).versionName}",
                    "appVersion": "1.0.0"
                }
            """.trimIndent()
        }

        @JavascriptInterface
        fun showToast(message: String) {
            runOnUiThread {
                android.widget.Toast.makeText(this@MainActivity, message, android.widget.Toast.LENGTH_SHORT).show()
            }
        }

        @JavascriptInterface
        fun checkForUpdates(callback: String) {
            // Check for updates from your server
            // This is called from JavaScript: PlayraTV.checkForUpdates('callbackFunction')
            runOnUiThread {
                // In production, fetch from your update server
                val updateInfo = """
                    {
                        "hasUpdate": false,
                        "version": "1.0.0",
                        "url": ""
                    }
                """.trimIndent()
                webView.evaluateJavascript("$callback($updateInfo)", null)
            }
        }

        @JavascriptInterface
        fun applyUIModification(css: String) {
            // Apply custom CSS from server/config
            val js = """
                (function() {
                    const style = document.createElement('style');
                    style.id = 'playra-tv-custom-style';
                    style.textContent = `$css`;
                    const old = document.getElementById('playra-tv-custom-style');
                    if (old) old.remove();
                    document.head.appendChild(style);
                })();
            """.trimIndent()
            webView.evaluateJavascript(js, null)
        }

        @JavascriptInterface
        fun applyJSModification(js: String) {
            // Execute custom JS from server/config
            webView.evaluateJavascript(js, null)
        }
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
    }

    override fun onPause() {
        super.onPause()
        webView.onPause()
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
