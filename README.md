# Markdown Live Editor

一个基于 **Electron + React + TypeScript** 的桌面 Markdown 编辑器，主打两件事：

- 一边写，一边实时预览
- 直接把截图或图片粘贴进编辑器，自动上传到图床并插入链接

它适合写博客、知识库、项目文档、技术笔记，也适合需要频繁插图的 Markdown 工作流。

## 功能特性

### 编辑与预览

- 实时预览
- 支持 `编辑 / 分栏 / 预览` 三种视图
- 支持常用 Markdown 语法和工具栏快速插入
- 支持代码高亮
- 支持 Mermaid 图表
- 支持 KaTeX 数学公式
- 支持打开、保存、导出 Markdown 文档

### 图床上传

- 支持直接 `Ctrl+V` 粘贴截图或图片
- 支持拖拽图片到编辑器中
- 上传成功后自动在 Markdown 中插入图片链接
- 支持多种图床和对象存储
- 可在设置中切换图床、测试上传、保存配置

### 桌面端体验

- Windows / macOS / Linux 跨平台
- 本地保存编辑内容和偏好设置
- 支持浅色 / 深色主题
- 状态栏显示行列、字数、当前图床等信息

## 支持的图床

当前支持以下上传目标：

| 类型 | 说明 |
| --- | --- |
| Uguu.se | 免注册、免配置，开箱即用，适合快速测试 |
| SM.MS | 需要 API Token |
| GitHub | 上传到仓库中 |
| 七牛云对象存储 | 需要 AccessKey / SecretKey / Bucket / 域名 |
| 阿里云 OSS | 需要 AccessKey / Bucket / Endpoint 等 |
| 腾讯云 COS | 需要 SecretId / SecretKey / Bucket / APPID |
| AWS S3 / R2 / MinIO 等兼容服务 | 适合已有对象存储的用户 |
| Local Storage | 保存到本机目录，仅本机可用 |
| PicGo-Core | 复用你现有的 PicGo 配置和插件生态 |

## 快速开始

### 运行开发环境

```bash
pnpm install
pnpm dev
```

### 构建

```bash
pnpm build
pnpm build:win
pnpm build:mac
pnpm build:linux
```

## 使用说明

### 基本使用

1. 启动应用
2. 在左侧编辑 Markdown
3. 在右侧实时查看渲染结果
4. 通过顶部工具栏快速插入标题、链接、代码块、表格等内容
5. 通过“导出”输出为 PDF、DOCX 或 PNG

### 图床功能怎么用

这是这个项目最核心的功能之一。

典型流程如下：

1. 打开右上角“设置”
2. 选择一个图床
3. 按要求填写配置
4. 点击“测试上传”
5. 保存设置
6. 回到编辑器里直接粘贴截图或拖拽图片
7. 应用自动上传图片，并把 Markdown 图片链接插入到文档中

如果你打开了“自动上传”，图片粘贴后会直接开始上传。

### 最简单的上手方式：Uguu.se

如果你只是想先体验功能，推荐先用 **Uguu.se**。

优点：

- 不需要注册
- 不需要 Token
- 不需要任何额外配置

操作步骤：

1. 打开“设置”
2. 选择 `Uguu.se`
3. 直接保存
4. 回到编辑器按 `Ctrl+V` 粘贴截图

这时应用会自动上传，并在光标位置插入类似下面的 Markdown：

```md
![image](https://...)
```

### 各图床配置说明

#### 1. Uguu.se

适合：

- 快速体验
- 个人临时笔记
- 不想申请账号和密钥

需要填写：

- 无

#### 2. SM.MS

适合：

- 想用成熟公共图床

需要填写：

- `API Token`

说明：

- 现在 SM.MS 不再支持匿名上传
- 需要先注册账号，再到官方后台获取 Token

#### 3. GitHub

适合：

- 想把图片和文档一起放进仓库
- 团队内部统一管理素材

需要填写：

- `Personal Access Token`
- `Owner`
- `Repository`
- `Branch`
- `Upload Path`

建议：

- 单独建一个仓库存图片更清晰
- `Upload Path` 可以填 `images/`、`assets/markdown/` 之类的目录前缀

#### 4. 七牛云

需要填写：

