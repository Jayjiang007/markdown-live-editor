import type { UploaderId } from './uploader'

export type FieldType = 'text' | 'password' | 'select' | 'boolean'

export interface FieldDef {
  key: string
  label: string
  type: FieldType
  required?: boolean
  defaultValue?: string
  placeholder?: string
  options?: Array<{ label: string; value: string }>
  hint?: string
}

export interface UploaderSchema {
  id: UploaderId
  name: string
  description: string
  fields: FieldDef[]
}

export const UPLOADERS: UploaderSchema[] = [
  {
    id: 'uguu',
    name: 'Uguu.se (Free, Anonymous)',
    description: 'Free anonymous image hosting — no account or API key required. Files are kept for an unlimited time. Best for quick testing and personal notes.',
    fields: []
  },
  {
    id: 'smms',
    name: 'SM.MS',
    description: 'Free image hosting. SM.MS has discontinued anonymous uploads — an API token is required. Get one at sm.ms/home/apitoc after registering.',
    fields: [
      {
        key: 'token',
        label: 'API Token',
        type: 'password',
        required: true,
        placeholder: 'Paste your sm.ms API token',
        hint: 'Get a token at https://sm.ms/home/apidoc'
      }
    ]
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Use a public/private repository as image hosting. Returns raw.githubusercontent.com URLs.',
    fields: [
      { key: 'token', label: 'Personal Access Token', type: 'password', required: true, placeholder: 'ghp_xxx or github_pat_xxx' },
      { key: 'owner', label: 'Owner (username or org)', type: 'text', required: true, placeholder: 'your-name' },
      { key: 'repo', label: 'Repository', type: 'text', required: true, placeholder: 'image-host' },
      { key: 'branch', label: 'Branch', type: 'text', defaultValue: 'main', placeholder: 'main' },
      { key: 'path', label: 'Upload Path (prefix)', type: 'text', defaultValue: 'images/', placeholder: 'images/' }
    ]
  },
  {
    id: 'qiniu',
    name: 'Qiniu Cloud (七牛云)',
    description: 'Qiniu Object Storage. China-based CDN with global edge nodes.',
    fields: [
      { key: 'accessKey', label: 'AccessKey', type: 'text', required: true },
      { key: 'secretKey', label: 'SecretKey', type: 'password', required: true },
      { key: 'bucket', label: 'Bucket Name', type: 'text', required: true },
      {
        key: 'region',
        label: 'Region',
        type: 'select',
        required: true,
        defaultValue: 'z0',
        options: [
          { label: 'East China (z0)', value: 'z0' },
          { label: 'North China (z1)', value: 'z1' },
          { label: 'South China (z2)', value: 'z2' },
          { label: 'North America (na0)', value: 'na0' },
          { label: 'Southeast Asia (as0)', value: 'as0' }
        ]
      },
      { key: 'domain', label: 'Public Domain (CDN)', type: 'text', required: true, placeholder: 'https://cdn.your-domain.com' },
      { key: 'path', label: 'Key Prefix (optional)', type: 'text', placeholder: 'blog/' }
    ]
  },
  {
    id: 'aliyun',
    name: 'Aliyun OSS (阿里云)',
    description: 'Alibaba Cloud Object Storage Service. Set bucket ACL to public-read.',
    fields: [
      { key: 'accessKeyId', label: 'AccessKey ID', type: 'text', required: true },
      { key: 'accessKeySecret', label: 'AccessKey Secret', type: 'password', required: true },
      { key: 'bucket', label: 'Bucket Name', type: 'text', required: true },
      { key: 'region', label: 'Region (e.g. oss-cn-hangzhou)', type: 'text', required: true, placeholder: 'oss-cn-hangzhou' },
      { key: 'endpoint', label: 'Custom Endpoint (optional)', type: 'text', placeholder: 'https://<bucket>.oss-cn-hangzhou.aliyuncs.com' },
      { key: 'path', label: 'Key Prefix (optional)', type: 'text', placeholder: 'blog/' }
    ]
  },
  {
    id: 'tencent',
    name: 'Tencent COS (腾讯云)',
    description: 'Tencent Cloud Object Storage. Set bucket ACL to public-read.',
    fields: [
      { key: 'secretId', label: 'SecretId', type: 'text', required: true },
      { key: 'secretKey', label: 'SecretKey', type: 'password', required: true },
      { key: 'bucket', label: 'Bucket Name', type: 'text', required: true },
      { key: 'appId', label: 'APPID', type: 'text', required: true, placeholder: 'Numeric ID from Tencent Cloud console' },
      {
        key: 'region',
        label: 'Region',
        type: 'select',
        required: true,
        defaultValue: 'ap-guangzhou',
        options: [
          { label: 'Guangzhou (ap-guangzhou)', value: 'ap-guangzhou' },
          { label: 'Shanghai (ap-shanghai)', value: 'ap-shanghai' },
          { label: 'Beijing (ap-beijing)', value: 'ap-beijing' },
          { label: 'Hong Kong (ap-hongkong)', value: 'ap-hongkong' },
          { label: 'Singapore (ap-singapore)', value: 'ap-singapore' }
        ]
      },
      { key: 'path', label: 'Key Prefix (optional)', type: 'text', placeholder: 'blog/' }
    ]
  },
  {
    id: 's3',
    name: 'AWS S3 / S3-compatible',
    description: 'AWS S3 or any S3-compatible service (MinIO, Cloudflare R2, Wasabi, Backblaze B2).',
    fields: [
      { key: 'accessKeyId', label: 'Access Key ID', type: 'text', required: true },
      { key: 'secretAccessKey', label: 'Secret Access Key', type: 'password', required: true },
      { key: 'bucket', label: 'Bucket Name', type: 'text', required: true },
      { key: 'region', label: 'Region', type: 'text', required: true, placeholder: 'us-east-1' },
      { key: 'endpoint', label: 'Endpoint (leave blank for AWS default)', type: 'text', placeholder: 'https://s3.amazonaws.com or R2 endpoint' },
      { key: 'publicUrl', label: 'Public URL base (optional)', type: 'text', placeholder: 'https://your-cdn.example.com' },
      { key: 'path', label: 'Key Prefix (optional)', type: 'text', placeholder: 'blog/' },
      { key: 'forcePathStyle', label: 'Force Path-Style (MinIO/LocalStack)', type: 'boolean', defaultValue: 'false' }
    ]
  },
  {
    id: 'local',
    name: 'Local Storage',
    description: 'Saves to <userData>/<path>/ and returns a file:// URL. Works only inside this app.',
    fields: [
      { key: 'path', label: 'Subfolder under userData', type: 'text', defaultValue: 'assets', placeholder: 'assets' }
    ]
  },
  {
    id: 'picgo',
    name: 'PicGo-Core (Plugins)',
    description: 'Use any PicGo-Core compatible plugin (60+ image hosts). Coming in Phase 6.',
    fields: []
  }
]

export function findUploaderSchema(id: UploaderId): UploaderSchema | undefined {
  return UPLOADERS.find((u) => u.id === id)
}
