# App Resources

## Icon Creation

### Prerequisites

1. Install required tools (macOS):
```bash
brew install librsvg
brew install imagemagick
```

### Creating the App Icon

1. The source icon is in `icon.svg`

2. Create the conversion script:
```bash
#!/bin/bash

# Create iconset directory
mkdir -p icon.iconset

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

3. Save this as `make-icon.sh` in the project root and run:
```bash
chmod +x make-icon.sh
./make-icon.sh
```

This will create `icon.icns` in the resources directory.

## Resource Files

- `icon.svg` - Source vector icon file
- `icon.icns` - Generated macOS app icon
- `entitlements.mac.plist` - macOS app entitlements configuration
- `tray-icon.png` - System tray icon