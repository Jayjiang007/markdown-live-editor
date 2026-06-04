export type UploaderId = 'uguu' | 'smms' | 'github' | 'qiniu' | 'aliyun' | 'tencent' | 's3' | 'local' | 'picgo'

export interface UploadInput {
  buffer: ArrayBuffer
  filename: string
  mimeType: string
}

export interface UploadResult {
  success: boolean
  url?: string
  delete?: string
  filename?: string
  message?: string
}

export interface UploaderConfig {
  id: UploaderId
  name: string
  enabled: boolean
  fields: Record<string, string>
}

export interface Uploader {
  id: UploaderId
  name: string
  configSchema: Array<{
    key: string
    label: string
    type: 'text' | 'password' | 'select'
    required?: boolean
    options?: Array<{ label: string; value: string }>
    placeholder?: string
  }>
  upload: (input: UploadInput, config: Record<string, string>) => Promise<UploadResult>
}
