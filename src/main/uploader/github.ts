import type { UploadResult } from '@shared/index'

interface GithubResponse {
  content: {
    name: string
    path: string
    sha: string
    size: number
    url: string
    html_url: string
    download_url: string
    git_url: string
  }
  commit: {
    sha: string
  }
}

export async function uploadToGithub(
  buffer: Buffer,
  filename: string,
  config: Record<string, string>
): Promise<UploadResult> {
  const { token, owner, repo, branch = 'main', path = 'images/' } = config
  if (!token || !owner || !repo) {
    return { success: false, message: 'GitHub: missing token / owner / repo' }
  }

  const fullPath = `${path.replace(/\/?$/, '/')}${filename}`
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(fullPath)}?ref=${encodeURIComponent(branch)}`

  const resp = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      'User-Agent': 'markdown-live-editor'
    },
    body: JSON.stringify({
      message: `Upload ${filename} via Markdown Live Editor`,
      content: buffer.toString('base64'),
      branch
    })
  })

  if (resp.status === 422) {
    return { success: false, message: 'GitHub: file already exists at this path' }
  }
  if (!resp.ok) {
    const text = await resp.text()
    return { success: false, message: `GitHub HTTP ${resp.status}: ${text.slice(0, 200)}` }
  }

  const json = (await resp.json()) as GithubResponse
  return {
    success: true,
    url: json.content.html_url,
    filename: json.content.name
  }
}
