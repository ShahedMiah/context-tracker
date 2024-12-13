# Context Tracker

A smart desktop app that tracks context switches between applications.

## Features

- Track active window switches
- Categorize applications automatically
- View time spent statistics
- System tray integration

## Development Setup

1. Clone the repository:
```bash
git clone https://github.com/ShahedMiah/context-tracker.git
cd context-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Run in development mode:
```bash
npm run dev
```

## Building Distributions

### Prerequisites

1. Install icon creation tools (macOS):
```bash
brew install librsvg
brew install imagemagick
```

### Creating the App Icon

1. Create the icon directories:
```bash
mkdir -p icon.iconset
```

2. Create the conversion script (make-icon.sh):
```bash
#!/bin/bash

# Convert SVG to PNG at different sizes
for size in 16 32 64 128 256 512 1024; do
  rsvg-convert -w $size -h $size resources/icon.svg > icon.iconset/icon_${size}x${size}.png
  if [ $size -le 512 ]; then
    rsvg-convert -w $((size*2)) -h $((size*2)) resources/icon.svg > icon.iconset/icon_${size}x${size}@2x.png
  fi
done

# Create .icns file
iconutil -c icns icon.iconset -o resources/icon.icns

# Clean up
rm -rf icon.iconset
```

3. Run the icon creation script:
```bash
chmod +x make-icon.sh
./make-icon.sh
```

### Building the Distribution

1. Clean previous builds:
```bash
rm -rf dist/
rm -rf node_modules/
```

2. Fresh install and build:
```bash
npm install
npm run dist
```

This will create distribution files in the `dist` folder:
- macOS: `.dmg` file
- Windows: `.exe` installer
- Linux: `.AppImage` file

### Installing the Built App

#### macOS
1. Open the `.dmg` file in the `dist` folder
2. Drag the app to your Applications folder
3. Launch the app from Applications
4. Grant required permissions:
   - System Preferences > Security & Privacy > Privacy
   - Enable "Context Tracker" in both:
     - Accessibility
     - Automation

#### Windows
1. Run the installer `.exe` from the `dist` folder
2. Follow the installation prompts

## Making Changes and Creating New Distributions

1. Make your code changes

2. Update the version in `package.json` if needed:
```json
{
  "version": "1.0.1"
}
```

3. Rebuild the distribution:
```bash
# Clean up
rm -rf dist/
rm -rf node_modules/

# Fresh install and build
npm install
npm run dist
```

4. Test the new distribution:
- Install the new version
- Verify your changes work as expected
- Check that all features still function correctly

## Permissions

### macOS
The app requires certain permissions to track window switches:
- Accessibility: Required to detect active windows
- Automation: Required for window title detection

### Windows
No special permissions required, but running as administrator might be needed for some features.

## Common Issues

### macOS App Not Appearing in Security Preferences
- Make sure you're running the properly bundled app from Applications
- The app must be signed for proper system integration

### Window Tracking Not Working
- Verify all required permissions are granted
- Try restarting the app
- Check the console for error messages