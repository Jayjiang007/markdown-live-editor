import { createHmac } from 'node:crypto'
import type { UploadResult } from '@shared/index'

// Qiniu upload protocol:
// 1. POST to upload endpoint with multipart/form-data
// 2. Header: Authorization: Upload <uploadToken>
// 3. uploadToken = base64url(AccessKey + ":" + Sign(<PutPolicy JSON>))
// 4. Sign = base64url(HMAC-SHA1(secretKey, PutPolicy JSON))
//
// PutPolicy:
//   {
//     "scope": "<bucket>",
//     "deadline": <unix_timestamp>,
//     "insertOnly": 0|1
//   }

function base64UrlEncode(buf: Buffer | string): string {
  const b = typeof buf === 'string' ? Buffer.from(buf) : buf
  return b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function hmacSha1(key: string | Buffer, data: string): Buffer {
  return createHmac('sha1', key).update(data).digest()
}

export async function uploadToQiniu(
  buffer: Buffer,
  filename: string,
  config: Record<string, string>
): Promise<UploadResult> {
  const { accessKey, secretKey, bucket, region, domain, path: prefix = '' } = config
  if (!accessKey || !secretKey || !bucket || !region) {
    return { success: false, message: 'Qiniu: missing accessKey / secretKey / bucket / region' }
  }

  const regionEndpoint: Record<string, string> = {
    z0: 'https://upload.qiniup.com',
    z1: 'https://upload-up.qiniup.com',
    z2: 'https://upload-xs.qiniup.com',
    na0: 'https://upload-na0.qiniup.com',
    as0: 'https://upload-as0.qiniup.com'
  }
  const uploadEndpoint = regionEndpoint[region] || regionEndpoint.z0

  const deadline = Math.floor(Date.now() / 1000) + 3600
  const putPolicy = JSON.stringify({
    scope: bucket,
    deadline,
    insertOnly: 0
  })
  const encodedPolicy = base64UrlEncode(putPolicy)
  const sign = base64UrlEncode(hmacSha1(secretKey, encodedPolicy))
  const uploadToken = `${accessKey}:${sign}`

  const safePrefix = prefix ? prefix.replace(/\/?$/, '/') : ''
  const key = `${safePrefix}${filename}`

  const form = new FormData()
  form.append('token', uploadToken)
  form.append('key', key)
  form.append('file', new Blob([new Uint8Array(buffer)]), filename)

  const resp = await fetch(uploadEndpoint, {
    method: 'POST',
    body: form
  })

  if (!resp.ok) {
    const text = await resp.text()
    return { success: false, message: `Qiniu HTTP ${resp.status}: ${text.slice(0, 200)}` }
  }

  const json = (await resp.json()) as { key?: string; hash?: string; error?: string }
  if (json.error) {
    return { success: false, message: `Qiniu: ${json.error}` }
  }

  const cleanDomain = (domain || `https://${bucket}.qiniucdn.com`).replace(/\/+$/, '')
  const url = `${cleanDomain}/${key}`
  return { success: true, url, filename: key }
}
