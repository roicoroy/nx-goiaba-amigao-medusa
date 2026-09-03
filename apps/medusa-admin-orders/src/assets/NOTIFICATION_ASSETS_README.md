# Notification Assets

This directory should contain the following files for the real-time order notification system:

## Required Files:

### 1. notification.mp3
- **Purpose**: Sound played when new orders arrive
- **Format**: MP3 audio file
- **Duration**: 1-3 seconds recommended
- **Volume**: Should be pleasant and not too loud
- **Suggestion**: Use a subtle chime or bell sound

### 2. order-icon.png
- **Purpose**: Icon displayed in browser notifications
- **Format**: PNG image
- **Size**: 64x64 pixels recommended
- **Content**: Order/shopping bag icon
- **Background**: Transparent preferred

### 3. badge.png
- **Purpose**: Badge icon for notifications
- **Format**: PNG image
- **Size**: 32x32 pixels recommended
- **Content**: Small notification badge
- **Background**: Transparent preferred

## How to Add These Files:

1. **For notification.mp3**: 
   - Find a suitable notification sound (free resources: freesound.org, zapsplat.com)
   - Convert to MP3 format if needed
   - Place in `src/assets/notification.mp3`

2. **For order-icon.png**:
   - Create or download a shopping bag/order icon
   - Resize to 64x64 pixels
   - Save as PNG with transparent background
   - Place in `src/assets/order-icon.png`

3. **For badge.png**:
   - Create a small circular badge icon
   - Resize to 32x32 pixels
   - Save as PNG with transparent background
   - Place in `src/assets/badge.png`

## Alternative:
If you don't want to add these files immediately, the notification system will still work but:
- No sound will play (error will be logged to console)
- Browser notifications will use default browser icon
- All other functionality remains intact

## Testing:
After adding the files, test by:
1. Starting your Angular app: `ng serve`
2. Creating a test order in your Medusa store
3. Checking that sound plays and notifications appear with custom icons
