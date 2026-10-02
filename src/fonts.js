// Native (Android): full TTF files. The web demo uses src/fonts.web.js instead.
// LATIN must be ready before the app draws; URDU may load after.
export const LATIN = {
  Sans: require("../assets/fonts/plex-sans-400.ttf"),
  "Sans-SemiBold": require("../assets/fonts/plex-sans-600.ttf"),
  "Sans-Bold": require("../assets/fonts/plex-sans-700.ttf"),
  Cond: require("../assets/fonts/plex-cond-400.ttf"),
  "Cond-Medium": require("../assets/fonts/plex-cond-500.ttf"),
  "Cond-Bold": require("../assets/fonts/plex-cond-700.ttf"),
};

export const URDU = {
  Urdu: require("../assets/fonts/nastaliq-400.ttf"),
  "Urdu-Bold": require("../assets/fonts/nastaliq-700.ttf"),
};
