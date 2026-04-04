# 拼音歌词 · Spotify Pinyin Lyrics

<img width="700" alt="image" src="https://github.com/user-attachments/assets/7a42198b-af66-430f-a74f-796a06278b3b" />

A [Spicetify](https://spicetify.app) extension that adds **pinyin** or **jyutping** romanization above Chinese lyrics in Spotify — so you can actually sing along.

By [@0x_ultra](https://x.com/0x_ultra)

---

## Why

Spotify has a great synced lyrics feature, but if you're learning Mandarin or Cantonese (or just want to karaoke without having every character memorized), the lyrics alone aren't enough. This extension overlays romanization directly above each character using HTML `<ruby>` tags, right inside the Spotify app — no external tools, no extra windows.

## Features

- **Pinyin** (Mandarin) or **Jyutping** (Cantonese) romanization
- **Simplified** or **Traditional** Chinese characters — Spotify's lyrics are Traditional by default, conversion is handled automatically
- **Tones on/off** — tone marks (`nǐ hǎo`) or bare syllables (`ni hao`); jyutping keeps numeric tones (`gam3`) when on
- Floating **文** settings button, accessible from anywhere in the app
- Settings persist across sessions
- Works with Spotify's synced (line-by-line) lyrics
- Non-Chinese lines are left untouched

## How it works

The extension watches Spotify's lyrics DOM with a `MutationObserver`. When a Chinese lyric line appears:

1. Optionally converts Traditional → Simplified via [opencc-js](https://github.com/nkcs-iclab/opencc-js)
2. Generates per-character romanization via [pinyin-pro](https://github.com/zh-lx/pinyin-pro) (Mandarin) or [to-jyutping](https://github.com/CanCLID/to-jyutping) (Cantonese)
3. Wraps each character in a `<ruby>` tag so the romanization floats above it

## Requirements

- [Spotify desktop app](https://www.spotify.com/download) — **not** the Mac App Store version
- [Spicetify](https://spicetify.app) v2.x
- Node.js + npm

## Installation

### 1. Install Spicetify

```bash
brew install spicetify-cli
sudo chmod a+wr /Applications/Spotify.app/Contents/Resources
sudo chmod a+wr /Applications/Spotify.app/Contents/MacOS/Spotify
spicetify backup apply
```

### 2. Clone and install

```bash
git clone https://github.com/0x-ultra/spotify-pinyin-lyrics.git
cd spotify-pinyin-lyrics
npm install
```

### 3. Deploy

```bash
npm run deploy
```

Builds the extension, copies it to Spicetify's extensions folder, and applies it in one step.

### 4. Restart Spotify

A floating **文** button will appear in the top-right corner of the app. Click it to open settings.

## Settings

| Option | Values | Default |
|---|---|---|
| Characters | Simplified 简 / Traditional 繁 | Simplified |
| Romanization | Pinyin / Jyutping | Pinyin |
| Tones | On / Off | On |

## Development

Edit `src/index.js`, then:

```bash
npm run deploy
```

## Libraries

| Library | Purpose |
|---|---|
| [pinyin-pro](https://github.com/zh-lx/pinyin-pro) | Mandarin pinyin with tone marks |
| [to-jyutping](https://github.com/CanCLID/to-jyutping) | Cantonese jyutping (CanCLID, 99% accuracy) |
| [opencc-js](https://github.com/nkcs-iclab/opencc-js) | Traditional ↔ Simplified Chinese conversion |
| [esbuild](https://esbuild.github.io) | Bundles everything into a single JS file |

## Notes

- Spotify's lyrics DOM selectors can change after app updates. If romanization stops working, open DevTools (`Cmd+Option+I`), inspect the lyrics container for the new selectors, and update `LYRIC_SELECTORS` in `src/index.js`.
- Modifying Spotify technically violates their ToS. This is for personal use only.

## License

MIT
