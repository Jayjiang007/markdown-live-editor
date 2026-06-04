import { EditorView } from '@codemirror/view'
import { Notification } from '../../../utils/notification'

export function pasteImageExtension(autoUploadRef: { current: boolean }) {
  return EditorView.domEventHandlers({
    paste(event, view) {
      if (!autoUploadRef.current) return

      const items = event.clipboardData?.items
      if (!items || items.length === 0) return

      const imageItems: File[] = []
      for (const item of Array.from(items)) {
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) imageItems.push(file)
        }
      }

      if (imageItems.length === 0) return

      event.preventDefault()

      const head = view.state.selection.main.head
      let cursor = head

      const placeholders: Array<{ from: number; to: number; filename: string }> = []

      for (const file of imageItems) {
        const ext = (file.type.split('/')[1] || 'png').replace('jpeg', 'jpg')
        const filename = `pasted-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
        const placeholder = `![uploading ${filename}](${filename})\n`
        view.dispatch({
          changes: { from: cursor, insert: placeholder },
          selection: { anchor: cursor + placeholder.length }
        })
        placeholders.push({ from: cursor, to: cursor + placeholder.length, filename })
        cursor += placeholder.length
      }

      view.dispatch({ selection: { anchor: cursor } })
      view.focus()

      ;(async () => {
        for (const ph of placeholders) {
          try {
            const buffer = await imageItems[placeholders.indexOf(ph)].arrayBuffer()
            const result = await window.api.upload(
              { name: ph.filename, buffer },
              undefined
            )
            const replaceText = result.success
              ? `![${ph.filename}](${result.url})\n`
              : `![upload failed: ${result.message || 'unknown'}](${ph.filename})\n`

            view.dispatch({
              changes: { from: ph.from, to: ph.to, insert: replaceText }
            })

            if (result.success) {
              Notification.success(`Uploaded: ${ph.filename}`)
            } else {
              Notification.error(`Upload failed: ${result.message || 'unknown'}`)
            }
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err)
            view.dispatch({
              changes: { from: ph.from, to: ph.to, insert: `![upload error: ${msg}](${ph.filename})\n` }
            })
            Notification.error(`Upload error: ${msg}`)
          }
        }
      })()
    },
    drop(event, view) {
      if (!autoUploadRef.current) return
      const files = event.dataTransfer?.files
      if (!files || files.length === 0) return
      const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'))
      if (imageFiles.length === 0) return
      event.preventDefault()
      const head = view.state.selection.main.head
      let cursor = head
      ;(async () => {
        for (const file of imageFiles) {
          const ext = (file.type.split('/')[1] || 'png').replace('jpeg', 'jpg')
          const filename = file.name || `dropped-${Date.now()}.${ext}`
          const buffer = await file.arrayBuffer()
          const result = await window.api.upload({ name: filename, buffer }, undefined)
          const text = result.success
            ? `![${filename}](${result.url})\n`
            : `![upload failed](${filename})\n`
          view.dispatch({
            changes: { from: cursor, insert: text },
            selection: { anchor: cursor + text.length }
          })
          cursor += text.length
        }
      })()
    }
  })
}
