import type { Host } from '../types'

export type MarkdownRenderOptions = {
  flavor?: string
  features?: string[]
  sanitize?: boolean
  absolute_attachments?: boolean
  base_origin?: string
  doc_id?: string
  token?: string | null
  [key: string]: any
}

export type MarkdownRenderer = {
  render: (text: string, target?: Element | null, options?: MarkdownRenderOptions) => Promise<string>
}

export function createMarkdownRenderer(host: Host): MarkdownRenderer {
  const render = async (text: string, target?: Element | null, options: MarkdownRenderOptions = {}) => {
    const html = await host.api
      .renderMarkdown(String(text ?? ''), options)
      .then((r: any) => (r && r.html) || '')
      .catch(() => '')
    if (target) {
      try {
        (target as HTMLElement).innerHTML = html
      } catch {}
      try {
        await host.ui.hydrateAll?.(target)
      } catch {}
    }
    return html
  }

  return { render }
}

export type MarkdownEditor = ReturnType<typeof createMarkdownEditor>

export function createMarkdownEditor(textarea: HTMLTextAreaElement) {
  const ta = textarea

  const getValue = () => ta.value ?? ''
  const setValue = (value: string) => {
    ta.value = value
  }

  const focus = () => {
    try {
      ta.focus()
    } catch {}
  }

  const wrapSelection = (before: string, after = '') => {
    const start = ta.selectionStart ?? 0
    const end = ta.selectionEnd ?? 0
    const value = getValue()
    const selected = value.slice(start, end)
    const insert = before + selected + after
    ta.value = value.slice(0, start) + insert + value.slice(end)
    const pos = start + before.length + selected.length + after.length
    ta.selectionStart = ta.selectionEnd = pos
    focus()
  }

  const insertPrefix = (prefix: string) => {
    const start = ta.selectionStart ?? 0
    const value = getValue()
    const lineStart = value.lastIndexOf('\n', start - 1) + 1
    const lineEnd = value.indexOf('\n', start)
    const end = lineEnd === -1 ? value.length : lineEnd
    const line = value.slice(lineStart, end)
    ta.value = value.slice(0, lineStart) + prefix + line + value.slice(end)
    const pos = start + prefix.length
    ta.selectionStart = ta.selectionEnd = pos
    focus()
  }

  const insertSnippet = (snippet: string, appendNewline = true) => {
    const value = getValue()
    const needsNL = appendNewline && !value.endsWith('\n')
    ta.value = value + (needsNL ? '\n' : '') + snippet + (appendNewline ? '\n' : '')
    ta.selectionStart = ta.selectionEnd = ta.value.length
    focus()
  }

  return {
    textarea: ta,
    getValue,
    setValue,
    focus,
    wrapSelection,
    insertPrefix,
    insertSnippet,
  }
}
