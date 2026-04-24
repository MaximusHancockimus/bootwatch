// Merges app.json with env-driven native config (EAS Build injects secrets as env vars).
// Set GOOGLE_MAPS_API_KEY in `.env` locally and in EAS → Project → Secrets for release builds.
// Required APIs enabled in Google Cloud: Maps SDK for Android, Maps SDK for iOS, Maps JavaScript API.
const appJson = require('./app.json');

const mapsKey = process.env.GOOGLE_MAPS_API_KEY;

module.exports = {
  expo: {
    ...appJson.expo,
    updates: {
      ...appJson.expo.updates,
      url: 'https://u.expo.dev/87c7f12a-d69e-437a-b44c-3602478b2d92',
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
    extra: {
      ...appJson.expo.extra,
      eas: {
        ...appJson.expo.extra?.eas,
        projectId: '87c7f12a-d69e-437a-b44c-3602478b2d92',
      },
    },
    ios: {
      ...appJson.expo.ios,
      infoPlist: {
        ...appJson.expo.ios?.infoPlist,
        ITSAppUsesNonExemptEncryption: false,
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
