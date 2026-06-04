import { app, Menu, MenuItemConstructorOptions, BrowserWindow, shell } from 'electron'
import { is } from '@electron-toolkit/utils'

export function buildAppMenu(getWindow: () => BrowserWindow | null): void {
  const isMac = process.platform === 'darwin'

  const template: MenuItemConstructorOptions[] = [
    ...(isMac
      ? [{
          label: app.name,
          submenu: [
            { role: 'about' as const },
            { type: 'separator' as const },
            { role: 'services' as const },
            { type: 'separator' as const },
            { role: 'hide' as const },
            { role: 'hideOthers' as const },
            { role: 'unhide' as const },
            { type: 'separator' as const },
            { role: 'quit' as const }
          ]
        }]
      : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'Open…',
          accelerator: 'CmdOrCtrl+O',
          click: () => getWindow()?.webContents.send('menu:open-file')
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => getWindow()?.webContents.send('menu:save-file')
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
        { type: 'separator' },
        {
          label: 'Find',
          accelerator: 'CmdOrCtrl+F',
          click: () => getWindow()?.webContents.send('menu:find')
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Editor Only',
          accelerator: 'CmdOrCtrl+1',
          click: () => getWindow()?.webContents.send('menu:view-mode', 'editor')
        },
        {
          label: 'Split View',
          accelerator: 'CmdOrCtrl+2',
          click: () => getWindow()?.webContents.send('menu:view-mode', 'split')
        },
        {
          label: 'Preview Only',
          accelerator: 'CmdOrCtrl+3',
          click: () => getWindow()?.webContents.send('menu:view-mode', 'preview')
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      role: 'window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac
          ? [{ type: 'separator' as const }, { role: 'front' as const }]
          : [{ role: 'close' as const }])
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'GitHub Repository',
          click: () => shell.openExternal('https://github.com/your-org/markdown-live-editor')
        },
        {
          label: 'Report an Issue',
          click: () => shell.openExternal('https://github.com/your-org/markdown-live-editor/issues')
        }
      ]
    }
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

// Avoid 'is' being reported as unused
void is