- `AccessKey`
- `SecretKey`
- `Bucket`
- `Region`
- `Public Domain`
- 可选 `Path`

适合：

- 国内访问较多
- 已经有 CDN 域名

#### 5. 阿里云 OSS

需要填写：

- `AccessKey ID`
- `AccessKey Secret`
- `Bucket`
- `Region`
- 可选 `Endpoint`
- 可选 `Path`

建议：

- 提前确认 Bucket 的公开访问策略
- 若用于公开图片外链，通常需要正确配置公开读权限或 CDN

#### 6. 腾讯云 COS

需要填写：

- `SecretId`
- `SecretKey`
- `Bucket`
- `APPID`
- `Region`
- 可选 `Path`

适合：

- 已经使用腾讯云对象存储

#### 7. AWS S3 / Cloudflare R2 / MinIO / 其他 S3 兼容服务

需要填写：

- `Access Key ID`
- `Secret Access Key`
- `Bucket`
- `Region`
- 可选 `Endpoint`
- 可选 `Public URL`
- 可选 `Path`
- 可选 `Force Path-Style`

适合：

- 已有对象存储基础设施
- 想统一接入 S3 兼容服务

说明：

- 如果不是 AWS 官方 S3，而是 MinIO、R2 等兼容服务，通常需要填写 `Endpoint`
- 部分本地或私有部署服务需要打开 `Force Path-Style`

#### 8. Local Storage

作用：

- 把图片保存到本机应用数据目录下

需要填写：

- `path`

说明：

- 生成的是 `file://` 地址
- 只适合本机使用
- 不适合发布到网页或跨设备同步

#### 9. PicGo-Core

适合：

- 已经在用 PicGo
- 想复用 PicGo 的插件生态和已有配置

说明：

- 这个项目会直接读取系统里的 PicGo 配置
- 默认配置路径：
  - Windows: `%APPDATA%\picgo\config.json`
  - macOS: `~/Library/Application Support/picgo/config.json`
  - Linux: `~/.config/picgo/config.json`
- 也可以通过环境变量 `PICGO_CONFIG_PATH` 指定自定义配置文件

## 推荐使用方式

如果你不知道选哪个图床，可以按这个顺序：

1. 先用 `Uguu.se` 验证粘贴上传流程
2. 个人轻量使用可继续用 `SM.MS`
3. 长期正式使用更推荐 `七牛 / OSS / COS / S3`
4. 如果你已经有 PicGo 生态，直接选 `PicGo-Core`

## 图床使用示例

### 场景 1：写博客时贴截图

1. 截图到剪贴板
2. 回到编辑器按 `Ctrl+V`
3. 图片自动上传
4. 文档中自动插入图片 Markdown
5. 右侧预览立即显示图片

### 场景 2：拖拽本地图片

1. 把一张本地图片拖到编辑器
2. 应用上传图片
3. 自动插入链接

### 场景 3：切换图床

1. 打开设置
2. 选择新的图床
3. 填配置并测试
4. 保存后新的上传都会走新图床

## 配置保存位置

应用配置文件路径如下：

| 系统 | 路径 |
| --- | --- |
| Windows | `%APPDATA%\markdown-live-editor\config.json` |
| macOS | `~/Library/Application Support/markdown-live-editor/config.json` |
| Linux | `~/.config/markdown-live-editor/config.json` |

## 快捷键

| 操作 | 快捷键 |
| --- | --- |
| 打开文件 | `Ctrl+O` |
| 保存 | `Ctrl+S` |
| 查找 | `Ctrl+F` |
| 仅编辑 | `Ctrl+1` |
| 分栏视图 | `Ctrl+2` |
| 仅预览 | `Ctrl+3` |

## 项目结构

```text
src/
  main/                 Electron 主进程
  preload/              暴露给渲染层的 API
  renderer/src/         React 界面
  shared/               主进程与渲染层共享类型
resources/              图标等资源
```

## 技术栈

- Electron
- React
- TypeScript
- Vite / electron-vite
- CodeMirror 6
- markdown-it
- Mermaid
- KaTeX
- Zustand
- electron-store
- electron-builder

## 适合谁用

- 写技术博客的人
- 需要频繁插图的 Markdown 用户
- 做个人知识库的人
- 想要“截图即上传”的桌面写作工具的用户

## License

MIT
