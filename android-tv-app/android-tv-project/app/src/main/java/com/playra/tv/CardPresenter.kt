package com.playra.tv.presenter

import android.graphics.drawable.Drawable
import androidx.leanback.widget.ImageCardView
import androidx.leanback.widget.Presenter
import androidx.core.content.ContextCompat
import android.view.ViewGroup
import com.bumptech.glide.Glide
import com.playra.tv.R
import com.playra.tv.data.Video

class CardPresenter : Presenter() {

    private var mDefaultCardImage: Drawable? = null
    private var sSelectedBackgroundColor: Int = -1
    private var sDefaultBackgroundColor: Int = -1

    override fun onCreateViewHolder(parent: ViewGroup): ViewHolder {
        sDefaultBackgroundColor = ContextCompat.getColor(parent.context, R.color.default_background)
        sSelectedBackgroundColor = ContextCompat.getColor(parent.context, R.color.selected_background)
        mDefaultCardImage = ContextCompat.getDrawable(parent.context, R.drawable.movie)

        val cardView = object : ImageCardView(parent.context) {
            override fun setSelected(selected: Boolean) {
                updateCardBackgroundColor(this, selected)
                super.setSelected(selected)
            }
        }

        cardView.isFocusable = true
        cardView.isFocusableInTouchMode = true
        updateCardBackgroundColor(cardView, false)
        return ViewHolder(cardView)
    }

    private fun updateCardBackgroundColor(view: ImageCardView, selected: Boolean) {
        val color = if (selected) sSelectedBackgroundColor else sDefaultBackgroundColor
        // Both background colors should be set because the view's background is changed
        view.setBackgroundColor(color)
        view.setInfoAreaBackgroundColor(color)
    }

    override fun onBindViewHolder(viewHolder: ViewHolder, item: Any) {
        val video = item as Video
        val cardView = viewHolder.view as ImageCardView

        cardView.titleText = video.title
        cardView.contentText = "${video.channelName} • ${video.views}"
        cardView.setMainImageDimensions(CARD_WIDTH, CARD_HEIGHT)

        Glide.with(viewHolder.view.context)
            .load(video.thumbnailUrl)
            .centerCrop()
            .error(mDefaultCardImage)
            .into(cardView.mainImageView)
    }

    override fun onUnbindViewHolder(viewHolder: ViewHolder) {
        val cardView = viewHolder.view as ImageCardView
        // Remove references to images so the views can be recycled
        cardView.badgeImage = null
        cardView.mainImage = null
    }

    companion object {
        private val CARD_WIDTH = 320
        private val CARD_HEIGHT = 180
    }
}
