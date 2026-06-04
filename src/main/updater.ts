import { dialog } from 'electron'
import { autoUpdater, type ProgressInfo, type UpdateInfo } from 'electron-updater'
import { is } from '@electron-toolkit/utils'

let initialized = false

export function initAutoUpdater(): void {
  if (initialized) return
  initialized = true

  // Disable auto-update in dev mode
  if (is.dev) {
    console.log('[updater] skipped in dev mode')
    return
  }

  // Configure logging to user data directory
  autoUpdater.logger = {
    info: (msg) => console.log('[updater]', msg),
    warn: (msg) => console.warn('[updater]', msg),
    error: (msg) => console.error('[updater]', msg),
    debug: (msg) => console.log('[updater:debug]', msg)
  }

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => {
    console.log('[updater] checking for update…')
  })

  autoUpdater.on('update-available', (info: UpdateInfo) => {
    console.log('[updater] update available:', info.version)
  })

  autoUpdater.on('update-not-available', () => {
    console.log('[updater] no update available')
  })

  autoUpdater.on('download-progress', (progress: ProgressInfo) => {
    console.log(`[updater] download: ${progress.percent.toFixed(1)}%`)
  })

  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    console.log('[updater] update downloaded:', info.version)
    dialog
      .showMessageBox({
        type: 'info',
        title: 'Update Ready',
        message: `A new version (${info.version}) has been downloaded. Restart the app to apply the update.`,
        buttons: ['Restart', 'Later'],
        defaultId: 0,
        cancelId: 1
      })
      .then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall()
        }
      })
      .catch((err) => {
        console.error('[updater] dialog error', err)
      })
  })

  autoUpdater.on('error', (err) => {
    console.error('[updater] error:', err)
  })

  // Initial check (delayed 3s to let app finish loading)
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      console.error('[updater] check failed:', err.message)
    })
  }, 3000)
}
