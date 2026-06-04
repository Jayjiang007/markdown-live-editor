import { app } from 'electron'
import { join } from 'node:path'
import { promises as fs } from 'node:fs'
import { getConfig, getUploaderConfig } from './config/store'
import { uploadToUguu } from './uploader/uguu'
import { uploadToSmms } from './uploader/smms'
import { uploadToLocal } from './uploader/local'
import { uploadToGithub } from './uploader/github'
import { uploadToQiniu } from './uploader/qiniu'
import { uploadToAliyun } from './uploader/aliyun'
import { uploadToTencent } from './uploader/tencent'
import { uploadToS3 } from './uploader/s3'
import { uploadViaPicgo } from './uploader/picgo'
import type { UploadResult, UploaderId } from '@shared/index'

export async function handleUpload(
  file: { name: string; buffer: ArrayBuffer },
  overrideUploaderId?: string,
  overrideConfig?: Record<string, string>
): Promise<UploadResult> {
  const cfg = getConfig()
  const uploaderId = (overrideUploaderId || cfg.uploaderId) as UploaderId
  const uploaderCfg = overrideConfig ?? getUploaderConfig(uploaderId)
  const buf = Buffer.from(file.buffer)

  try {
    switch (uploaderId) {
      case 'uguu':
        return await uploadToUguu(buf, file.name, uploaderCfg)
      case 'smms':
        return await uploadToSmms(buf, file.name, uploaderCfg)
      case 'github':
        return await uploadToGithub(buf, file.name, uploaderCfg)
      case 'local':
        return await uploadToLocal(buf, file.name, uploaderCfg)
      case 'qiniu':
        return await uploadToQiniu(buf, file.name, uploaderCfg)
      case 'aliyun':
        return await uploadToAliyun(buf, file.name, uploaderCfg)
      case 'tencent':
        return await uploadToTencent(buf, file.name, uploaderCfg)
      case 's3':
        return await uploadToS3(buf, file.name, uploaderCfg)
      case 'picgo':
        return await uploadViaPicgo(buf, file.name, uploaderCfg)
      default:
        return { success: false, message: `Unknown uploader: ${uploaderId}` }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[upload] failed:`, msg)
    return { success: false, message: msg }
  }
}

// Helper for local storage
export async function ensureLocalDir(localPath: string): Promise<string> {
  const base = app.getPath('userData')
  const full = join(base, localPath)
  await fs.mkdir(full, { recursive: true })
  return full
}
