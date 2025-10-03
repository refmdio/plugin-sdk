// RefMD Plugin SDK (v0.1.0)
// Minimal, framework-agnostic helpers for building RefMD plugins.

// ——— Types ———
import type { Host } from './types'
export type { Host, ExecResult, HostMode, Listener, HostChrome, HostChromeAction } from './types'

// ——— DOM primitives ———
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props?: Record<string, any> | null,
  ...children: Array<Node | string | Array<Node | string>>
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag)
  const p = props || {}
  for (const [k, v] of Object.entries(p)) {
    if (v == null) continue
    if (k === 'class' || k === 'className') (el as any).className = String(v)
    else if (k === 'style' && typeof v === 'object') Object.assign((el as any).style, v)
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v)
    else if (k === 'dataset' && v && typeof v === 'object') {
      for (const [dk, dv] of Object.entries(v as any)) { (el as any).dataset[dk] = String(dv) }
    } else if (k in el) {
      try { (el as any)[k] = v } catch { el.setAttribute(k, String(v)) }
    } else {
      el.setAttribute(k, String(v))
    }
  }
  const append = (c: any) => {
    if (c == null) return
    if (Array.isArray(c)) { c.forEach(append); return }
    if (c instanceof Node) { el.appendChild(c); return }
    el.appendChild(document.createTextNode(String(c)))
  }
  children.forEach(append)
  return el
}

export function fragment(...children: Array<Node | string | Array<Node | string>>): DocumentFragment {
  const frag = document.createDocumentFragment()
  const append = (c: any) => {
    if (c == null) return
    if (Array.isArray(c)) { c.forEach(append); return }
    frag.appendChild(c instanceof Node ? c : document.createTextNode(String(c)))
  }
  children.forEach(append)
  return frag
}

export function render(container: Element, node: Node | null) {
  try { while (container.firstChild) container.removeChild(container.firstChild) } catch {}
  if (node) container.appendChild(node)
  return () => { try { while (container.firstChild) container.removeChild(container.firstChild) } catch {} }
}

export function store<TState>({ container, initialState, render: view }: {
  container: Element
  initialState: TState
  render: (state: TState, setState: (patch: Partial<TState> | ((s: TState) => Partial<TState>)) => void) => Node
}) {
  let state = { ...(initialState as any) } as TState
  let dispose: null | (() => void) = null
  const setState = (patch: Partial<TState> | ((s: TState) => Partial<TState>)) => {
    const next = typeof patch === 'function' ? (patch as any)(state) : patch
    state = { ...(state as any), ...(next as any) }
    update()
  }
  const update = () => {
    const node = view(state, setState)
    if (dispose) try { dispose() } catch {}
    dispose = render(container, node)
  }
  update()
  return { getState: () => state, setState, update, dispose: () => { if (dispose) try { dispose() } catch {} } }
}

// ——— UI components ———
export function button({ label, onClick, className = '', variant = 'default', type = 'button', ...rest }: {
  label?: string | Node
  onClick?: (ev: Event) => void
  className?: string
  variant?: 'default' | 'primary'
  type?: 'button' | 'submit' | 'reset'
  [key: string]: any
} = {}) {
  const cls = [
    'px-3 py-1.5 rounded border text-sm inline-flex items-center gap-1',
    variant === 'primary' ? 'bg-primary text-primary-foreground border-primary hover:opacity-90' : 'bg-background border-input hover:bg-accent/50',
    className,
  ].filter(Boolean).join(' ')
  return h('button', { className: cls, type, onClick, ...rest }, label ?? 'Button')
}

export function card({ title, body, footer, className = '' }: {
  title?: string | Node
  body?: Node | string
  footer?: Node | string
  className?: string
} = {}) {
  const cls = ['border rounded bg-card', className].filter(Boolean).join(' ')
  const header = title ? h('div', { className: 'px-3 py-2 border-b bg-card/60' }, h('h3', { className: 'text-sm font-medium' }, title)) : null
  const content = h('div', { className: 'p-3 space-y-2 text-sm' }, body as any)
  const foot = footer ? h('div', { className: 'px-3 py-2 border-t bg-card/60 text-xs text-muted-foreground' }, footer as any) : null
  return h('div', { className: cls }, header as any, content, foot as any)
}

