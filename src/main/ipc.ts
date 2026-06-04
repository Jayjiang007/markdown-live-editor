import { ipcMain, clipboard } from 'electron'
import { IPC } from '@shared/ipc-events'
import { handleUpload } from './uploader'
import { getConfig, setConfig } from './config/store'
import { openFileDialog, saveFileDialog } from './file'
import { exportMarkdown } from './export'
import type { UploaderId } from '@shared/index'

export function registerIpcHandlers(): void {
  ipcMain.handle(IPC.UPLOAD, async (_event, payload: { file: { name: string; buffer: ArrayBuffer }; uploaderId?: string }) => {
    return handleUpload(payload.file, payload.uploaderId)
  })

  ipcMain.handle(
    IPC.TEST_UPLOAD,
    async (
      _event,
      payload: { file: { name: string; buffer: ArrayBuffer }; uploaderId: UploaderId; uploaderConfig: Record<string, string> }
    ) => {
      return handleUpload(payload.file, payload.uploaderId, payload.uploaderConfig)
    }
  )

  ipcMain.handle(IPC.READ_CLIPBOARD_IMAGE, async () => {
    const img = clipboard.readImage()
    if (img.isEmpty()) return null
    const buf = img.toPNG()
    return {
      name: `clipboard-${Date.now()}.png`,
      buffer: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
    }
  })

  ipcMain.handle(IPC.GET_CONFIG, async () => getConfig())
  ipcMain.handle(IPC.SET_CONFIG, async (_event, patch: Record<string, unknown>) => setConfig(patch))

  ipcMain.handle(IPC.OPEN_FILE, async () => openFileDialog())
  ipcMain.handle(IPC.SAVE_FILE, async (_event, payload: { path: string; content: string }) => saveFileDialog(payload.path, payload.content))

  ipcMain.handle(IPC.EXPORT, async (_event, payload: { content: string; format: 'pdf' | 'docx' | 'png' }) => {
    return exportMarkdown(payload.content, payload.format)
  })
}
