import { ElectronAPI } from '@electron-toolkit/preload'

export interface IpcApi {
  upload: (file: { name: string; buffer: ArrayBuffer }, uploaderId?: string) => Promise<UploadResult>
  testUpload: (
    file: { name: string; buffer: ArrayBuffer },
    uploaderId: string,
    uploaderConfig: Record<string, string>
  ) => Promise<UploadResult>
  readClipboardImage: () => Promise<ClipboardImage | null>
  getConfig: () => Promise<AppConfig>
  setConfig: (patch: Partial<AppConfig>) => Promise<void>
  openFile: () => Promise<OpenedFile | null>
  saveFile: (path: string, content: string) => Promise<void>
  exportMarkdown: (content: string, format: 'pdf' | 'docx' | 'png') => Promise<{ success: boolean; path?: string; error?: string }>
  onMenuEvent: (
    event: 'open-file' | 'save-file' | 'find' | 'view-mode',
    handler: (payload: any) => void
  ) => () => void
}

export interface UploadResult {
  success: boolean
  url?: string
  delete?: string
  filename?: string
  message?: string
}

export interface ClipboardImage {
  name: string
  buffer: ArrayBuffer
}

export interface OpenedFile {
  path: string
  content: string
}

export interface AppConfig {
  uploaderId: UploaderId
  uploaders: Record<string, Record<string, string>>
  viewMode: 'split' | 'editor' | 'preview'
  theme: 'light' | 'dark'
  autoUpload: boolean
  locale: 'en' | 'zh'
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: IpcApi
  }
}
