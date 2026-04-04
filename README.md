# spot-pin

A [Spicetify](https://spicetify.app) extension that adds **pinyin** or **jyutping** romanization above Chinese lyrics in Spotify — so you can actually sing along.

![Settings panel showing character and romanization options](https://placeholder)

## Why

Spotify has a great synced lyrics feature, but if you're learning Mandarin or Cantonese (or just want to karaoke without having memorized every character), the lyrics alone aren't enough. This extension overlays romanization directly above each character using HTML `<ruby>` tags, right inside the Spotify app.

## Features

- **Pinyin** (Mandarin) or **Jyutping** (Cantonese) romanization
- **Simplified** or **Traditional** Chinese characters
- **Tones on/off** — show tone marks (`nǐ hǎo`) or bare syllables (`ni hao`)
- Settings panel accessible from the Spotify top bar
- Settings persist across sessions
- Works with Spotify's synced (line-by-line) lyrics

## How it works

The extension uses a `MutationObserver` to watch Spotify's lyrics DOM. When Chinese characters are detected in a lyric line, it:

1. Optionally converts Traditional → Simplified via [opencc-js](https://github.com/nkcs-iclab/opencc-js)
2. Generates romanization per character via [pinyin-pro](https://github.com/zh-lx/pinyin-pro) (Mandarin) or [to-jyutping](https://github.com/CanCLID/to-jyutping) (Cantonese)
3. Wraps each character in a `<ruby>` tag so the romanization floats above it

Non-Chinese lines (English, punctuation, etc.) are left untouched.

## Requirements

- [Spotify desktop app](https://www.spotify.com/download) — **not** the Mac App Store version
- [Spicetify](https://spicetify.app) v2.x
- Node.js + npm (to build from source)

## Installation

### 1. Install Spicetify

```bash
brew install spicetify-cli
sudo chmod a+wr /Applications/Spotify.app/Contents/Resources
sudo chmod a+wr /Applications/Spotify.app/Contents/MacOS/Spotify
spicetify backup apply
```

### 2. Build the extension

```bash
git clone https://github.com/yourusername/spot-pin.git
cd spot-pin
npm install
npm run build
```

### 3. Deploy

```bash
cp dist/lyric-pinyin.js ~/.config/spicetify/Extensions/
spicetify config extensions lyric-pinyin.js
spicetify apply
```

Or use the one-shot deploy script (runs build + copy + apply):

```bash
npm run deploy
```

### 4. Restart Spotify

The **拼** button will appear in the Spotify top bar. Click it to open the settings panel.

## Settings

| Option | Values |
|---|---|
| Characters | Simplified (简) / Traditional (繁) |
| Romanization | Pinyin / Jyutping |
| Tones | On (`nǐ`, `gam3`) / Off (`ni`, `gam`) |

Settings are saved to `localStorage` and persist across Spotify restarts.

## Development

Edit `src/index.js`, then run:

```bash
npm run deploy
```

This rebuilds and hot-reloads into Spotify via `spicetify apply`.

To watch for changes during development:

```bash
spicetify watch -le
```

## Libraries used

| Library | Purpose |
|---|---|
| [pinyin-pro](https://github.com/zh-lx/pinyin-pro) | Mandarin pinyin with tone marks |
| [to-jyutping](https://github.com/CanCLID/to-jyutping) | Cantonese jyutping (CanCLID, 99% accuracy) |
| [opencc-js](https://github.com/nkcs-iclab/opencc-js) | Traditional ↔ Simplified Chinese conversion |
| [esbuild](https://esbuild.github.io) | Bundles everything into a single JS file |

## Notes

- Spotify's lyrics DOM selectors can change after app updates. If romanization stops working after a Spotify update, open DevTools (`Cmd+Option+I`) and inspect the lyrics container to find the new selectors, then update `LYRIC_SELECTORS` in `src/index.js`.
- Modifying Spotify technically violates their ToS. This is for personal use only.

## License

MIT
