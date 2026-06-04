import type { UploadResult } from '@shared/index'

interface UguuResponse {
  success: boolean
  files?: Array<{
    hash: string
    filename: string
    mimetype: string
    url: string
    size: number
    dupe: boolean
  }>
  errors?: Array<{ message: string }>
}

export async function uploadToUguu(
  buffer: Buffer,
  filename: string,
  _config: Record<string, string>
): Promise<UploadResult> {
  const form = new FormData()
  form.append('files[]', new Blob([new Uint8Array(buffer)]), filename)

  const resp = await fetch('https://uguu.se/upload', {
    method: 'POST',
    body: form
  })

  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    return {
      success: false,
      message: `Uguu HTTP ${resp.status}: ${text.slice(0, 200) || resp.statusText}`
    }
  }

  const json = (await resp.json()) as UguuResponse
  if (!json.success || !json.files || json.files.length === 0) {
    const errMsg = json.errors?.[0]?.message || 'Uguu upload failed'
    return { success: false, message: errMsg }
  }

  return {
    success: true,
    url: json.files[0].url,
    filename: json.files[0].filename
  }
}
