import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        // CRITICAL FIX: force both import paths to the same module
        // Navbar.tsx, WorldMapLite.tsx import from 'framer-motion'
        // Everything else imports from 'motion/react'
        // Without this alias, Rollup bundles them as TWO separate chunks = ~80KB wasted
        'framer-motion': 'motion/react',
      },
    },

    build: {
      target: 'es2020',           // Modern browsers → smaller output
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          passes: 2,              // 2-pass = ~5% extra savings
          pure_funcs: ['console.log', 'console.warn', 'console.error'],
        },
        format: { comments: false },
      },

      rollupOptions: {
        output: {
          // Function form = smarter splitting than object form
          manualChunks(id) {
            if (id.includes('node_modules/react/') ||
                id.includes('node_modules/react-dom/') ||
                id.includes('node_modules/react-router-dom/')) {
              return 'react-vendor';        // ~42KB gz — never changes
            }
            if (id.includes('node_modules/motion') ||
                id.includes('node_modules/framer-motion')) {
              return 'motion';              // ~30KB gz — changes rarely
            }
            if (id.includes('node_modules/lucide-react')) {
              return 'lucide';              // ~15KB gz — changes rarely
            }
            if (id.includes('node_modules/react-simple-maps') ||
                id.includes('node_modules/d3-geo') ||
                id.includes('node_modules/topojson-client') ||
                id.includes('node_modules/cobe')) {
              return 'maps';               // ~60KB gz — only needed on map pages
            }
            if (id.includes('node_modules/lenis')) {
              return 'scroll';             // ~4KB gz
            }
          },
        },
      },

      sourcemap: false,
      chunkSizeWarningLimit: 600,
      cssCodeSplit: true,         // Each route gets only the CSS it needs
    },

    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
