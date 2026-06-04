import { useCallback, useEffect } from 'react'
import { useEditorStore } from './store/editorStore'
import { I18nProvider, useI18n, type Locale } from './i18n'
import { Toolbar } from './components/Toolbar/Toolbar'
import { StatusBar } from './components/StatusBar/StatusBar'
import { MarkdownEditor } from './components/Editor/MarkdownEditor'
import { MarkdownPreview } from './components/Preview/MarkdownPreview'
import { SettingsPanel } from './components/Settings/SettingsPanel'
import { Notification } from './utils/notification'
import type { ViewMode } from './store/editorStore'

function AppInner(): JSX.Element {
  const { t } = useI18n()
  const viewMode = useEditorStore((s) => s.viewMode)
  const theme = useEditorStore((s) => s.theme)
  const setViewMode = useEditorStore((s) => s.setViewMode)
  const loadConfig = useEditorStore((s) => s.loadConfig)
  const content = useEditorStore((s) => s.content)
  const setContent = useEditorStore((s) => s.setContent)
  const showSettings = useEditorStore((s) => s.showSettings)
  const toggleSettings = useEditorStore((s) => s.toggleSettings)
  const autoUpload = useEditorStore((s) => s.autoUpload)

  useEffect(() => {
    void loadConfig()
  }, [loadConfig])

  useEffect(() => {
    const offs: Array<() => void> = []

    offs.push(
      window.api.onMenuEvent('open-file', async () => {
        const result = await window.api.openFile()
        if (result) setContent(result.content)
      })
    )

    offs.push(
      window.api.onMenuEvent('save-file', async () => {
        await window.api.saveFile('', content)
        Notification.success(t('editor.saved'))
      })
    )

    offs.push(
      window.api.onMenuEvent('view-mode', (mode: ViewMode) => {
        if (['editor', 'split', 'preview'].includes(mode)) {
          setViewMode(mode)
        }
      })
    )

    offs.push(
      window.api.onMenuEvent('find', () => {
        Notification.info(t('editor.pressCtrlF'))
      })
    )

    return () => offs.forEach((off) => off())
  }, [content, setContent, setViewMode, t])

  const lineCount = content.length === 0 ? 1 : content.split('\n').length
  const words = content.trim().length === 0 ? 0 : content.trim().split(/\s+/).length
  const readMinutes = words === 0 ? 0 : Math.max(1, Math.ceil(words / 200))
  const documentTitle = content.match(/^#\s+(.+)$/m)?.[1]?.trim() || t('workspace.untitled')
  const viewLabel =
    viewMode === 'editor'
      ? t('toolbar.editor')
      : viewMode === 'preview'
        ? t('toolbar.preview')
        : t('toolbar.split')

  return (
    <div className={`app theme-${theme}`}>
      <div className="app-backdrop" />
      <Toolbar onSettings={toggleSettings} />

      <section className="workspace-header">
        <div className="workspace-title-block">
          <span className="workspace-eyebrow">{t('workspace.eyebrow')}</span>
          <h1>{documentTitle}</h1>
          <p>{t('workspace.subtitle')}</p>
        </div>

        <div className="workspace-metrics">
          <div className="metric-card">
            <span className="metric-label">{t('workspace.lines')}</span>
            <strong>{lineCount}</strong>
          </div>
          <div className="metric-card">
            <span className="metric-label">{t('workspace.readingLabel')}</span>
            <strong>
              {readMinutes === 0 ? t('workspace.readingEmpty') : t('workspace.readingTime', { count: readMinutes })}
            </strong>
          </div>
          <div className="metric-card">
            <span className="metric-label">{t('workspace.currentView')}</span>
            <strong>{viewLabel}</strong>
          </div>
          <div className="metric-card">
            <span className="metric-label">{t('workspace.uploadState')}</span>
            <strong>{autoUpload ? t('workspace.uploadEnabled') : t('workspace.uploadDisabled')}</strong>
          </div>
        </div>
      </section>

      <div className={`workarea view-${viewMode}`}>
        {viewMode !== 'preview' && (
          <section className="pane pane-editor pane-shell pane-editor-shell">
            <div className="pane-body">
              <MarkdownEditor value={content} onChange={setContent} />
            </div>
          </section>
        )}

        {viewMode === 'split' && <div className="splitter" />}

        {viewMode !== 'editor' && (
          <section className="pane pane-preview pane-shell pane-preview-shell">
            <div className="pane-body">
              <MarkdownPreview source={content} />
            </div>
          </section>
        )}
      </div>

      <StatusBar />
      {showSettings && <SettingsPanel onClose={toggleSettings} />}
    </div>
  )
}

export default function App(): JSX.Element {
  const locale = useEditorStore((s) => s.locale)
  const zustandSetLocale = useEditorStore((s) => s.setLocale)

  const handleLocaleChange = useCallback(
    (value: Locale) => {
      zustandSetLocale(value)
      window.api.setConfig({ locale: value } as any)
    },
    [zustandSetLocale]
  )

  return (
    <I18nProvider initialLocale={locale} onLocaleChange={handleLocaleChange}>
      <AppInner />
    </I18nProvider>
  )
}
