import { defineConfig } from 'vite'
import pkg from './package.json'

export default defineConfig({
    base: "/jstebeat/",
    define: {
        __APP_VERSION__: JSON.stringify(pkg.version),
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    cmstate: [
                        "@codemirror/state",
                    ],
                    cmbasic: [
                        "codemirror",
                    ],
                    cmjs: [
                        "@codemirror/lang-javascript",
                    ],
                    cmcp: [
                        "@catppuccin/codemirror",
                    ],
                }
            }
        }
    }
})