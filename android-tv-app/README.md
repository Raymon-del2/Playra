# Playra Android TV App

Complete Android TV app for Playra - works on Vitron TV and all Android TV devices.

## 📁 Files Created

All files are in `c:\Users\(0-0)\Playra\android-tv-app\`:

### Kotlin Source Files
- **MainActivity.kt** - Main TV interface with YouTube-like sidebar and video grid
- **VideoPlayerActivity.kt** - Full-screen video player with remote control support
- **VideoRepository.kt** - Data layer with sample videos (replace with your API)
- **CardPresenter.kt** - TV-optimized video card UI component

### Layout Files (XML)
- **activity_main.xml** - Main screen layout with browse fragment
- **activity_player.xml** - Video player layout with ExoPlayer
- **title_view.xml** - Custom header with app icon

### Resources
- **AndroidManifest.xml** - TV app configuration
- **colors.xml** - Color definitions
- **strings.xml** - Text strings
- **styles.xml** - TV UI styles
- **themes.xml** - App themes

### Build Files
- **build.gradle.dependencies.txt** - Required dependencies

### Documentation
- **SETUP_GUIDE.md** - Step-by-step setup instructions

## 🚀 Quick Start

### Step 1: Create Project in Android Studio
```
1. Open Android Studio
2. New Project → Android TV Activity
3. Name: PlayraTV
4. Package: com.playra.tv
5. Language: Kotlin
6. Min SDK: API 21
```

### Step 2: Copy Files
Copy all `.kt` files to `app/src/main/java/com/playra/tv/`

### Step 3: Copy Layouts
Copy all `.xml` files to `app/src/main/res/layout/`

### Step 4: Copy Resources
Copy to `app/src/main/res/values/`

### Step 5: Update AndroidManifest.xml
Replace your manifest with the provided one

### Step 6: Add Dependencies
Open `app/build.gradle` and add dependencies from `build.gradle.dependencies.txt`

### Step 7: Sync & Build
```
1. Click "Sync Now"
2. Build → Make Project
3. Run on TV emulator or device
```

## 📺 Installing on Vitron TV

### Option A: USB Debugging
1. Enable Developer Options (Settings → About → Click Build 7 times)
2. Enable USB Debugging
3. Connect laptop to TV via USB
4. Run from Android Studio

### Option B: APK Install
1. Build → Generate Signed APK
2. Create keystore
3. Copy APK to USB
4. Plug USB into TV
5. Use File Manager → Install APK

## 🎮 Remote Control Mapping

| Remote Button | Action |
|--------------|--------|
| D-Pad Up/Down/Left/Right | Navigate |
| OK/Center | Select/Play |
| Back | Go back |
| Play/Pause | Play/Pause video |
| Fast Forward | Skip forward |
| Rewind | Skip backward |

## 🔧 Customization

### Connect to Your Playra API

Replace the sample videos in `VideoRepository.kt`:

```kotlin
object VideoRepository {
    fun getVideos(): List<Video> {
        // TODO: Replace with your API call
        // return RetrofitClient.api.getVideos()
    }
}
```

### Add More Sections

In `MainActivity.kt`, add more rows:

```kotlin
val mySectionHeader = HeaderItem(4, "My Section")
val myAdapter = ArrayObjectAdapter(cardPresenter)
// Add videos...
rowsAdapter.add(ListRow(mySectionHeader, myAdapter))
```

## 📱 Features

- ✅ D-pad navigation (works with TV remote)
- ✅ YouTube-style left sidebar
- ✅ Video grid with focus highlight
- ✅ Full-screen video player
- ✅ Remote control support (play/pause/ff/rw)
- ✅ Optimized for 10-foot viewing
- ✅ Works on all Android TV devices

## 🐛 Troubleshooting

**App won't install?**
→ Enable "Unknown Sources" in TV settings

**Navigation not working?**
→ Make sure your remote has D-pad (arrow keys)

**Videos won't play?**
→ Check internet connection

**Black screen?**
→ Make sure `android:theme` is set in manifest

## 📚 Next Steps

1. Connect to your Playra backend API
2. Add user login/authentication
3. Add search functionality
4. Add subscriptions/channels
5. Add video upload feature
6. Publish to Google Play Store

---

**Questions?** Check SETUP_GUIDE.md for detailed instructions.
