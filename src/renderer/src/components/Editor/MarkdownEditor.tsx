import { useEffect, useRef } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search'
import { bracketMatching, indentOnInput, syntaxHighlighting, defaultHighlightStyle, HighlightStyle } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'
import { pasteImageExtension } from './extensions/pasteImage'
import { useEditorStore } from '../../store/editorStore'

const markdownHighlight = HighlightStyle.define([
  { tag: t.heading, color: '#0550ae', fontWeight: 'bold' },
  { tag: t.strong, color: '#953800', fontWeight: 'bold' },
  { tag: t.emphasis, color: '#3b1f7a', fontStyle: 'italic' },
  { tag: t.link, color: '#0969da', textDecoration: 'underline' },
  { tag: t.url, color: '#0969da' },
  { tag: t.monospace, color: '#116329', background: '#f0f4f8' },
  { tag: t.quote, color: '#57606a', fontStyle: 'italic' },
  { tag: t.list, color: '#cf222e' },
  { tag: t.processingInstruction, color: '#8250df' },
  { tag: t.contentSeparator, color: '#0550ae' }
])

interface Props {
  value: string
  onChange: (v: string) => void
}

export function MarkdownEditor({ value, onChange }: Props): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const setCursorPos = useEditorStore((s) => s.setCursorPos)
  const autoUpload = useEditorStore((s) => s.autoUpload)
  const autoUploadRef = useRef(autoUpload)
  autoUploadRef.current = autoUpload

  useEffect(() => {
    if (!containerRef.current) return

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        history(),
        bracketMatching(),
        indentOnInput(),
        syntaxHighlighting(markdownHighlight, { fallback: true }),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        highlightSelectionMatches(),
        markdown(),
        EditorView.lineWrapping,
        keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap, indentWithTab]),
        pasteImageExtension(autoUploadRef),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) onChange(update.state.doc.toString())
          if (update.selectionSet) setCursorPos(update.state.selection.main.head)
        })
      ]
    })

    const view = new EditorView({ state, parent: containerRef.current })
    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const current = view.state.doc.toString()
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value }
      })
    }
  }, [value])

  return <div ref={containerRef} className="cm-container" />
}
