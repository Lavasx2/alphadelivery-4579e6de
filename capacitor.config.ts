import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.alphadelivery.app",
  appName: "Alpha Delivery",
  // The native app is a shell around the live website (SSR app on the cloud).
  webDir: "www",
  server: {
    url: "https://alphadelivery.lovable.app",
    androidScheme: "https",
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
