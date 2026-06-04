import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { randomBytes } from 'node:crypto'
import { app } from 'electron'
import type { UploadResult } from '@shared/index'

// Silence TS unused warnings
void app

// PicGo-Core integration.
//
// We use picgo-core as a library. The flow:
//   1. Initialize a PicGo instance pointing at the user's existing config
//      (~/.picgo/config.json on macOS/Linux, %APPDATA%\picgo\config.json on Windows).
//   2. Write the incoming buffer to a temp file.
//   3. Call picgo.upload([tmpPath]) and wait for the result.
//   4. Clean up the temp file, return the first image URL.
//
// This gives us access to all 60+ picgo image hosts and the picgo plugin ecosystem.

interface PicGoInstance {
  upload(input: any[]): Promise<any[] | Error>
  setConfig(config: Record<string, any>): void
  getConfig<T = any>(name?: string): T
  saveConfig(config: Record<string, any>): void
  on(event: string, listener: (...args: any[]) => void): this
  once(event: string, listener: (...args: any[]) => void): this
  removeListener(event: string, listener: (...args: any[]) => void): this
}

// Lazy import — picgo may pull in lots of plugins
let picgoModulePromise: Promise<any> | null = null
function loadPicgo(): Promise<any> {
  if (!picgoModulePromise) {
    picgoModulePromise = import('picgo')
  }
  return picgoModulePromise
}

function getPicgoConfigPath(): string {
  // Allow override via env
  if (process.env.PICGO_CONFIG_PATH) return process.env.PICGO_CONFIG_PATH

  // Use platform-specific default
  const home = app.getPath('home')
  if (process.platform === 'win32') {
    return join(process.env.APPDATA || join(home, 'AppData', 'Roaming'), 'picgo', 'config.json')
  } else if (process.platform === 'darwin') {
    return join(home, 'Library', 'Application Support', 'picgo', 'config.json')
  } else {
    return join(process.env.XDG_CONFIG_HOME || join(home, '.config'), 'picgo', 'config.json')
  }
}

async function createPicgoInstance(): Promise<PicGoInstance> {
  const { PicGo } = await loadPicgo()
  const configPath = getPicgoConfigPath()

  // Make sure the parent directory exists
  try {
    await fs.mkdir(join(configPath, '..'), { recursive: true })
  } catch {
    // ignore
  }

  const instance: PicGoInstance = new PicGo(configPath)

  // Suppress noisy console output
  instance.on('log', () => {})
  instance.on('error', () => {})

  return instance
}

export async function uploadViaPicgo(
  buffer: Buffer,
  filename: string,
  _config: Record<string, string>
): Promise<UploadResult> {
  // Write to temp file (picgo upload is path-based)
  const tmpDir = join(tmpdir(), 'markdown-live-editor-picgo')
  await fs.mkdir(tmpDir, { recursive: true })
  const safeName = filename.replace(/[\\/:*?"<>|]/g, '_')
  const tmpFile = join(tmpDir, `${Date.now()}-${randomBytes(4).toString('hex')}-${safeName}`)

  try {
    await fs.writeFile(tmpFile, buffer)

    const instance = await createPicgoInstance()

    const result = await instance.upload([tmpFile])

    if (result instanceof Error) {
      return { success: false, message: result.message }
    }

    if (Array.isArray(result) && result.length > 0) {
      const first = result[0]
      const url = first.imgUrl || first.url
      if (!url) {
        return { success: false, message: 'PicGo did not return a URL' }
      }
      return {
        success: true,
        url,
        delete: first.deleteUrl,
        filename: first.fileName || safeName
      }
    }

    return { success: false, message: 'PicGo returned no images' }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, message: `PicGo error: ${msg}` }
  } finally {
    try {
      await fs.unlink(tmpFile)
    } catch {
      // ignore
    }
  }
}
