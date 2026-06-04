import { createHmac, createHash } from 'node:crypto'
import type { UploadResult } from '@shared/index'

// Tencent Cloud COS — uses simple upload via POST/PUT with Signature V1.
// SignString = "a=[appId]&b=[bucket]&k=[key]&t=[currentTime]&e=[expireTime]&r=[rand]&f=[fileSha1]"
// Signature = HMAC-SHA1(secretKey, SignString) base64
//   secretKey = COS_SECRET_ID => actual key: COS_SECRET_KEY
//
// We'll use the simpler approach: PUT to https://<BucketName-APPID>.cos.<Region>.myqcloud.com/<Key>
// Authorization: <Signature>

function sha1Hex(buf: Buffer): string {
  return createHash('sha1').update(buf).digest('hex')
}

function getCosTime(time: number): string {
  return Math.floor(time / 1000).toString()
}

export async function uploadToTencent(
  buffer: Buffer,
  filename: string,
  config: Record<string, string>
): Promise<UploadResult> {
  const { secretId, secretKey, bucket, region, appId, path: prefix = '' } = config

  if (!secretId || !secretKey || !bucket || !region || !appId) {
    return { success: false, message: 'Tencent COS: missing secretId / secretKey / bucket / region / appId' }
  }

  const safePrefix = prefix ? prefix.replace(/\/?$/, '/') : ''
  const key = `${safePrefix}${filename}`
  const host = `https://${bucket}-${appId}.cos.${region}.myqcloud.com`
  const url = `${host}/${encodeURIComponent(key)}`

  const now = Date.now()
  const expiredTime = getCosTime(now + 60 * 60 * 1000)
  const currentTime = getCosTime(now)
  const rand = Math.random().toString(36).slice(2, 10)
  const fileSha1 = sha1Hex(buffer)

  const signString = [
    `a=${appId}`,
    `b=${bucket}`,
    `k=${key}`,
    `t=${currentTime}`,
    `e=${expiredTime}`,
    `r=${rand}`,
    `f=${fileSha1}`
  ].join('&')

  const signature = createHmac('sha1', secretKey).update(signString).digest('base64')

  const resp = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': signature,
      'Content-Type': 'application/octet-stream',
      'x-cos-meta-md5': createHash('md5').update(buffer).digest('hex')
    },
    body: new Uint8Array(buffer)
  })

  if (resp.ok || resp.status === 200) {
    return { success: true, url, filename: key }
  }

  const text = await resp.text()
  return { success: false, message: `Tencent COS HTTP ${resp.status}: ${text.slice(0, 200)}` }
}
