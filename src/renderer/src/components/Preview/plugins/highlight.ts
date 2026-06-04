import type MarkdownIt from 'markdown-it'
import hljs from 'highlight.js/lib/common'

export function createHighlightPlugin() {
  return (md: MarkdownIt): void => {
    md.options.highlight = (str, lang) => {
      if (lang && hljs.getLanguage(lang)) {
        try {
          const out = hljs.highlight(str, { language: lang, ignoreIllegals: true })
          return `<pre class="hljs"><code class="language-${lang}">${out.value}</code></pre>`
        } catch {
          // fallthrough
        }
      }
      return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`
    }
  }
}
