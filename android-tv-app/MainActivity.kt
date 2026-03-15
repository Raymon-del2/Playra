package com.playra.tv

import android.os.Bundle
import android.view.KeyEvent
import androidx.fragment.app.FragmentActivity
import androidx.leanback.app.BrowseSupportFragment
import androidx.leanback.widget.ArrayObjectAdapter
import androidx.leanback.widget.HeaderItem
import androidx.leanback.widget.ListRow
import androidx.leanback.widget.ListRowPresenter
import androidx.leanback.widget.OnItemViewClickedListener
import androidx.leanback.widget.Presenter
import androidx.leanback.widget.Row
import androidx.leanback.widget.RowPresenter
import androidx.core.content.ContextCompat
import android.graphics.drawable.Drawable
import com.playra.tv.data.Video
import com.playra.tv.data.VideoRepository
import com.playra.tv.presenter.CardPresenter

class MainActivity : FragmentActivity() {

    private lateinit var browseFragment: BrowseSupportFragment
    private var selectedMenuIndex = 0
    private val menuItems = listOf("Home", "Trending", "Subscriptions", "Library", "Settings")

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        browseFragment = supportFragmentManager.findFragmentById(R.id.browse_fragment) as BrowseSupportFragment
        
        setupUI()
        loadVideos()
    }

    private fun setupUI() {
        browseFragment.apply {
            title = "Playra"
            headersState = BrowseSupportFragment.HEADERS_ENABLED
            isHeadersTransitionOnBackEnabled = true
            
            // Brand color
            brandColor = ContextCompat.getColor(this@MainActivity, R.color.fastlane_background)
            
            // Search icon
            searchAffordanceColor = ContextCompat.getColor(this@MainActivity, R.color.search_opaque)
            
            setOnSearchClickedListener {
                // Open search
            }
        }
    }

    private fun loadVideos() {
        val videos = VideoRepository.getVideos()
        
        val rowsAdapter = ArrayObjectAdapter(ListRowPresenter())
        val cardPresenter = CardPresenter()

        // Featured videos row
        val featuredHeader = HeaderItem(0, "Featured")
        val featuredAdapter = ArrayObjectAdapter(cardPresenter)
        videos.filter { it.featured }.forEach { featuredAdapter.add(it) }
        rowsAdapter.add(ListRow(featuredHeader, featuredAdapter))

        // Recent videos row
        val recentHeader = HeaderItem(1, "Recent Videos")
        val recentAdapter = ArrayObjectAdapter(cardPresenter)
        videos.take(10).forEach { recentAdapter.add(it) }
        rowsAdapter.add(ListRow(recentHeader, recentAdapter))

        // Trending row
        val trendingHeader = HeaderItem(2, "Trending")
        val trendingAdapter = ArrayObjectAdapter(cardPresenter)
        videos.shuffled().take(8).forEach { trendingAdapter.add(it) }
        rowsAdapter.add(ListRow(trendingHeader, trendingAdapter))

        // Subscriptions row
        val subsHeader = HeaderItem(3, "Your Subscriptions")
        val subsAdapter = ArrayObjectAdapter(cardPresenter)
        videos.shuffled().take(6).forEach { subsAdapter.add(it) }
        rowsAdapter.add(ListRow(subsHeader, subsAdapter))

        browseFragment.adapter = rowsAdapter

        browseFragment.setOnItemViewClickedListener { itemViewHolder, item, rowViewHolder, row ->
            if (item is Video) {
                val intent = android.content.Intent(this, VideoPlayerActivity::class.java)
                intent.putExtra("VIDEO_URL", item.videoUrl)
                intent.putExtra("VIDEO_TITLE", item.title)
                startActivity(intent)
            }
        }
    }

    // Handle D-pad navigation for sidebar
    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        when (keyCode) {
            KeyEvent.KEYCODE_DPAD_LEFT -> {
                // Move focus to sidebar
                browseFragment.startEntranceTransition()
                return true
            }
            KeyEvent.KEYCODE_DPAD_RIGHT -> {
                // Move focus to content
                return true
            }
            KeyEvent.KEYCODE_DPAD_UP,
            KeyEvent.KEYCODE_DPAD_DOWN -> {
                // Navigate within current section
                return super.onKeyDown(keyCode, event)
            }
            KeyEvent.KEYCODE_BACK -> {
                if (browseFragment.isShowingHeaders) {
                    browseFragment.startHeadersTransitionInternal(false)
                    return true
                }
            }
        }
        return super.onKeyDown(keyCode, event)
    }
}
