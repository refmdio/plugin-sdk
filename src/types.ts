export type HostMode = 'primary' | 'secondary'

export type SplitEditorPreviewUpdate = {
  content: string
  viewMode: 'editor' | 'split' | 'preview'
}

export type SplitEditorPreviewDelegate = (ctx: {
  container: Element
  docId: string
  token?: string | null
  host: Host
}) => {
  update?: (payload: SplitEditorPreviewUpdate) => void
  dispose?: () => void
} | void

export type SplitEditorDocumentApi = {
  docId: string
  token?: string | null
  getContent: () => string
  setContent: (value: string) => void
}

export type SplitEditorMountOptions = {
  docId?: string | null
  token?: string | null
  preview?: {
    delegate?: SplitEditorPreviewDelegate
  }
  document?: {
    onReady?: (api: SplitEditorDocumentApi) => void | (() => void)
  }
}

export type ExecResult = {
  ok: boolean
  data?: any
  effects?: any[]
  error?: any
}

export type HostDocumentAction = {
  id?: string
  label: string
  onSelect?: () => void
  disabled?: boolean
  variant?: 'default' | 'primary' | 'outline'
}

export type Host = {
  exec: (action: string, payload?: any) => Promise<ExecResult>
  origin: string
  toast?: (level: string, message: string) => void
  api: {
    me?: () => Promise<any>
    renderMarkdown: (text: string, options?: any) => Promise<{ html: string }>
    renderMarkdownMany?: (items: Array<{ text: string; options: any }>) => Promise<any>
    exec?: (action: string, payload?: any) => Promise<ExecResult>
  }
  ui: {
    hydrateAll?: (root: Element) => Promise<void> | void
    setDocumentTitle?: (title?: string | null) => void
    setDocumentStatus?: (status?: string | null) => void
    setDocumentBadge?: (value?: string | null) => void
    setDocumentActions?: (actions: HostDocumentAction[]) => void
    mountSplitEditor?: (container: Element, options?: SplitEditorMountOptions) => void | (() => void)
  }
  context?: {
    docId?: string | null
    route?: string | null
    token?: string | null
    mode?: HostMode
  }
}

export type Listener<T> = (value: T) => void
