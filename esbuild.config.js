const esbuild = require("esbuild");

esbuild.build({
  entryPoints: ["src/index.js"],
  bundle: true,
  outfile: "dist/lyric-pinyin.js",
  platform: "browser",
  minify: true,
  sourcemap: false,
}).catch(() => process.exit(1));
