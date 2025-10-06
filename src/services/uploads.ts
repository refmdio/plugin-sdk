import type { PluginHostContext } from '../core/host'

export type UploadResult = {
  url: string
  filename: string
  contentType?: string | null
  absoluteUrl?: string | null
}

export type MarkdownSnippetFactory = (result: UploadResult) => string

export type UploaderOptions = {
  context: PluginHostContext
  onStatus?: (status: 'idle' | 'uploading' | 'success' | 'error') => void
}

export function createUploader(options: UploaderOptions) {
  const { context, onStatus } = options

  const toRelativeAttachmentUrl = (rawUrl: unknown, filename: string) => {
    const fallback = `./attachments/${filename}`
    if (typeof rawUrl !== 'string' || rawUrl.length === 0) return fallback
    if (
      rawUrl.startsWith('./') ||
      rawUrl.startsWith('../') ||
      rawUrl.startsWith('attachments/') ||
      rawUrl.startsWith('/attachments/')
    ) {
      return rawUrl.startsWith('/') ? `.${rawUrl}` : rawUrl
    }

    const hostOrigin = context.host.origin || undefined
    const resolvePathname = (href: string) => {
      if (href.startsWith('/')) return href
      try {
        return new URL(href).pathname
      } catch {}
      const base = hostOrigin || (typeof window !== 'undefined' ? window.location.origin : undefined)
      if (!base) return href
      try {
        return new URL(href, base).pathname
      } catch {
        return href
      }
    }

    const pathname = resolvePathname(rawUrl)
    if (pathname.startsWith('./') || pathname.startsWith('../')) return pathname
    if (pathname.startsWith('attachments/')) return `./${pathname}`

    const attachmentsIndex = pathname.indexOf('/attachments/')
    if (attachmentsIndex !== -1) {
      const suffix = pathname.slice(attachmentsIndex)
      return suffix.startsWith('/attachments/') ? `.${suffix}` : `./${suffix}`
    }

    return fallback
  }

  const setStatus = (status: 'idle' | 'uploading' | 'success' | 'error') => {
    try {
      onStatus?.(status)
    } catch (err) {
      console.warn('[plugin-sdk] uploader status error', err)
    }
  }

  const ensureDoc = () => {
    const docId = context.docId
    if (!docId) throw new Error('Document ID is not available for uploads')
    return docId
  }

  const uploadFiles = async (files: FileList | File[], toMarkdown: MarkdownSnippetFactory) => {
    const docId = ensureDoc()
    const list = Array.isArray(files) ? files : Array.from(files)
    if (!list.length) return [] as UploadResult[]
    setStatus('uploading')
    const results: UploadResult[] = []
    for (const file of list) {
      try {
        const response = await context.execAction('host.files.upload', {
          docId,
          file,
        })
        if (response?.ok === false) {
          const message =
            (response.error && (response.error as any).message) || (response.error as any)?.code || 'upload failed'
          throw new Error(message)
        }
        const payload = response?.data as any
        const filename = payload?.filename ?? file.name
        const absoluteUrl = typeof payload?.url === 'string' ? payload.url : null
        const url = toRelativeAttachmentUrl(absoluteUrl, filename)
        results.push({
          url,
          filename,
          contentType: payload?.content_type ?? file.type ?? null,
          absoluteUrl,
        })
      } catch (err) {
        console.error('[plugin-sdk] upload failed', err)
        setStatus('error')
        throw err
      }
    }
    setStatus('success')
    return results
  }

  const pickAndUpload = (accept: string, multiple: boolean, toMarkdown: MarkdownSnippetFactory) => {
    return new Promise<string[]>((resolve, reject) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = accept
      if (multiple) input.multiple = true
      input.onchange = async () => {
        if (!input.files || input.files.length === 0) {
          resolve([])
          return
        }
        try {
          const results = await uploadFiles(input.files, toMarkdown)
          const snippets = results.map(toMarkdown)
          resolve(snippets)
        } catch (err) {
          reject(err)
        }
      }
      try {
        input.click()
      } catch (err) {
        reject(err)
      }
    })
  }

  return {
    uploadFiles,
    pickAndUpload,
  }
}
