import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Strangler-fig setup (see MIGRATION_LOG.md, 1단계).
// React is built as an ADDITIVE bundle that the existing vanilla
// public/index.html loads via a single <script type="module">.
//
// Deliberate choices to avoid breaking the working vanilla app:
//  - We do NOT emit a dist/index.html. FastAPI (app/main.py) keeps serving
//    public/index.html as the single entry point. (main.py auto-prefers
//    frontend/dist/ if present, so we must never create it here.)
//  - publicDir:false — FastAPI already serves frontend/public/** static
//    assets directly, so Vite must not copy/clear the public directory.
//  - Output goes into public/static/react/ (a generated, gitignored folder)
//    with a stable filename so index.html can reference /static/react/main.js.
export default defineConfig({
  plugins: [react()],
  base: '/static/react/',
  publicDir: false,
  build: {
    outDir: 'public/static/react',
    emptyOutDir: true,
    rollupOptions: {
      input: 'src/react-mount/main.jsx',
      output: {
        entryFileNames: 'main.js',
        chunkFileNames: 'chunk-[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
})
