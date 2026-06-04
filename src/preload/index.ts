import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IPC } from '@shared/ipc-events'

const api = {
  upload: (file: { name: string; buffer: ArrayBuffer }, uploaderId?: string) =>
    ipcRenderer.invoke(IPC.UPLOAD, { file, uploaderId }),
  testUpload: (
    file: { name: string; buffer: ArrayBuffer },
    uploaderId: string,
    uploaderConfig: Record<string, string>
  ) => ipcRenderer.invoke(IPC.TEST_UPLOAD, { file, uploaderId, uploaderConfig }),
  readClipboardImage: () => ipcRenderer.invoke(IPC.READ_CLIPBOARD_IMAGE),
  getConfig: () => ipcRenderer.invoke(IPC.GET_CONFIG),
  setConfig: (patch: Record<string, unknown>) => ipcRenderer.invoke(IPC.SET_CONFIG, patch),
  openFile: () => ipcRenderer.invoke(IPC.OPEN_FILE),
  saveFile: (path: string, content: string) => ipcRenderer.invoke(IPC.SAVE_FILE, { path, content }),

  exportMarkdown: (content: string, format: 'pdf' | 'docx' | 'png') =>
    ipcRenderer.invoke(IPC.EXPORT, { content, format }),

  // Subscribe to menu events from main process
  onMenuEvent: (event: 'open-file' | 'save-file' | 'find' | 'view-mode', handler: (payload: any) => void) => {
    const channelMap: Record<string, string> = {
      'open-file': IPC.MENU_OPEN_FILE,
      'save-file': IPC.MENU_SAVE_FILE,
      'find': IPC.MENU_FIND,
      'view-mode': IPC.MENU_VIEW_MODE
    }
    const channel = channelMap[event]
    const listener = (_e: unknown, payload: any) => handler(payload)
    ipcRenderer.on(channel, listener)
    return () => ipcRenderer.removeListener(channel, listener)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
