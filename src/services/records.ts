import type { PluginHostContext } from '../core/host'
import type { Listener } from '../types'

export type RecordStoreOptions<TData> = {
  context: PluginHostContext
  kind: string
  docId?: () => string | null
  token?: () => string | null
  actionNames?: {
    create?: string
    update?: string
    delete?: string
  }
  actionPayloads?: {
    create?: (input: { docId: string; kind: string; data: TData }) => any
    update?: (input: { recordId: string; patch: Partial<TData> }) => any
    delete?: (input: { recordId: string }) => any
  }
}

export type RecordStore<TData, TRecord = RecordItem<TData>> = {
  getItems(): TRecord[]
  list(): Promise<TRecord[]>
  create(data: TData): Promise<void>
  update(recordId: string, patch: Partial<TData>): Promise<void>
  remove(recordId: string): Promise<void>
  subscribe(listener: Listener<TRecord[]>): () => void
}

export type RecordItem<TData> = {
  id: string
  data: TData
  [key: string]: any
}

export function createRecordStore<TData = any>(options: RecordStoreOptions<TData>): RecordStore<TData> {
  const { context, kind } = options
  const getDocId = options.docId ?? (() => context.docId)
  const getToken = options.token ?? (() => context.token)
  const createAction = options.actionNames?.create ?? `${context.pluginId}.create_record`
  const updateAction = options.actionNames?.update ?? `${context.pluginId}.update_record`
  const deleteAction = options.actionNames?.delete ?? `${context.pluginId}.delete_record`
  const createPayload = options.actionPayloads?.create ?? ((input: { docId: string; kind: string; data: TData }) => input)
  const updatePayload = options.actionPayloads?.update ?? ((input: { recordId: string; patch: Partial<TData> }) => input)
  const deletePayload = options.actionPayloads?.delete ?? ((input: { recordId: string }) => input)

  let items: RecordItem<TData>[] = []
  const listeners = new Set<Listener<RecordItem<TData>[]>>()

  const notify = () => {
    const snapshot = items.slice()
    listeners.forEach((listener) => {
      try {
        listener(snapshot)
      } catch (err) {
        console.warn('[plugin-sdk] record store listener error', err)
      }
    })
  }

  const ensureDoc = () => {
    const docId = getDocId()
    if (!docId) throw new Error('Document ID is not available')
    return docId
  }

  const list = async () => {
    const docId = ensureDoc()
    const token = getToken() ?? undefined
    const response = await context.execAction('host.records.list', {
      docId,
      kind,
      token,
    })
    if (response?.ok === false) {
      const message =
        (response.error && (response.error as any).message) || (response.error as any)?.code || 'records.list failed'
      throw new Error(message)
    }
    const payload = response?.data as any
    const itemsOut = Array.isArray(payload?.items) ? payload.items : []
    items = itemsOut as RecordItem<TData>[]
    notify()
    return items
  }

  const create = async (data: TData) => {
    const docId = ensureDoc()
    const payload = createPayload({ docId, kind, data })
    await context.execAction(createAction, payload)
    await list()
  }

  const update = async (recordId: string, patch: Partial<TData>) => {
    const payload = updatePayload({ recordId, patch })
    await context.execAction(updateAction, payload)
    await list()
  }

  const remove = async (recordId: string) => {
    const payload = deletePayload({ recordId })
    await context.execAction(deleteAction, payload)
    await list()
  }

  const subscribe = (listener: Listener<RecordItem<TData>[]>) => {
    listeners.add(listener)
    listener(items.slice())
    return () => {
      listeners.delete(listener)
    }
  }

  return {
    getItems: () => items.slice(),
    list,
    create,
    update,
    remove,
    subscribe,
  }
}
