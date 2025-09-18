import type { ExecResult, Host, HostMode } from '../types'
import { resolveDocId } from '../utils/route'

export type HostContextOptions = {
  pluginId: string
  docId?: string | null
  token?: string | null
  mode?: HostMode
}

export type PluginHostContext = {
  pluginId: string
  host: Host
  docId: string | null
  token: string | null
  mode: HostMode
  exec: (action: string, payload?: any) => Promise<ExecResult>
  execAction: (action: string, payload?: any) => Promise<ExecResult>
}

export function normalizeExec(host: Host): (action: string, payload?: any) => Promise<ExecResult> {
  return async (action: string, payload?: any) => {
    const call = host.exec ?? host.api?.exec
    if (typeof call !== 'function') {
      return Promise.reject(new Error('host.exec not available'))
    }
    return call(action, payload ?? {})
  }
}

export function createHostContext(host: Host, opts: HostContextOptions): PluginHostContext {
  const mode: HostMode = opts.mode ?? host.context?.mode ?? 'primary'
  const docId = opts.docId ?? host.context?.docId ?? resolveDocId(host.context?.route)
  const token = opts.token ?? host.context?.token ?? null
  const exec = normalizeExec(host)
  return {
    pluginId: opts.pluginId,
    host,
    docId: docId ?? null,
    token: token ?? null,
    mode,
    exec,
    execAction: (action: string, payload?: any) => exec(action, payload),
  }
}
