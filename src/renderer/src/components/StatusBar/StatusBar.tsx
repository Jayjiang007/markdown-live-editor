import { useEditorStore } from '../../store/editorStore'
import { useI18n } from '../../i18n'

export function StatusBar(): JSX.Element {
  const { t } = useI18n()
  const content = useEditorStore((s) => s.content)
  const cursorPos = useEditorStore((s) => s.cursorPos)
  const uploaderId = useEditorStore((s) => s.uploaderId)
  const autoUpload = useEditorStore((s) => s.autoUpload)
  const theme = useEditorStore((s) => s.theme)

  const before = content.slice(0, cursorPos)
  const line = before.split('\n').length
  const col = before.length - before.lastIndexOf('\n')
  const words = content.trim().length === 0 ? 0 : content.trim().split(/\s+/).length
  const chars = content.length

  return (
    <div className="statusbar">
      <span className="status-pill">{t('statusbar.lineCol', { line, col })}</span>
      <span className="status-pill">{t('statusbar.words', { count: words })}</span>
      <span className="status-pill">{t('statusbar.chars', { count: chars })}</span>
      <span className="spacer" />
      <span className="status-pill">
        {autoUpload ? t('statusbar.uploader', { name: uploaderId }) : t('statusbar.uploadDisabled')}
      </span>
      <span className="status-pill">{theme === 'dark' ? t('settings.themeDark') : t('settings.themeLight')}</span>
    </div>
  )
}
