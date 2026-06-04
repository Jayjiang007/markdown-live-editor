import { BrowserWindow, dialog } from 'electron'
import { promises as fs } from 'node:fs'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import htmlToDocx from 'html-to-docx'

const EXPORT_STYLES = `
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif;
  font-size: 14px;
  line-height: 1.6;
  color: #24292e;
  max-width: 980px;
  margin: 0 auto;
  padding: 24px 32px;
}
h1, h2, h3, h4 { font-weight: 600; line-height: 1.25; margin-top: 24px; margin-bottom: 16px; }
h1 { font-size: 2em; border-bottom: 1px solid #d0d7de; padding-bottom: 0.3em; }
h2 { font-size: 1.5em; border-bottom: 1px solid #d0d7de; padding-bottom: 0.3em; }
h3 { font-size: 1.25em; }
h4 { font-size: 1em; }
p { margin: 0 0 16px; }
code { font-family: 'JetBrains Mono', Menlo, Consolas, monospace; background: #f6f8fa; padding: 0.2em 0.4em; border-radius: 6px; font-size: 85%; }
pre { background: #f6f8fa; padding: 16px; border-radius: 6px; overflow: auto; font-size: 85%; line-height: 1.45; }
pre code { background: transparent; padding: 0; font-size: 100%; }
table { border-collapse: collapse; margin: 16px 0; }
th, td { border: 1px solid #d0d7de; padding: 6px 13px; }
blockquote { margin: 0 0 16px; padding: 0 1em; color: #57606a; border-left: 0.25em solid #d0d7de; }
img { max-width: 100%; }
ul, ol { padding-left: 2em; margin: 0 0 16px; }
a { color: #0969da; text-decoration: none; }
.hljs { background: #f6f8fa; }
.hljs-comment, .hljs-quote { color: #6a737d; font-style: italic; }
.hljs-keyword, .hljs-selector-tag { color: #d73a49; font-weight: 600; }
.hljs-number, .hljs-literal { color: #005cc5; }
.hljs-string { color: #032f62; }
.hljs-title, .hljs-section { color: #6f42c1; font-weight: 600; }
`

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight(str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang, ignoreIllegals: true }).value}</code></pre>`
      } catch { }
    }
    return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`
  }
})

function getExportHtml(content: string): string {
  const body = md.render(content)
  return `<!doctype html><html><head><meta charset="utf-8"><style>${EXPORT_STYLES}</style></head><body class="markdown-body">${body}</body></html>`
}

export async function exportMarkdown(
  content: string,
  format: 'pdf' | 'docx' | 'png'
): Promise<{ success: boolean; path?: string; error?: string }> {
  const win = BrowserWindow.getFocusedWindow()
  const defaultName = `export-${Date.now()}`
  const filterMap: Record<string, Electron.FileFilter[]> = {
    pdf: [{ name: 'PDF', extensions: ['pdf'] }],
    docx: [{ name: 'Word Document', extensions: ['docx'] }],
    png: [{ name: 'PNG Image', extensions: ['png'] }]
  }

  const result = await dialog.showSaveDialog(win!, {
    title: `Export as ${format.toUpperCase()}`,
    defaultPath: `${defaultName}.${format}`,
    filters: filterMap[format]
  })

  if (result.canceled || !result.filePath) return { success: false }

  try {
    if (format === 'docx') {
      const html = getExportHtml(content)
      const buf = await htmlToDocx(html, null, {
        table: { maxColumnWidth: 600 },
        footer: true,
        pageNumber: true
      })
      await fs.writeFile(result.filePath, buf)
    } else {
      const html = getExportHtml(content)
      const exportWin = new BrowserWindow({
        width: 800,
        height: 600,
        show: false,
        webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false }
      })
      exportWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)

      if (format === 'pdf') {
        const pdfBuf = await exportWin.webContents.printToPDF({ printBackground: true })
        await fs.writeFile(result.filePath, pdfBuf)
      } else {
        const nativeImg = await exportWin.webContents.capturePage()
        const pngBuf = nativeImg.toPNG()
        await fs.writeFile(result.filePath, pngBuf)
      }
      exportWin.destroy()
    }
    return { success: true, path: result.filePath }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}
