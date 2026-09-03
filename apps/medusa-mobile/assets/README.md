# Capacitor Assets

This folder contains the source images for generating app icons and splash screens.

## Required Files

According to [Capacitor Assets documentation](https://capacitorjs.com/docs/guides/splash-screens-and-icons), you need:

### Icon Files (minimum 1024x1024px):
- **icon-only.png** - Main app icon (required)
- **icon-foreground.png** - Foreground layer for Android adaptive icons (optional, but recommended)
- **icon-background.png** - Background layer for Android adaptive icons (optional, but recommended)

### Splash Screen Files (minimum 2732x2732px):
- **splash.png** - Light mode splash screen (required)
- **splash-dark.png** - Dark mode splash screen (optional, but recommended)

## File Format

- Format: PNG or JPG
- Icon size: At least 1024x1024 pixels (square)
- Splash size: At least 2732x2732 pixels (square)

## Generating Assets

Once you've added your source images to this folder, run:

```bash
npx capacitor-assets generate
```

This will generate all required icon and splash screen sizes for:
- iOS
- Android
- PWA (Progressive Web App)

## Platform-Specific Generation

You can also generate for a specific platform:

```bash
# iOS only
npx capacitor-assets generate --ios

# Android only
npx capacitor-assets generate --android

# PWA only
npx capacitor-assets generate --pwa
```

## Notes

- The source images should be high quality and properly sized
- For best results, use PNG format with transparency for icons
- Splash screens will be centered and scaled to fit different screen sizes
- Android 12+ uses adaptive icons with foreground/background layers

