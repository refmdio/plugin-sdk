@refmdio/plugin-sdk
==================

Minimal, framework-agnostic SDK for building RefMD plugins.

Status
------

- v0.1.x: API surface is small and focused on DOM primitives, a tiny UI kit, and host bridging helpers.
- No external deps, designed to be imported directly by plugins in the browser.

Install (npm)
-------------

```
npm i @refmdio/plugin-sdk
```

Then in your plugin code:

```ts
import { createKit, resolveDocId } from '@refmdio/plugin-sdk'

export default async function mount(container: Element, host: any) {
  const kit = createKit(host)
  const state = { docId: host?.context?.docId || resolveDocId(), text: '' }

  kit.store({
    container,
    initialState: state,
    render: (s, set) => kit.card({
      title: 'SDK Demo',
      body: kit.fragment(
        kit.input({ value: s.text, onInput: (v) => set({ text: v }) }),
        kit.button({ label: 'Preview', onClick: async () => {
          const out = document.createElement('div')
          container.appendChild(out)
          await kit.markdownPreview(s.text, out, { sanitize: true, absolute_attachments: true, doc_id: s.docId, base_origin: host.origin })
        }})
      )
    })
  })
}
```


API (v0.1)
----------

- Core: `h`, `fragment`, `render`, `store`
- UI: `button`, `card`, `input`, `textarea`, `tokens`
- Utils: `markdownPreview(host, { text, options, target })`, `resolveDocId`, `escapeHtml`
- Host bridges: `createHostContext`, `normalizeExec`, `createRecordStore`, `createMarkdownRenderer`, `createMarkdownEditor`, `createUploader`
- Split editor bridge (v0.1.9+): `host.ui.mountSplitEditor(container, { docId, token, preview: { delegate }, document: { onReady } })`

WC are not intended to be used directly by plugin authors; `markdownPreview` calls the host hydration routines under the hood.

Build
-----

```
npm run build
```

Outputs ESM + CJS + d.ts to `dist/`.

Release workflow (suggested)
----------------------------

- Tag `v0.1.x` → GitHub Actions builds and publishes to npm.
