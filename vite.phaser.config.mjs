import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "app",
    emptyOutDir: false,
    lib: { entry: "src/phaser-room.ts", formats: ["es"], fileName: () => "phaser-room.js" },
  },
});
