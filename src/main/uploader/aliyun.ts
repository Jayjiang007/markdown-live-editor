import { createHmac } from 'node:crypto'
import type { UploadResult } from '@shared/index'

// Aliyun OSS upload using PostObject (browser-friendly, no SDK needed).
// Signature: base64(HMAC-SHA1(AccessKeySecret, policyString))
//
// Required form fields:
//   key, policy, OSSAccessKeyId, signature, file, success_action_status=200

function base64(buf: Buffer | string): string {
  const b = typeof buf === 'string' ? Buffer.from(buf) : buf
  return b.toString('base64')
}

export async function uploadToAliyun(
  buffer: Buffer,
  filename: string,
  config: Record<string, string>
): Promise<UploadResult> {
  const {
    accessKeyId,
    accessKeySecret,
    bucket,
    region,
    endpoint,
    path: prefix = ''
  } = config

  if (!accessKeyId || !accessKeySecret || !bucket || !region) {
    return { success: false, message: 'Aliyun OSS: missing accessKeyId / accessKeySecret / bucket / region' }
  }

  const safePrefix = prefix ? prefix.replace(/\/?$/, '/') : ''
  const key = `${safePrefix}${filename}`

  const host = (endpoint || `https://${bucket}.oss-${region}.aliyuncs.com`).replace(/\/+$/, '')
  const expiration = new Date(Date.now() + 60 * 60 * 1000).toISOString()

  const policy = {
    expiration,
    conditions: [
      { bucket },
      ['eq', '$key', key],
      ['content-length-range', 0, 100 * 1024 * 1024]
    ]
  }
  const policyBase64 = base64(JSON.stringify(policy))
  const signature = base64(createHmac('sha1', accessKeySecret).update(policyBase64).digest())

  const form = new FormData()
  form.append('key', key)
  form.append('policy', policyBase64)
  form.append('OSSAccessKeyId', accessKeyId)
  form.append('signature', signature)
  form.append('success_action_status', '200')
  form.append('file', new Blob([new Uint8Array(buffer)]), filename)

  const resp = await fetch(host, { method: 'POST', body: form })

  if (resp.status === 200 || resp.status === 204) {
    return { success: true, url: `${host}/${key}`, filename: key }
  }

  const text = await resp.text()
  return { success: false, message: `Aliyun OSS HTTP ${resp.status}: ${text.slice(0, 200)}` }
}
