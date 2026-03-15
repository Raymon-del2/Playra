package com.playra.tv.data

data class Video(
    val id: String,
    val title: String,
    val description: String,
    val thumbnailUrl: String,
    val videoUrl: String,
    val channelName: String,
    val views: String,
    val duration: String,
    val featured: Boolean = false
)

object VideoRepository {
    
    // Replace these with your actual Playra API calls
    fun getVideos(): List<Video> {
        return listOf(
            Video(
                id = "1",
                title = "Amazing Nature Documentary",
                description = "Explore the wonders of nature in 4K",
                thumbnailUrl = "https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg",
                videoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                channelName = "Nature Channel",
                views = "1.2M views",
                duration = "15:30",
                featured = true
            ),
            Video(
                id = "2",
                title = "Tech Review 2024",
                description = "Latest gadgets reviewed",
                thumbnailUrl = "https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg",
                videoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
                channelName = "Tech Today",
                views = "850K views",
                duration = "12:45"
            ),
            Video(
                id = "3",
                title = "Cooking Masterclass",
                description = "Learn to cook like a pro",
                thumbnailUrl = "https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg",
                videoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
                channelName = "Chef's Kitchen",
                views = "2.1M views",
                duration = "22:15",
                featured = true
            ),
            Video(
                id = "4",
                title = "Gaming Highlights",
                description = "Best moments from the championship",
                thumbnailUrl = "https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg",
                videoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
                channelName = "Game On",
                views = "500K views",
                duration = "8:20"
            ),
            Video(
                id = "5",
                title = "Travel Vlog: Paris",
                description = "Walking through the city of lights",
                thumbnailUrl = "https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg",
                videoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
                channelName = "Wanderlust",
                views = "3.2M views",
                duration = "18:45"
            ),
            Video(
                id = "6",
                title = "Music Mix 2024",
                description = "Best hits of the year",
                thumbnailUrl = "https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg",
                videoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
                channelName = "Music Hub",
                views = "10M views",
                duration = "45:00",
                featured = true
            ),
            Video(
                id = "7",
                title = "Fitness Workout",
                description = "30 minute home workout",
                thumbnailUrl = "https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg",
                videoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
                channelName = "Fit Life",
                views = "750K views",
                duration = "30:00"
            ),
            Video(
                id = "8",
                title = "DIY Projects",
                description = "Easy home improvements",
                thumbnailUrl = "https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg",
                videoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
                channelName = "Handy Man",
                views = "1.5M views",
                duration = "14:30"
            ),
            Video(
                id = "9",
                title = "Comedy Special",
                description = "Laugh out loud moments",
                thumbnailUrl = "https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg",
                videoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
                channelName = "Comedy Central",
                views = "5M views",
                duration = "20:00"
            ),
            Video(
                id = "10",
                title = "Science Explained",
                description = "Understanding quantum physics",
                thumbnailUrl = "https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg",
                videoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
                channelName = "Science Daily",
                views = "2.8M views",
                duration = "16:15"
            )
        )
    }

    // TODO: Add your Playra API integration here
    // fun fetchVideosFromAPI(): List<Video> {
    //     // Retrofit or other HTTP client call to your Playra backend
    // }
}
