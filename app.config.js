// Merges app.json with env-driven native config (EAS Build injects secrets as env vars).
// Android release maps: set GOOGLE_MAPS_API_KEY in EAS → Project → Secrets (Maps SDK for Android enabled in Google Cloud).
const appJson = require('./app.json');

const mapsKey = process.env.GOOGLE_MAPS_API_KEY;

module.exports = {
  expo: {
    ...appJson.expo,
    android: {
      ...appJson.expo.android,
      config: {
        ...appJson.expo.android?.config,
        ...(mapsKey ? { googleMaps: { apiKey: mapsKey } } : {}),
      },
    },
  },
};
