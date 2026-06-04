import { createHmac, createHash } from 'node:crypto'
import type { UploadResult } from '@shared/index'

// AWS Signature V4 — PUT request signing
// Reference: https://docs.aws.amazon.com/IAM/latest/UserGuide/create-signed-request.html
// Works for: AWS S3, Cloudflare R2 (override endpoint), MinIO, Wasabi, etc.

function sha256(data: string | Buffer | Uint8Array): string {
  return createHash('sha256').update(data).digest('hex')
}

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac('sha256', key).update(data).digest()
}

function amzDate(date = new Date()): { date: string; datetime: string } {
  const pad = (n: number) => n.toString().padStart(2, '0')
  const d = `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`
  const t = `${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}`
  return { date: d, datetime: `${d}T${t}Z` }
}

function uriEscape(s: string): string {
  return encodeURIComponent(s).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase())
}

interface S3Config {
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  region: string
  endpoint: string
  publicUrl: string
  path: string
  forcePathStyle?: boolean
}

export async function uploadToS3(
  buffer: Buffer,
  filename: string,
  config: Record<string, string>
): Promise<UploadResult> {
  const cfg: S3Config = {
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    bucket: config.bucket,
    region: config.region,
    endpoint: (config.endpoint || `https://s3.${config.region}.amazonaws.com`).replace(/\/+$/, ''),
    publicUrl: (config.publicUrl || '').replace(/\/+$/, ''),
    path: (config.path || '').replace(/\/?$/, '/'),
    forcePathStyle: config.forcePathStyle === 'true'
  }

  if (!cfg.accessKeyId || !cfg.secretAccessKey || !cfg.bucket || !cfg.region) {
    return { success: false, message: 'S3: missing accessKeyId / secretAccessKey / bucket / region' }
  }

  const key = `${cfg.path}${filename}`

  // Construct endpoint URL
  let host: string
  if (cfg.forcePathStyle) {
    const endpointUrl = new URL(cfg.endpoint)
    host = endpointUrl.host
  } else {
    const endpointUrl = new URL(cfg.endpoint)
    host = `${cfg.bucket}.${endpointUrl.host}`
  }

  const url = cfg.forcePathStyle
    ? `${cfg.endpoint}/${cfg.bucket}/${uriEscape(key)}`
    : `${cfg.endpoint.replace(/^(https?:\/\/)/, '$1' + cfg.bucket + '.')}/${uriEscape(key)}`

  // Re-derive host after possible rewrite
  const finalUrl = new URL(url)
  host = finalUrl.host

  const { date, datetime } = amzDate()
  const payloadHash = sha256(buffer)
  const contentType = 'application/octet-stream'

  const canonicalHeaders =
    `content-type:${contentType}\n` +
    `host:${host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${datetime}\n`

  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date'

  const canonicalRequest = [
    'PUT',
    finalUrl.pathname,
    finalUrl.search.slice(1),
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n')

  const credentialScope = `${date}/${cfg.region}/s3/aws4_request`
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    datetime,
    credentialScope,
    sha256(canonicalRequest)
  ].join('\n')

  // Derive signing key
  const kDate = hmac(`AWS4${cfg.secretAccessKey}`, date)
  const kRegion = hmac(kDate, cfg.region)
  const kService = hmac(kRegion, 's3')
  const kSigning = hmac(kService, 'aws4_request')

  const signature = createHmac('sha256', kSigning).update(stringToSign).digest('hex')

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`

  const resp = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
      'Host': host,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': datetime,
      'Authorization': authorization
    },
    body: new Uint8Array(buffer)
  })

  if (resp.ok) {
    const finalUrl = cfg.publicUrl
      ? `${cfg.publicUrl}/${uriEscape(key)}`
      : url
    return { success: true, url: finalUrl, filename: key }
  }

  const text = await resp.text()
  return { success: false, message: `S3 HTTP ${resp.status}: ${text.slice(0, 200)}` }
}
