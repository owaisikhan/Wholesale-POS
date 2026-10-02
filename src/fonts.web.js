// Web demo: woff2 subsets (Latin, or the Urdu block) made with pyftsubset from
// assets/fonts/*.ttf. About 400 KB in all instead of 2.4 MB of TTF, which on a
// slow phone connection is the difference between seconds and minutes.
export const LATIN = {
  Sans: require("../assets/fonts/web/plex-sans-400.woff2"),
  "Sans-SemiBold": require("../assets/fonts/web/plex-sans-600.woff2"),
  "Sans-Bold": require("../assets/fonts/web/plex-sans-700.woff2"),
  Cond: require("../assets/fonts/web/plex-cond-400.woff2"),
  "Cond-Medium": require("../assets/fonts/web/plex-cond-500.woff2"),
  "Cond-Bold": require("../assets/fonts/web/plex-cond-700.woff2"),
};

export const URDU = {
  Urdu: require("../assets/fonts/web/nastaliq-400.woff2"),
  "Urdu-Bold": require("../assets/fonts/web/nastaliq-700.woff2"),
};
