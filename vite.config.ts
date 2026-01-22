import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Use esbuild for minification (built-in, no extra dependency)
    minify: 'esbuild',
    // Code splitting configuration
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React ecosystem
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // UI framework
          'vendor-ui': ['framer-motion', 'lucide-react', 'clsx', 'tailwind-merge'],
          // Data layer
          'vendor-data': ['@tanstack/react-query', '@supabase/supabase-js'],
          // Form handling
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          // Radix UI components (heavy)
          'vendor-radix': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-accordion',
            '@radix-ui/react-select',
          ],
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Enable source maps for production debugging (optional)
    sourcemap: false,
    // CSS code splitting
    cssCodeSplit: true,
    // Asset inlining threshold (4kb)
    assetsInlineLimit: 4096,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'lucide-react',
      '@tanstack/react-query',
    ],
  },
}));
