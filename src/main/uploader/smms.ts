import type { UploadResult } from '@shared/index'

interface SmmsResponse {
  success: boolean
  code?: string
  message?: string
  data?: {
    url: string
    delete?: string
    filename: string
  }
}

export async function uploadToSmms(
  buffer: Buffer,
  filename: string,
  config: Record<string, string>
): Promise<UploadResult> {
  const form = new FormData()
  form.append('smfile', new Blob([new Uint8Array(buffer)]), filename)
  const headers: Record<string, string> = {}
  if (config.token) headers['Authorization'] = config.token

  const resp = await fetch('https://sm.ms/api/v2/upload', {
    method: 'POST',
    body: form,
    headers
  })

  if (!resp.ok) {
    return { success: false, message: `HTTP ${resp.status}: ${resp.statusText}` }
  }

  const json = (await resp.json()) as SmmsResponse
  if (!json.success) {
    return { success: false, message: json.message || 'SM.MS upload failed' }
  }
  return {
    success: true,
    url: json.data!.url,
    delete: json.data!.delete,
    filename: json.data!.filename
  }
}
