import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import monkey from "vite-plugin-monkey";

export default defineConfig({
  plugins: [
    solidPlugin(),
    monkey({
      entry: "src/index.tsx",
      userscript: {
        icon: "https://vitejs.dev/logo.svg",
        namespace: "npm/teams-custom-reactions",
        match: ["https://teams.microsoft.com/multi-window/*"],
        downloadURL:
          "https://github.com/Woyken/teams-custom-reactions-userscript/raw/gh-pages/teams-custom-reactions.user.js",
      },
    }),
  ],
});
