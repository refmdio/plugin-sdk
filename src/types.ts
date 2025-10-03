export type HostMode = 'primary' | 'secondary'

export type ExecResult = {
  ok: boolean
  data?: any
  effects?: any[]
  error?: any
}

export type HostChromeAction = {
  id?: string
  label: string
  onClick?: (event: MouseEvent) => void
  disabled?: boolean
  variant?: 'default' | 'primary' | 'ghost'
}

export type HostChrome = {
  setTitle?: (title?: string | null) => void
  setStatus?: (status?: string | null) => void
  setDocBadge?: (value?: string | null) => void
  setActions?: (actions: HostChromeAction[]) => void
  reset?: () => void
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
  }
  context?: {
    docId?: string | null
    route?: string | null
    token?: string | null
    mode?: HostMode
  }
  chrome?: HostChrome
}

export type Listener<T> = (value: T) => void
