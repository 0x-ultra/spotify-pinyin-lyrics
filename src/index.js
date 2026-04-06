(function lyricPinyin() {
  if (!Spicetify?.Player || !Spicetify?.Platform) {
    setTimeout(lyricPinyin, 300);
    return;
  }

  const { pinyin } = require("pinyin-pro");
  const { getJyutpingList } = require("to-jyutping");
  const OpenCC = require("opencc-js");

  // Spotify lyrics are already Traditional — we only need T→S for simplified mode
  const toSimplified = OpenCC.Converter({ from: "tw", to: "cn" });

  // ── Styles ───────────────────────────────────────────────────────────────────

  const style = document.createElement("style");
  style.textContent = `
    ruby.lp {
      display: inline-flex;
      flex-direction: column-reverse;
      align-items: center;
      vertical-align: bottom;
      line-height: 1;
    }
    ruby.lp rt {
      display: block;
      font-size: 0.42em;
      line-height: 1.6;
      text-align: center;
      font-weight: normal;
      letter-spacing: 0;
      white-space: nowrap;
    }
  `;
  document.head.appendChild(style);

  // ── Settings ────────────────────────────────────────────────────────────────

  const SETTINGS_KEY = "lyric-pinyin:settings";

  function getSettings() {
    try {
      return (
        JSON.parse(localStorage.getItem(SETTINGS_KEY)) ?? {
          characters: "simplified", // "traditional" | "simplified"
          romanization: "pinyin",   // "pinyin" | "jyutping"
          tones: true,              // show tone marks / numbers
        }
      );
    } catch {
      return { characters: "simplified", romanization: "pinyin", tones: true };
    }
  }

  function saveSettings(patch) {
    const next = { ...getSettings(), ...patch };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    // Re-process all visible lyrics with new settings
    resetAndProcess();
  }

  // ── Core text processing ─────────────────────────────────────────────────────

  const CJK_RE = /[\u4e00-\u9fff\u3400-\u4dbf]/;

  function hasChinese(text) {
    return CJK_RE.test(text);
  }

  function buildRuby(rawText) {
    const s = getSettings();

    // Spotify source is Traditional — convert to Simplified if requested
    const text = s.characters === "simplified" ? toSimplified(rawText) : rawText;

    const chars = [...text];

    if (s.romanization === "jyutping") {
      const pairs = getJyutpingList(text);
      return pairs
        .map(([char, jp]) => {
          if (jp && CJK_RE.test(char)) {
            const label = s.tones ? jp : jp.replace(/\d$/, "");
            return `<ruby class="lp">${char}<rt>${label}</rt></ruby>`;
          }
          return char;
        })
        .join("");
    } else {
      // Batch call preserves sentence context for polyphone disambiguation
      // (e.g. 了 → "le" in 吃了饭 vs "liǎo" in 了解)
      const pinyinArr = pinyin(text, {
        type: "array",
        toneType: s.tones ? "symbol" : "none",
      });
      return chars
        .map((char, i) => {
          if (CJK_RE.test(char)) {
            return `<ruby class="lp">${char}<rt>${pinyinArr[i]}</rt></ruby>`;
          }
          return char;
        })
        .join("");
    }
  }

  function processLine(el) {
    if (el.dataset.pinyinDone === "1") return;
    // Use stored original text if re-processing — innerText would include <rt> content
    const original = el.dataset.originalText || el.innerText;
    if (!original || !hasChinese(original)) return;
    if (!el.dataset.originalText) el.dataset.originalText = original;
    el.innerHTML = buildRuby(original);
    el.dataset.pinyinDone = "1";
  }

  function resetAndProcess() {
    // Only clear pinyinDone — keep originalText so re-processing uses clean source
    document
      .querySelectorAll("[data-pinyin-done]")
      .forEach((el) => delete el.dataset.pinyinDone);
    processAllLines();
  }

  const LYRIC_SELECTORS = [
    '[data-testid="fullscreen-lyric"]',
    '[class*="lyric-"]',
    '[class*="lyrics-lyricsContent-"]',
    ".lyrics-lyrics-container > p",
  ];

  function processAllLines() {
    for (const sel of LYRIC_SELECTORS) {
      const lines = document.querySelectorAll(sel);
      if (lines.length) {
        lines.forEach(processLine);
        return;
      }
    }
  }

  // ── Settings UI ──────────────────────────────────────────────────────────────

  let settingsPanel = null;

  function closeSettings() {
    if (settingsPanel) {
      settingsPanel.remove();
      settingsPanel = null;
    }
  }

  function openSettings() {
    // Toggle
    if (settingsPanel) {
      closeSettings();
      return;
    }

    const s = getSettings();

    const panel = document.createElement("div");
    panel.id = "lyric-pinyin-panel";
    panel.style.cssText = `
      position: fixed;
      top: 60px;
      right: 16px;
      z-index: 9999;
      background: var(--spice-card, #282828);
      border: 1px solid var(--spice-button, #444);
      border-radius: 12px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 18px;
      width: 280px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.6);
      font-family: var(--font-family, CircularSp, sans-serif);
      color: var(--spice-text, #fff);
    `;

    function btn(id, label, active) {
      return `<button id="lp-${id}" style="
        flex: 1;
        padding: 10px 8px;
        border-radius: 8px;
        border: 2px solid ${active ? "#1db954" : "#555"};
        background: ${active ? "rgba(29,185,84,0.15)" : "transparent"};
        color: var(--spice-text, #fff);
        cursor: pointer;
        font-size: 14px;
        transition: border-color 0.15s, background 0.15s;
      ">${label}</button>`;
    }

    panel.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-weight:700; font-size:15px;">拼 Lyric Settings</span>
        <button id="lp-close" style="background:none;border:none;color:var(--spice-subtext,#aaa);cursor:pointer;font-size:18px;line-height:1;">✕</button>
      </div>
      <div>
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--spice-subtext,#aaa);">Characters</p>
        <div style="display:flex;gap:8px;">
          ${btn("simplified", "简 Simplified", s.characters === "simplified")}
          ${btn("traditional", "繁 Traditional", s.characters === "traditional")}
        </div>
      </div>
      <div>
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--spice-subtext,#aaa);">Romanization</p>
        <div style="display:flex;gap:8px;">
          ${btn("pinyin", "pīnyīn", s.romanization === "pinyin")}
          ${btn("jyutping", "jyutping", s.romanization === "jyutping")}
        </div>
      </div>
      <div>
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--spice-subtext,#aaa);">Tones</p>
        <div style="display:flex;gap:8px;">
          ${btn("tones-on", "On (nǐ / gam3)", s.tones === true)}
          ${btn("tones-off", "Off (ni / gam)", s.tones === false)}
        </div>
      </div>
    `;

    function setActive(id) {
      const groups = {
        "lp-simplified":  ["lp-simplified", "lp-traditional"],
        "lp-traditional": ["lp-simplified", "lp-traditional"],
        "lp-pinyin":      ["lp-pinyin", "lp-jyutping"],
        "lp-jyutping":    ["lp-pinyin", "lp-jyutping"],
        "lp-tones-on":    ["lp-tones-on", "lp-tones-off"],
        "lp-tones-off":   ["lp-tones-on", "lp-tones-off"],
      };
      (groups[id] || []).forEach((btnId) => {
        const el = panel.querySelector(`#${btnId}`);
        if (!el) return;
        const active = btnId === id;
        el.style.borderColor = active ? "#1db954" : "#555";
        el.style.background = active ? "rgba(29,185,84,0.15)" : "transparent";
      });
    }

    panel.querySelector("#lp-close").addEventListener("click", closeSettings);

    panel.querySelector("#lp-simplified").addEventListener("click", () => {
      saveSettings({ characters: "simplified" });
      setActive("lp-simplified");
    });
    panel.querySelector("#lp-traditional").addEventListener("click", () => {
      saveSettings({ characters: "traditional" });
      setActive("lp-traditional");
    });
    panel.querySelector("#lp-pinyin").addEventListener("click", () => {
      saveSettings({ romanization: "pinyin" });
      setActive("lp-pinyin");
    });
    panel.querySelector("#lp-jyutping").addEventListener("click", () => {
      saveSettings({ romanization: "jyutping" });
      setActive("lp-jyutping");
    });
    panel.querySelector("#lp-tones-on").addEventListener("click", () => {
      saveSettings({ tones: true });
      setActive("lp-tones-on");
    });
    panel.querySelector("#lp-tones-off").addEventListener("click", () => {
      saveSettings({ tones: false });
      setActive("lp-tones-off");
    });

    // Close when clicking outside
    setTimeout(() => {
      document.addEventListener("click", function onOutside(e) {
        if (!panel.contains(e.target)) {
          closeSettings();
          document.removeEventListener("click", onOutside);
        }
      });
    }, 0);

    document.body.appendChild(panel);
    settingsPanel = panel;
  }

  const triggerBtn = document.createElement("button");
  triggerBtn.id = "lyric-pinyin-trigger";
  triggerBtn.textContent = "文";
  triggerBtn.title = "Lyric Settings";
  triggerBtn.style.cssText = `
    position: fixed;
    top: 72px;
    right: 16px;
    z-index: 9998;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 1.5px solid rgba(255,255,255,0.2);
    background: rgba(0,0,0,0.5);
    color: #fff;
    font-size: 20px;
    font-family: "Kaiti SC", "STKaiti", "AR PL UKai CN", serif;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    backdrop-filter: blur(6px);
    transition: background 0.15s, border-color 0.15s;
  `;
  triggerBtn.addEventListener("mouseenter", () => {
    triggerBtn.style.background = "rgba(255,255,255,0.15)";
    triggerBtn.style.borderColor = "rgba(255,255,255,0.5)";
  });
  triggerBtn.addEventListener("mouseleave", () => {
    triggerBtn.style.background = "rgba(0,0,0,0.5)";
    triggerBtn.style.borderColor = "rgba(255,255,255,0.2)";
  });
  triggerBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    openSettings();
  });
  document.body.appendChild(triggerBtn);

  // ── DOM observer ─────────────────────────────────────────────────────────────

  const observer = new MutationObserver(() => {
    processAllLines();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  Spicetify.Player.addEventListener("songchange", () => {
    setTimeout(() => {
      document.querySelectorAll("[data-pinyin-done]").forEach((el) => {
        delete el.dataset.pinyinDone;
        delete el.dataset.originalText;
      });
      processAllLines();
    }, 800);
  });

  setTimeout(() => processAllLines(), 1000);

  console.log("[lyric-pinyin] loaded");
})();
