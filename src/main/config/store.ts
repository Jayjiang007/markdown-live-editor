import Store from 'electron-store'
import type { AppConfig } from '@shared/index'

const defaults: AppConfig = {
  uploaderId: 'uguu',
  uploaders: {
    uguu: {},
    smms: { token: '' },
    github: { token: '', owner: '', repo: '', branch: 'main', path: 'images/' },
    qiniu: { accessKey: '', secretKey: '', bucket: '', region: 'z0', domain: '', path: '' },
    aliyun: { accessKeyId: '', accessKeySecret: '', bucket: '', region: '', endpoint: '', path: '' },
    tencent: { secretId: '', secretKey: '', bucket: '', region: '', appId: '', path: '' },
    s3: {
      accessKeyId: '',
      secretAccessKey: '',
      bucket: '',
      region: 'us-east-1',
      endpoint: '',
      publicUrl: '',
      path: '',
      forcePathStyle: 'false'
    },
    local: { path: 'assets' },
    picgo: {}
  },
  viewMode: 'split',
  theme: 'light',
  autoUpload: true,
  locale: 'en'
}

const store = new Store<AppConfig>({
  name: 'config',
  defaults,
  migrations: {
    '0.2.0': (s) => {
      const current = s.get('uploaderId') as string | undefined
      const savedUploaders = (s.get('uploaders') || {}) as Record<string, Record<string, string>>
      if (current === 'smms' && !(savedUploaders.smms?.token || '').trim()) {
        s.set('uploaderId', 'uguu')
      }
    },
    // Re-apply the migration in case earlier user actions (e.g. clicking
    // "Test Upload" in v0.2.0 with a stale draftId) had overwritten
    // uploaderId back to 'smms'.
    '0.2.1': (s) => {
      const current = s.get('uploaderId') as string | undefined
      const savedUploaders = (s.get('uploaders') || {}) as Record<string, Record<string, string>>
      const smmsToken = (savedUploaders.smms?.token || '').trim()
      if (current === 'smms' && !smmsToken) {
        s.set('uploaderId', 'uguu')
      }
    }
  }
})

export function getConfig(): AppConfig {
  return {
    uploaderId: store.get('uploaderId'),
    uploaders: { ...defaults.uploaders, ...(store.get('uploaders') || {}) },
    viewMode: store.get('viewMode'),
    theme: store.get('theme'),
    autoUpload: (store.get('autoUpload') as boolean) ?? true,
    locale: (store.get('locale') as 'en' | 'zh') ?? 'en'
  }
}

export function setConfig(patch: Partial<AppConfig>): void {
  for (const [key, value] of Object.entries(patch)) {
    store.set(key as keyof AppConfig, value as any)
  }
}

export function getUploaderConfig(id: string): Record<string, string> {
  const all = store.get('uploaders') || {}
  return (all as Record<string, Record<string, string>>)[id] || {}
}
