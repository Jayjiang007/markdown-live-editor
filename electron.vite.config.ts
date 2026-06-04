import { resolve } from 'node:path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'

/**
 * Custom plugin: externalize only Electron-provided modules + node builtins.
 * Everything else (including picgo and its transitive deps like `conf`) gets
 * bundled into the main process output. This is required because electron-
 * builder's pnpm hoisting doesn't always copy transitive deps into the asar,
 * causing "Cannot find module 'conf'" at runtime.
 */
function bundleAllPlugin(): Plugin {
  const nodeBuiltins = new Set([
    'electron', 'electron/renderer', 'electron/main', 'electron/common',
    'fsevents', 'better-sqlite3', 'sqlite3', 'node-gyp-build'
  ])

  return {
    name: 'bundle-all-except-electron',
    apply: 'build',
    enforce: 'pre',
    config(config) {
      if (!config.build) config.build = {}
      if (!config.build.rollupOptions) config.build.rollupOptions = {}
      config.build.rollupOptions.external = (id: string, _importer?: string, isResolved?: boolean) => {
        // Native modules and things required at runtime by Electron
        if (nodeBuiltins.has(id)) return true
        if (id.startsWith('node:')) return true
        // Externalize only when not yet resolved (i.e., external pkg name)
        if (!isResolved && /^[^./]/.test(id)) {
          // Let rollup resolve; if it ends up being a node builtin, external
          // Otherwise (real npm pkg), bundle it
          return false
        }
        return false
      }
    }
  }
}

export default defineConfig({
  main: {
    // Don't use externalizeDepsPlugin — it would mark picgo and its deps
    // as runtime externals, but electron-builder's pnpm hoisting doesn't
    // reliably copy transitive deps. Instead, use a custom plugin that
    // bundles everything.
    plugins: [bundleAllPlugin()],
    build: {
      rollupOptions: {
        input: { index: resolve(__dirname, 'src/main/index.ts') },
        output: {
          // Don't split into chunks; keep it as a single file for simpler
          // resolution in the asar.
          inlineDynamicImports: true
        }
      }
    },
    resolve: {
      alias: {
        '@main': resolve('src/main'),
        '@shared': resolve('src/shared')
      }
    }
  },
  preload: {
    // Bundle preload dependencies into the output so packaged builds don't
    // depend on excluded node_modules at runtime.
    plugins: [],
    build: {
      rollupOptions: {
        input: { index: resolve(__dirname, 'src/preload/index.ts') }
      }
    },
    resolve: {
      alias: {
        '@shared': resolve('src/shared'),
        '@preload': resolve('src/preload')
      }
    }
  },
  renderer: {
    root: 'src/renderer',
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@shared': resolve('src/shared')
      }
    },
    plugins: [react()],
    build: {
      rollupOptions: {
        input: { index: resolve(__dirname, 'src/renderer/index.html') }
      }
    },
    server: { port: 5173 }
  }
})
