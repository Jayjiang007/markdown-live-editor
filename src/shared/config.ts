import type { UploaderId } from './uploader'

export interface AppConfig {
  uploaderId: UploaderId
  uploaders: Record<string, Record<string, string>>
  viewMode: 'split' | 'editor' | 'preview'
  theme: 'light' | 'dark'
  autoUpload: boolean
  locale: 'en' | 'zh'
}
