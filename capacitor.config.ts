import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.arrows.puzzle",
  appName: "Arrows Puzzle",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
};

export default config;
