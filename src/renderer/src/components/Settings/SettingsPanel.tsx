import { useEffect, useState } from 'react'
import { useEditorStore } from '../../store/editorStore'
import { useI18n, type Locale } from '../../i18n'
import { UPLOADERS, findUploaderSchema, type UploaderId, type FieldDef } from '@shared/index'
import { Notification } from '../../utils/notification'
import type { Theme } from '../../store/editorStore'

interface Props {
  onClose: () => void
}

export function SettingsPanel({ onClose }: Props): JSX.Element {
  const { t, locale } = useI18n()
  const setUploaderId = useEditorStore((s) => s.setUploaderId)
  const setAutoUpload = useEditorStore((s) => s.setAutoUpload)
  const setTheme = useEditorStore((s) => s.setTheme)
  const setLocale = useI18n().setLocale

  const [draftId, setDraftId] = useState<UploaderId | null>(null)
  const [draftValues, setDraftValues] = useState<Record<string, string>>({})
  const [initialValues, setInitialValues] = useState<Record<string, string>>({})
  const [testing, setTesting] = useState(false)
  const [autoUploadVal, setAutoUploadVal] = useState(true)
  const [themeVal, setThemeVal] = useState<Theme>('light')

  const schema = draftId ? findUploaderSchema(draftId) : undefined

  useEffect(() => {
    void (async () => {
      try {
        const cfg = await window.api.getConfig()
        if (draftId == null) {
          setDraftId(cfg.uploaderId as UploaderId)
        }

        const id = (draftId ?? cfg.uploaderId) as UploaderId
        setDraftValues(cfg.uploaders[id] || {})
        setInitialValues(cfg.uploaders[id] || {})
        setAutoUploadVal(cfg.autoUpload ?? true)
        setThemeVal(cfg.theme ?? 'light')
      } catch (err) {
        console.error('Failed to load config', err)
      }
    })()
  }, [draftId])

  const handleSelectUploader = (id: UploaderId): void => {
    setDraftId(id)
  }

  const handleFieldChange = (key: string, value: string): void => {
    setDraftValues((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async (): Promise<void> => {
    if (!draftId) return

    if (schema) {
      const missing = schema.fields
        .filter((field) => field.required && !draftValues[field.key]?.trim())
        .map((field) => field.label)

      if (missing.length > 0) {
        Notification.error(t('settings.missingFields', { fields: missing.join(', ') }))
        return
      }
    }

    setUploaderId(draftId)
    setAutoUpload(autoUploadVal)
    setTheme(themeVal)

    await window.api.setConfig({
      uploaderId: draftId,
      uploaders: { [draftId]: draftValues },
      autoUpload: autoUploadVal,
      theme: themeVal
    } as any)

    Notification.success(t('settings.saved'))
    onClose()
  }

  const handleTest = async (): Promise<void> => {
    if (!draftId) return

    setTesting(true)
    try {
      const testBlob = new Blob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], { type: 'image/png' })
      const buffer = await testBlob.arrayBuffer()
      const result = await window.api.testUpload(
        { name: `test-${Date.now()}.png`, buffer },
        draftId,
        draftValues
      )

      if (result.success) {
        Notification.success(t('settings.testOk', { url: result.url || '' }))
      } else {
        Notification.error(t('settings.testFailed', { msg: result.message || 'unknown' }))
      }
    } catch (err) {
      Notification.error(t('settings.testError', { msg: err instanceof Error ? err.message : String(err) }))
    } finally {
      setTesting(false)
    }
  }

  const handleReset = (): void => {
    setDraftValues({ ...initialValues })
    Notification.info(t('settings.resetDone'))
  }

  const handleLocaleChange = (value: Locale): void => {
    if (value !== locale) setLocale(value)
  }

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal modal-settings" onClick={(event) => event.stopPropagation()}>
        <header>
          <div>
            <span className="modal-eyebrow">{t('settings.general')}</span>
            <h3>{t('settings.title')}</h3>
          </div>
          <button className="close" onClick={onClose}>
            X
          </button>
        </header>

        <div className="modal-body">
          <div className="settings-layout">
            <aside className="settings-sidebar">
              <section className="settings-card">
                <div className="settings-card-header stack">
                  <div>
                    <span className="settings-kicker">{t('settings.currentUploader')}</span>
                    <h4>{t('settings.chooseUploader')}</h4>
                  </div>
                  <p className="hint">{t('settings.selectionHint')}</p>
                </div>

                <ul className="uploader-list">
                  {UPLOADERS.map((uploader) => (
                    <li
                      key={uploader.id}
                      className={draftId === uploader.id ? 'selected' : ''}
                      onClick={() => handleSelectUploader(uploader.id as UploaderId)}
                    >
                      <div className="uploader-name">{uploader.name}</div>
                      <div className="uploader-desc">{uploader.description}</div>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="settings-card settings-card-compact">
                <div className="settings-card-header stack">
                  <div>
                    <span className="settings-kicker">{t('settings.appearance')}</span>
                    <h4>{t('settings.general')}</h4>
                  </div>
                </div>

                <label className="toggle-row">
                  <div className="toggle-copy">
                    <span>{t('settings.autoUpload')}</span>
                    <span className="toggle-hint">{t('settings.autoUploadHint')}</span>
                  </div>
                  <span className="switch">
                    <input
                      type="checkbox"
                      checked={autoUploadVal}
                      onChange={(event) => setAutoUploadVal(event.target.checked)}
                    />
                    <span className="slider" />
                  </span>
                </label>

                <label className="field">
                  <div className="field-label">{t('settings.theme')}</div>
                  <select value={themeVal} onChange={(event) => setThemeVal(event.target.value as Theme)}>
                    <option value="light">{t('settings.themeLight')}</option>
                    <option value="dark">{t('settings.themeDark')}</option>
                  </select>
                </label>

                <label className="toggle-row">
                  <div className="toggle-copy">
                    <span>{t('settings.language')}</span>
                    <span className="toggle-hint">{t('settings.languageHint')}</span>
                  </div>
                  <select
                    value={locale}
                    onChange={(event) => handleLocaleChange(event.target.value as Locale)}
                    className="lang-select"
                  >
                    <option value="en">English</option>
                    <option value="zh">中文</option>
                  </select>
                </label>
              </section>
            </aside>

            <section className="settings-detail">
              <section className="settings-card settings-card-detail">
                <div className="settings-card-header">
                  <div>
                    <span className="settings-kicker">{t('settings.connection')}</span>
                    <h4>{schema?.name || draftId || t('settings.chooseUploader')}</h4>
                  </div>
                  <button onClick={handleTest} disabled={testing || !draftId || schema?.id === 'picgo'}>
                    {testing ? t('settings.testing') : t('settings.testUpload')}
                  </button>
                </div>

                <div className="config-form">
                  <p className="hint">{schema?.description || t('settings.noUploaderHint')}</p>
                  {schema?.fields.length ? (
                    schema.fields.map((field) => (
                      <FieldRow
                        key={field.key}
                        field={field}
                        value={draftValues[field.key] ?? field.defaultValue ?? ''}
                        onChange={(value) => handleFieldChange(field.key, value)}
                      />
                    ))
                  ) : (
                    <div className="settings-empty-state">
                      <strong>{t('settings.noConfigNeeded')}</strong>
                      <span>{t('settings.noUploaderHint')}</span>
                    </div>
                  )}
                </div>
              </section>
            </section>
          </div>
        </div>

        <footer>
          <button onClick={onClose}>{t('settings.close')}</button>
          <button onClick={handleReset} disabled={testing}>
            {t('settings.reset')}
          </button>
          <span className="spacer" />
          <button className="primary" onClick={handleSave} disabled={testing || !draftId}>
            {t('settings.save')}
          </button>
        </footer>
      </div>
    </div>
  )
}

interface FieldRowProps {
  field: FieldDef
  value: string
  onChange: (value: string) => void
}

function FieldRow({ field, value, onChange }: FieldRowProps): JSX.Element {
  const { t } = useI18n()

  return (
    <label className="field">
      <div className="field-label">
        {field.label}
        {field.required && <span className="required">*</span>}
      </div>

      {field.type === 'select' ? (
        <select value={value} onChange={(event) => onChange(event.target.value)}>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : field.type === 'boolean' ? (
        <select value={value} onChange={(event) => onChange(event.target.value)}>
          <option value="true">{t('settings.yes')}</option>
          <option value="false">{t('settings.no')}</option>
        </select>
      ) : (
        <input
          type={field.type === 'password' ? 'password' : 'text'}
          value={value}
          placeholder={field.placeholder}
          onChange={(event) => onChange(event.target.value)}
          autoComplete="off"
        />
      )}

      {field.hint && <div className="field-hint">{field.hint}</div>}
    </label>
  )
}
