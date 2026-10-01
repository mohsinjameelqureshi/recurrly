const app = require("./app.json");

module.exports = {
  ...app,
  expo: {
    ...app.expo,
    extra: {
      ...app.expo.extra,
      posthogProjectToken: process.env.EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN,
      posthogHost: process.env.EXPO_PUBLIC_POSTHOG_HOST,
    },
  },
};
