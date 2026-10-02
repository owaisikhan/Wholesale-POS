const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// expo-sqlite is native-only here (the web demo uses sql.js from public/), but
// keep wasm resolvable and the dev server isolated in case it is imported.
config.resolver.assetExts.push("wasm");
// Small web font subsets (src/fonts.web.js).
config.resolver.assetExts.push("woff2");
config.server.enhanceMiddleware = (middleware) => (req, res, next) => {
  res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  middleware(req, res, next);
};

module.exports = config;
