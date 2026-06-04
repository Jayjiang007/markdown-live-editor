import { useEffect, useRef, useState } from 'react'
import { useEditorStore } from '../../store/editorStore'
import { useI18n } from '../../i18n'
import { Notification } from '../../utils/notification'
import type { ViewMode } from '../../store/editorStore'

interface Props {
  onSettings: () => void
}

type ExportFormat = 'pdf' | 'docx' | 'png'

export function Toolbar({ onSettings }: Props): JSX.Element {
  const { t } = useI18n()
  const viewMode = useEditorStore((s) => s.viewMode)
  const setViewMode = useEditorStore((s) => s.setViewMode)
  const content = useEditorStore((s) => s.content)
  const setContent = useEditorStore((s) => s.setContent)
  const [exporting, setExporting] = useState(false)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  const insert = (left: string, right = '', placeholder = ''): void => {
    const sample = placeholder || 'text'
    const spacer = content.length === 0 || content.endsWith('\n') ? '' : '\n'
    setContent(`${content}${spacer}${left}${sample}${right}`)
  }

  const handleOpen = async (): Promise<void> => {
    const result = await window.api.openFile()
    if (result) setContent(result.content)
  }

  const handleSave = async (): Promise<void> => {
    await window.api.saveFile('', content)
    Notification.success(t('editor.saved'))
  }

  const handleExport = async (format: ExportFormat): Promise<void> => {
    setExportMenuOpen(false)
    setExporting(true)
    try {
      const result = await window.api.exportMarkdown(content, format)
      if (result.success) {
        Notification.success(t('export.saved', { path: result.path || '' }))
      } else {
        Notification.error(t('export.failed', { msg: result.error || 'unknown' }))
      }
    } catch (err) {
      Notification.error(t('export.failed', { msg: err instanceof Error ? err.message : String(err) }))
    } finally {
      setExporting(false)
    }
  }

  useEffect(() => {
    if (!exportMenuOpen) return

    const handlePointerDown = (event: MouseEvent): void => {
      if (!exportRef.current?.contains(event.target as Node)) {
        setExportMenuOpen(false)
      }
    }

    window.addEventListener('mousedown', handlePointerDown)
    return () => window.removeEventListener('mousedown', handlePointerDown)
  }, [exportMenuOpen])

  const formatActions = [
    { key: 'bold', label: 'B', title: t('toolbar.bold'), action: () => insert('**', '**', 'bold text') },
    { key: 'italic', label: 'I', title: t('toolbar.italic'), action: () => insert('*', '*', 'italic text') },
    { key: 'heading', label: 'H1', title: t('toolbar.heading'), action: () => insert('## ', '', 'Heading') },
    { key: 'link', label: 'Link', title: t('toolbar.link'), action: () => insert('[', '](https://)', 'link text') },
    { key: 'image', label: 'Image', title: t('toolbar.image'), action: () => insert('![', '](https://)', 'alt') },
    { key: 'code', label: 'Code', title: t('toolbar.code'), action: () => insert('`', '`', 'code') },
    { key: 'list', label: 'List', title: t('toolbar.list'), action: () => insert('- ', '', 'item') },
    { key: 'task', label: 'Task', title: t('toolbar.task'), action: () => insert('- [ ] ', '', 'task') },
    { key: 'quote', label: 'Quote', title: t('toolbar.quote'), action: () => insert('> ', '', 'quote') },
    {
      key: 'table',
      label: 'Table',
      title: t('toolbar.table'),
      action: () => insert('| A | B |\n| - | - |\n| 1 | 2 |', '')
    }
  ]

  const viewActions: Array<{ mode: ViewMode; label: string; title: string }> = [
    { mode: 'editor', label: t('toolbar.editor'), title: t('toolbar.editorOnly') },
    { mode: 'split', label: t('toolbar.split'), title: t('toolbar.splitView') },
    { mode: 'preview', label: t('toolbar.preview'), title: t('toolbar.previewOnly') }
  ]

  return (
    <div className="toolbar">
      <div className="toolbar-brand">
        <div className="toolbar-brand-mark">M</div>
        <div className="toolbar-brand-copy">
          <strong>{t('app.title')}</strong>
          <span>{t('toolbar.brandCaption')}</span>
        </div>
      </div>

      <div className="toolbar-cluster">
        <button className="toolbar-button primary" onClick={handleOpen} title={t('toolbar.openFile')}>
          {t('toolbar.openFile')}
        </button>
        <button className="toolbar-button" onClick={handleSave} title={t('toolbar.save')}>
          {t('toolbar.save')}
        </button>
        <div className="export-dropdown" ref={exportRef}>
          <button
            className="toolbar-button"
            disabled={exporting}
            title={t('toolbar.export')}
            onClick={() => setExportMenuOpen((open) => !open)}
          >
            {t('toolbar.exportMenu')}
          </button>

          {exportMenuOpen && (
            <div className="export-menu">
              <button onClick={() => handleExport('pdf')} disabled={exporting}>
                {t('export.pdf')}
              </button>
              <button onClick={() => handleExport('docx')} disabled={exporting}>
                {t('export.docx')}
              </button>
              <button onClick={() => handleExport('png')} disabled={exporting}>
                {t('export.png')}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="toolbar-cluster toolbar-cluster-format">
        {formatActions.map((item) => (
          <button key={item.key} className="toolbar-button subtle" title={item.title} onClick={item.action}>
            {item.label}
          </button>
        ))}
      </div>

      <div className="toolbar-cluster segmented-control">
        {viewActions.map((item) => (
          <button
            key={item.mode}
            className={viewMode === item.mode ? 'toolbar-button active' : 'toolbar-button'}
            onClick={() => setViewMode(item.mode)}
            title={item.title}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="toolbar-cluster right">
        <button className="toolbar-button" onClick={onSettings} title={t('toolbar.settings')}>
          {t('toolbar.settings')}
        </button>
      </div>
    </div>
  )
}
