import type MarkdownIt from 'markdown-it'
import katex from 'katex'

export function createKatexPlugin() {
  return (md: MarkdownIt): void => {
    md.inline.ruler.after('escape', 'math_inline', (state, silent) => {
      const start = state.pos
      if (state.src.charCodeAt(start) !== 0x24 /* $ */) return false
      if (state.src.charCodeAt(start + 1) === 0x24) return false
      const end = state.src.indexOf('$', start + 1)
      if (end === -1) return false
      const content = state.src.slice(start + 1, end)
      if (/^\s/.test(content) || /\s$/.test(content)) return false
      if (!silent) {
        const token = state.push('math_inline', 'span', 0)
        token.content = content
      }
      state.pos = end + 1
      return true
    })

    md.inline.ruler.after('math_inline', 'math_block', (state, silent) => {
      const start = state.pos
      if (state.src.charCodeAt(start) !== 0x24 /* $ */) return false
      if (state.src.charCodeAt(start + 1) !== 0x24) return false
      const end = state.src.indexOf('$$', start + 2)
      if (end === -1) return false
      const content = state.src.slice(start + 2, end)
      if (!silent) {
        const token = state.push('math_block', 'div', 0)
        token.content = content
      }
      state.pos = end + 2
      return true
    })

    md.renderer.rules.math_inline = (tokens, idx) => {
      try {
        return katex.renderToString(tokens[idx].content, { throwOnError: false, displayMode: false })
      } catch {
        return `<span class="katex-error">${tokens[idx].content}</span>`
      }
    }
    md.renderer.rules.math_block = (tokens, idx) => {
      try {
        return `<div class="katex-block">${katex.renderToString(tokens[idx].content, { throwOnError: false, displayMode: true })}</div>`
      } catch {
        return `<div class="katex-error">${tokens[idx].content}</div>`
      }
    }
  }
}
