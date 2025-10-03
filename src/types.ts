export type HostMode = 'primary' | 'secondary'

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
    renderMarkdown: (text: string, options?: any) => Promise<{ html: string }>
    renderMarkdownMany?: (items: Array<{ text: string; options: any }>) => Promise<any>
    listRecords?: (pluginId: string, docId: string, kind: string, token?: string) => Promise<any>
    createRecord?: (pluginId: string, docId: string, kind: string, data: any, token?: string) => Promise<any>
    patchRecord?: (pluginId: string, id: string, patch: any) => Promise<any>
    deleteRecord?: (pluginId: string, id: string) => Promise<any>
    getKv?: (pluginId: string, docId: string, key: string, token?: string) => Promise<any>
    putKv?: (pluginId: string, docId: string, key: string, value: any, token?: string) => Promise<any>
    uploadFile?: (docId: string, file: File) => Promise<any>
    exec?: (action: string, payload?: any) => Promise<ExecResult>
  }
  ui: {
    hydrateAll?: (root: Element) => Promise<void> | void
    setDocumentTitle?: (title?: string | null) => void
    setDocumentStatus?: (status?: string | null) => void
    setDocumentBadge?: (value?: string | null) => void
    setDocumentActions?: (actions: HostDocumentAction[]) => void
  }
  context?: {
    docId?: string | null
    route?: string | null
    token?: string | null
    mode?: HostMode
  }
}

export type Listener<T> = (value: T) => void
