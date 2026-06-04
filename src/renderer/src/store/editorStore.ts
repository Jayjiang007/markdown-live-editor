import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ViewMode = 'split' | 'editor' | 'preview'
export type Theme = 'light' | 'dark'
export type Locale = 'en' | 'zh'

interface EditorState {
  content: string
  viewMode: ViewMode
  theme: Theme
  locale: Locale
  cursorPos: number
  showSettings: boolean
  uploaderId: string
  autoUpload: boolean
  setContent: (v: string) => void
  setViewMode: (m: ViewMode) => void
  setTheme: (t: Theme) => void
  setCursorPos: (p: number) => void
  toggleSettings: () => void
  setUploaderId: (id: string) => void
  setAutoUpload: (v: boolean) => void
  setLocale: (l: Locale) => void
  loadConfig: () => Promise<void>
}

const DEFAULT_CONTENT = `# Markdown Live Editor

Welcome! Edit on the **left**, preview on the **right** in real-time.

## Features

- **Bold**, *italic*, ~~strikethrough~~
- [Links](https://github.com) and images
- Code blocks with syntax highlighting
- Tables, task lists, quotes
- Mermaid diagrams and math formulas
- **Paste images to upload to image hosting** (Ctrl+V)

## Code

\`\`\`ts
function hello(name: string): string {
  return \`Hello, \${name}!\`
}
\`\`\`

## Table

| Column A | Column B |
| -------- | -------- |
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |

## Task List

- [x] Set up editor
- [x] Live preview
- [ ] Image upload (paste to try!)
- [ ] Mermaid diagram

\`\`\`mermaid
graph LR
  A[Editor] --> B[Markdown]
  B --> C[Preview]
\`\`\`

\`\`\`math
E = mc^2
\`\`\`

> Tip: try pasting a screenshot with **Ctrl+V** in the editor.
`

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      content: DEFAULT_CONTENT,
      viewMode: 'split',
      theme: 'light',
      locale: 'en',
      cursorPos: 0,
      showSettings: false,
      uploaderId: 'uguu',
      autoUpload: true,
      setContent: (v) => set({ content: v }),
      setViewMode: (m) => set({ viewMode: m }),
      setTheme: (t) => set({ theme: t }),
      setCursorPos: (p) => set({ cursorPos: p }),
      toggleSettings: () => set((s) => ({ showSettings: !s.showSettings })),
      setUploaderId: (id) => set({ uploaderId: id }),
      setAutoUpload: (v) => set({ autoUpload: v }),
      setLocale: (l) => set({ locale: l }),
      loadConfig: async () => {
        try {
          const cfg = await window.api.getConfig()
          if (cfg.uploaderId) set({ uploaderId: cfg.uploaderId })
          if (cfg.viewMode) set({ viewMode: cfg.viewMode })
          if (cfg.theme) set({ theme: cfg.theme })
          if (cfg.autoUpload !== undefined) set({ autoUpload: cfg.autoUpload })
          if (cfg.locale) set({ locale: cfg.locale as Locale })
        } catch {
          // ignore
        }
      }
    }),
    {
      name: 'markdown-live-editor',
      // `uploaderId` is intentionally NOT persisted: the main process
      // (electron-store) is the single source of truth for uploader
      // configuration. Persisting it here leads to stale values that
      // can race the main process on app start.
      partialize: (s) => ({
        content: s.content,
        viewMode: s.viewMode,
        theme: s.theme
      }),
      // One-time migration: drop any previously persisted uploaderId
      // (from older builds) so the next loadConfig() call always wins.
      migrate: (persistedState: unknown, _version: number) => {
        if (persistedState && typeof persistedState === 'object') {
          const s = persistedState as Record<string, unknown>
          delete s.uploaderId
        }
        return persistedState as EditorState
      },
      version: 1
    }
  )
)
