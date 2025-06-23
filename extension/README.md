
# Music Player Chrome Extension

A beautiful, dark-themed Chrome extension for playing music files with flowing UI effects and comprehensive audio controls.

## Features

- 🎵 **Dark Mode Only**: Sleek dark interface with gradient accents
- 🎛️ **Full Audio Controls**: Play, pause, volume, progress seeking
- 🔁 **Loop Option**: Play tracks on repeat
- 🔀 **Shuffle Mode**: Random playback option
- 🎨 **Animated UI**: Floating music symbols background animation
- 📁 **File Support**: MP3 and MP4 audio file compatibility
- 💾 **State Persistence**: Remembers your settings and playback state
- 🎧 **Background Playback**: Music continues playing when extension is closed

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the project folder
5. The Dark Music Player extension will appear in your toolbar

## Usage

1. Click the extension icon in your Chrome toolbar
2. Click "Choose Music File" to select an MP3 or MP4 file
3. Use the controls to play, pause, adjust volume, and seek through tracks
4. Toggle loop or shuffle modes as desired
5. Enjoy the flowing music symbols animation in the background!

## File Structure

```
├── public/
│   ├── manifest.json          # Extension configuration
│   ├── popup.html            # Main UI
│   ├── popup.js              # Player functionality
│   ├── background.js         # Service worker
│   └── icon*.png            # Extension icons
├── src/
│   └── utils/
│       └── createIcons.js    # Icon creation utility
└── README.md
```

## Technical Details

- **Manifest Version**: 3 (latest Chrome extension standard)
- **Permissions**: Storage and active tab access
- **Audio Support**: HTML5 Audio API
- **Storage**: Chrome extension local storage
- **UI Framework**: Pure CSS with custom animations

## Customization

The extension uses CSS custom properties for easy theming. Key colors:
- Primary gradient: `#ff6b6b` to `#4ecdc4`
- Background: `#0c0c0c` to `#1a1a1a`
- Accent: `rgba(255, 255, 255, 0.1)`

## Browser Compatibility

- Chrome 88+
- Chromium-based browsers (Edge, Brave, etc.)

## License

MIT License - feel free to modify and distribute!
