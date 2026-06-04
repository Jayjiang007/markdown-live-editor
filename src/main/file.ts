import { dialog, BrowserWindow } from 'electron'
import { promises as fs } from 'node:fs'

export async function openFileDialog(): Promise<{ path: string; content: string } | null> {
  const win = BrowserWindow.getFocusedWindow()
  const result = await dialog.showOpenDialog(win!, {
    title: 'Open Markdown File',
    properties: ['openFile'],
    filters: [
      { name: 'Markdown', extensions: ['md', 'markdown', 'txt'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })
  if (result.canceled || result.filePaths.length === 0) return null
  const filePath = result.filePaths[0]
  const content = await fs.readFile(filePath, 'utf-8')
  return { path: filePath, content }
}

export async function saveFileDialog(path: string, content: string): Promise<{ path: string } | null> {
  const win = BrowserWindow.getFocusedWindow()
  let targetPath = path
  if (!targetPath) {
    const result = await dialog.showSaveDialog(win!, {
      title: 'Save Markdown File',
      defaultPath: 'untitled.md',
      filters: [{ name: 'Markdown', extensions: ['md'] }]
    })
    if (result.canceled || !result.filePath) return null
    targetPath = result.filePath
  }
  await fs.writeFile(targetPath, content, 'utf-8')
  return { path: targetPath }
}
