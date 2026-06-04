type ToastKind = 'success' | 'error' | 'info'

let container: HTMLDivElement | null = null

function ensureContainer(): HTMLDivElement {
  if (container && document.body.contains(container)) return container
  const el = document.createElement('div')
  el.id = 'toast-container'
  document.body.appendChild(el)
  container = el
  return el
}

function show(message: string, kind: ToastKind): void {
  const root = ensureContainer()
  const toast = document.createElement('div')
  toast.className = `toast toast-${kind}`
  toast.textContent = message
  root.appendChild(toast)
  setTimeout(() => {
    toast.classList.add('toast-out')
    setTimeout(() => toast.remove(), 300)
  }, 3000)
}

export const Notification = {
  success: (msg: string) => show(msg, 'success'),
  error: (msg: string) => show(msg, 'error'),
  info: (msg: string) => show(msg, 'info')
}
