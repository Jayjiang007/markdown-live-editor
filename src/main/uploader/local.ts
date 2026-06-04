import { join } from 'node:path'
import { promises as fs } from 'node:fs'
import type { UploadResult } from '@shared/index'
import { ensureLocalDir } from '../uploader'

export async function uploadToLocal(
  buffer: Buffer,
  filename: string,
  config: Record<string, string>
): Promise<UploadResult> {
  const subdir = config.path || 'assets'
  const fullDir = await ensureLocalDir(subdir)
  const safe = filename.replace(/[\\/:*?"<>|]/g, '_')
  const filePath = join(fullDir, safe)
  await fs.writeFile(filePath, buffer)
  return {
    success: true,
    url: `file://${filePath.replace(/\\/g, '/')}`,
    filename: safe
  }
}
