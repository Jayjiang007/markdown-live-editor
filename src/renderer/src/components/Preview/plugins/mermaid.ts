import type MarkdownIt from 'markdown-it'
import type { Token } from 'markdown-it'

let mermaidLoader: Promise<typeof import('mermaid').default> | null = null
let initialized = false

async function loadMermaid() {
  if (!mermaidLoader) {
    mermaidLoader = import('mermaid').then((m) => {
      const mermaid = m.default
      if (!initialized) {
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
          fontFamily: 'inherit'
        })
        initialized = true
      }
      return mermaid
    })
  }
  return mermaidLoader
}

export function createMermaidPlugin(onLoaded: () => void) {
  return (md: MarkdownIt): void => {
    const defaultFence = md.renderer.rules.fence!
    md.renderer.rules.fence = (tokens: Token[], idx: number, options, env, slf) => {
      const token = tokens[idx]
      if (token.info.trim() === 'mermaid') {
        const code = token.content
        const id = `mermaid-${Math.random().toString(36).slice(2, 10)}`
        void loadMermaid().then(async (mermaid) => {
          const el = document.getElementById(id)
          if (!el) return
          try {
            const { svg } = await mermaid.render(`${id}-svg`, code)
            el.innerHTML = svg
            onLoaded()
          } catch (err) {
            el.innerHTML = `<pre class="mermaid-error">${(err as Error).message}</pre>`
          }
        })
        return `<div class="mermaid" id="${id}">${md.utils.escapeHtml(code)}</div>`
      }
      return defaultFence(tokens, idx, options, env, slf)
    }
  }
}
