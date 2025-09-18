import type { PluginHostContext } from '../core/host'

export type UploadResult = {
  url: string
  filename: string
  contentType?: string | null
}

export type MarkdownSnippetFactory = (result: UploadResult) => string

export type UploaderOptions = {
  context: PluginHostContext
  onStatus?: (status: 'idle' | 'uploading' | 'success' | 'error') => void
}

export function createUploader(options: UploaderOptions) {
  const { context, onStatus } = options

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
    if (typeof context.host.api.uploadFile !== 'function') {
      throw new Error('host.api.uploadFile not available')
    }
    const list = Array.isArray(files) ? files : Array.from(files)
    if (!list.length) return [] as UploadResult[]
    setStatus('uploading')
    const results: UploadResult[] = []
    for (const file of list) {
      try {
        const response = await context.host.api.uploadFile(docId, file)
        const filename = response?.filename ?? file.name
        const url = response?.url ?? `./attachments/${filename}`
        results.push({
          url,
          filename,
          contentType: response?.content_type ?? file.type ?? null,
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
