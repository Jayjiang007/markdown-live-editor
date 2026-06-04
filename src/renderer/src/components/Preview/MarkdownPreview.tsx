import { useEffect, useMemo, useRef, useState } from 'react'
import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'
import { useEditorStore } from '../../store/editorStore'
import { createHighlightPlugin } from './plugins/highlight'
import { createKatexPlugin } from './plugins/katex'
import { createMermaidPlugin } from './plugins/mermaid'

interface Props {
  source: string
}

export function MarkdownPreview({ source }: Props): JSX.Element {
  const theme = useEditorStore((s) => s.theme)
  const ref = useRef<HTMLDivElement>(null)
  const [mermaidReady, setMermaidReady] = useState(false)

  const md = useMemo(() => {
    const instance = new MarkdownIt({
      html: false,
      linkify: true,
      breaks: true,
      typographer: true
    })

    instance.use(createHighlightPlugin())
    instance.use(createKatexPlugin())
    instance.use(createMermaidPlugin(() => setMermaidReady(true)))
    return instance
  }, [])

  const html = useMemo(() => {
    const raw = md.render(source)
    return DOMPurify.sanitize(raw, {
      ADD_ATTR: ['target', 'class', 'style']
    })
  }, [md, source, mermaidReady])

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = 0
  }, [source])

  return (
    <div ref={ref} className={`preview theme-${theme}`}>
      <div className="markdown-body" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
