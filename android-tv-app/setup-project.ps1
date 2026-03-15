# PowerShell Script to Setup Playra TV Android Project
# Run this script to create the proper Android Studio project structure

$ProjectRoot = "android-tv-project"
$PackagePath = "app\src\main\java\com\playra\tv"

# Create directories
New-Item -ItemType Directory -Force -Path "$ProjectRoot\$PackagePath" | Out-Null
New-Item -ItemType Directory -Force -Path "$ProjectRoot\app\src\main\res\layout" | Out-Null
New-Item -ItemType Directory -Force -Path "$ProjectRoot\app\src\main\res\values" | Out-Null
New-Item -ItemType Directory -Force -Path "$ProjectRoot\app\src\main\res\drawable" | Out-Null
New-Item -ItemType Directory -Force -Path "$ProjectRoot\app\src\main\res\mipmap-hdpi" | Out-Null

# Copy Kotlin files
Copy-Item "MainActivity.kt" "$ProjectRoot\$PackagePath\"
Copy-Item "VideoPlayerActivity.kt" "$ProjectRoot\$PackagePath\"
Copy-Item "CardPresenter.kt" "$ProjectRoot\$PackagePath\"

# Create data package
New-Item -ItemType Directory -Force -Path "$ProjectRoot\$PackagePath\data" | Out-Null
Copy-Item "VideoRepository.kt" "$ProjectRoot\$PackagePath\data\"

# Copy layout files
Copy-Item "activity_main.xml" "$ProjectRoot\app\src\main\res\layout\"
Copy-Item "activity_player.xml" "$ProjectRoot\app\src\main\res\layout\"
Copy-Item "title_view.xml" "$ProjectRoot\app\src\main\res\layout\"

# Copy resources
Copy-Item "colors.xml" "$ProjectRoot\app\src\main\res\values\"
Copy-Item "strings.xml" "$ProjectRoot\app\src\main\res\values\"
Copy-Item "styles.xml" "$ProjectRoot\app\src\main\res\values\"
Copy-Item "themes.xml" "$ProjectRoot\app\src\main\res\values\"

# Copy manifest
Copy-Item "AndroidManifest.xml" "$ProjectRoot\app\src\main\"

Write-Host "✅ Project structure created in: $ProjectRoot"
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Open Android Studio"
Write-Host "2. File → New → Import Project"
Write-Host "3. Select folder: $(Resolve-Path $ProjectRoot)"
Write-Host ""
Write-Host "Or zip the folder and share it:"
Write-Host "Compress-Archive -Path $ProjectRoot -DestinationPath playra-tv-android.zip"
