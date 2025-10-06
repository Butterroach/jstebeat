import { defineConfig } from 'vite'
import pkg from './package.json'
import fs from 'fs'

export default defineConfig({
    base: "/jstebeat/",
    server: {
        https: {
            key: fs.readFileSync('./cert/key.pem'),
            cert: fs.readFileSync('./cert/cert.pem'),
        },
        host: true,
    },
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