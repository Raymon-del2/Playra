# Playra Android TV App - Setup Guide

## Prerequisites
- Android Studio (latest version)
- Android SDK with API 21+ (Android 5.0+)
- Java 11 or Kotlin

## Step 1: Create New Project in Android Studio

1. Open Android Studio
2. Click "New Project"
3. Select "Android TV Activity" template
4. Name: **PlayraTV**
5. Package name: **com.playra.tv**
6. Language: **Kotlin**
7. Minimum SDK: **API 21: Android 5.0 (Lollipop)**
8. Finish

## Step 2: Project Structure

Your project should have this structure:
```
app/
├── src/main/
│   ├── java/com/playra/tv/
│   │   ├── MainActivity.kt
│   │   ├── VideoPlayerActivity.kt
│   │   ├── BrowseFragment.kt
│   │   ├── DetailsActivity.kt
│   │   ├── data/
│   │   │   ├── Video.kt
│   │   │   └── VideoRepository.kt
│   │   └── presenter/
│   │       ├── CardPresenter.kt
│   │       └── IconItemPresenter.kt
│   ├── res/
│   │   ├── layout/
│   │   │   ├── activity_main.xml
│   │   │   ├── activity_details.xml
│   │   │   └── activity_player.xml
│   │   ├── values/
│   │   │   ├── colors.xml
│   │   │   ├── strings.xml
│   │   │   ├── styles.xml
│   │   │   └── themes.xml
│   │   └── drawable/
│   │       └── app_icon_your_company.png
│   └── AndroidManifest.xml
├── build.gradle (Module: app)
└── build.gradle (Project)
```

## Step 3: Copy the Code Files

Copy all the provided code files from this folder into your project.

## Step 4: Add Dependencies

Open `app/build.gradle` and add the dependencies from `build.gradle.dependencies.txt`

## Step 5: Update AndroidManifest.xml

Replace your `AndroidManifest.xml` with the provided one.

## Step 6: Build & Run

1. Sync Gradle (Click "Sync Now" in notification bar)
2. Build → Make Project (Ctrl+F9)
3. Run on Android TV emulator or device

## For Vitron TV (or any Android TV):

### Option A: Install via USB
1. Enable Developer Options on TV (Settings → About → Click Build 7 times)
2. Enable USB Debugging
3. Connect laptop to TV via USB
4. Run app from Android Studio

### Option B: Build APK
1. Build → Generate Signed Bundle/APK
2. Choose APK
3. Create new keystore (save it!)
4. Build release APK
5. Copy APK to USB drive
6. Plug USB into TV
7. Use File Manager on TV to install APK

## Features Included:
- D-pad navigation (arrow keys on remote)
- YouTube-style left sidebar
- Video grid with focus highlight
- Video player with remote controls
- Leanback UI optimized for 10-foot experience
- Back button navigation

## Troubleshooting:
- If app won't install: Enable "Unknown Sources" in TV settings
- If navigation doesn't work: Make sure your TV remote has D-pad
- If videos won't play: Check internet connection and video URL format

## Next Steps:
1. Replace placeholder video URLs with your actual Playra API
2. Add user authentication
3. Add search functionality
4. Add subscriptions/channels view

---
Made for Playra TV App