export function input({ value = '', placeholder = '', onInput, className = '', ...rest }: {
  value?: string
  placeholder?: string
  onInput?: (value: string, ev: Event) => void
  className?: string
  [key: string]: any
} = {}) {
  const cls = ['px-2 py-1 border rounded bg-background', className].filter(Boolean).join(' ')
  return h('input', { className: cls, value, placeholder, onInput: (e: any) => onInput?.(e.target.value, e), ...rest })
}

export function textarea({ value = '', placeholder = '', onInput, className = '', rows = 4, ...rest }: {
  value?: string
  placeholder?: string
  onInput?: (value: string, ev: Event) => void
  className?: string
  rows?: number
  [key: string]: any
} = {}) {
  const cls = ['w-full p-2 border rounded bg-background', className].filter(Boolean).join(' ')
  return h('textarea', { className: cls, rows, placeholder, onInput: (e: any) => onInput?.(e.target.value, e), ...rest }, value)
}

export const tokens = {
  spacing: { xs: '0.25rem', sm: '0.5rem', md: '0.75rem', lg: '1rem' },
  radius: { sm: '0.25rem', md: '0.375rem', lg: '0.5rem' },
}

export type ShellAction = {
  id?: string
  label: string
  onClick?: (event: MouseEvent) => void
  disabled?: boolean
  variant?: 'default' | 'primary' | 'ghost'
}

export type ShellApi = {
  setTitle: (title?: string | null) => void
  setStatus: (status?: string | null) => void
  setDocBadge: (value?: string | null) => void
  setActions: (actions: ShellAction[]) => void
  primaryAction: (action: ShellAction) => void
  reset: () => void
}

// ——— Markdown helper ———
export async function renderMarkdown(host: Host, { text, options, target }: { text: string; options?: any; target?: Element }) {
  const html = await host.api.renderMarkdown(String(text || ''), options || {})
    .then((r: any) => (r && r.html) || '')
    .catch(() => '')
  if (target) {
    try { (target as HTMLElement).innerHTML = html } catch {}
    try { await host.ui.hydrateAll?.(target) } catch {}
  }
  return html
}

// ——— Host-aware kit ———
export function createKit(host: Host) {
  const chrome = host?.chrome

  const normalizeActions = (actions: ShellAction[]) => {
    if (!Array.isArray(actions)) return []
    return actions
      .filter((action) => action && typeof action.label === 'string')
      .map((action) => ({
        id: action.id,
        label: action.label,
        disabled: Boolean(action.disabled),
        variant: action.variant ?? 'default',
        onClick: action.onClick,
      }))
  }

  const shell: ShellApi = {
    setTitle: (title?: string | null) => {
      try { chrome?.setTitle?.(title ?? '') } catch {}
    },
    setStatus: (status?: string | null) => {
      try { chrome?.setStatus?.(status ?? '') } catch {}
    },
    setDocBadge: (value?: string | null) => {
      try { chrome?.setDocBadge?.(value ?? '') } catch {}
    },
    setActions: (actions: ShellAction[]) => {
      try { chrome?.setActions?.(normalizeActions(actions)) } catch {}
    },
    primaryAction: (action: ShellAction) => {
      if (!action) {
        shell.setActions([])
        return
      }
      const normalized: ShellAction = {
        ...action,
        variant: action.variant ?? 'primary',
      }
      shell.setActions([normalized])
    },
    reset: () => {
      try { chrome?.reset?.() } catch {}
    },
  }

  return {
    h, fragment, render, store,
    button, card, input, textarea,
    tokens,
    shell,
    toast: (level: string, message: string) => {
      try { host?.toast?.(level, message) } catch { /* no-op */ }
    },
    markdownPreview: async (source: string, target: Element, options: any = {}) => renderMarkdown(host, { text: source, options, target }),
  }
}

// ——— Utilities ———
export { resolveDocId } from './utils/route'
export { escapeHtml } from './utils/html'
export { createHostContext, normalizeExec } from './core/host'
export type { PluginHostContext } from './core/host'
export { createRecordStore } from './services/records'
export { createMarkdownRenderer, createMarkdownEditor } from './services/markdown'
export { createUploader } from './services/uploads'
