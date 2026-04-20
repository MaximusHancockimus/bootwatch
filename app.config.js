// Merges app.json with env-driven native config (EAS Build injects secrets as env vars).
// Android release maps: set GOOGLE_MAPS_API_KEY in EAS → Project → Secrets (Maps SDK for Android enabled in Google Cloud).
const appJson = require('./app.json');

const mapsKey = process.env.GOOGLE_MAPS_API_KEY;

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      eas: {
        ...appJson.expo.extra?.eas,
        projectId: '87c7f12a-d69e-437a-b44c-3602478b2d92',
      },
    },
    android: {
      ...appJson.expo.android,
      config: {
        ...appJson.expo.android?.config,
        ...(mapsKey ? { googleMaps: { apiKey: mapsKey } } : {}),
      },
    },
  },
};
