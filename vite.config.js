"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vite_1 = require("vite");
const plugin_react_1 = __importDefault(require("@vitejs/plugin-react"));
const vite_plugin_electron_1 = __importDefault(require("vite-plugin-electron"));
const vite_plugin_electron_renderer_1 = __importDefault(require("vite-plugin-electron-renderer"));
const path_1 = __importDefault(require("path"));
exports.default = (0, vite_1.defineConfig)({
    plugins: [
        (0, plugin_react_1.default)(),
        (0, vite_plugin_electron_1.default)([
            {
                entry: "electron/main.ts",
                onstart() {
                    // Prevent automatic electron startup
                },
                vite: {
                    build: {
                        outDir: "dist-electron",
                        minify: "esbuild",
                        rollupOptions: {
                            external: [
                                "electron",
                                "slack-maxqda-adapter",
                                "electron-store",
                                "node-machine-id",
                                "image-size",
                            ],
                            output: {
                                format: "cjs",
                            },
                        },
                    },
                },
            },
            {
                entry: "electron/preload.ts",
                onstart() {
                    // Prevent automatic electron startup
                },
                vite: {
                    build: {
                        outDir: "dist-electron",
                        minify: "esbuild",
                        rollupOptions: {
                            external: ["electron"],
                            output: {
                                format: "cjs",
                            },
                        },
                    },
                },
            },
        ]),
        (0, vite_plugin_electron_renderer_1.default)(),
    ],
    resolve: {
        alias: {
            "@": path_1.default.resolve(__dirname, "./src"),
        },
    },
    build: {
        minify: "esbuild",
        target: "esnext",
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ["react", "react-dom"],
                    ui: [
                        "@radix-ui/react-dialog",
                        "@radix-ui/react-select",
                        "@radix-ui/react-tabs",
                    ],
                },
            },
        },
    },
});
