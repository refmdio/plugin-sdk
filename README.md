@refmd/plugin-sdk
==================

Minimal, framework-agnostic SDK for building RefMD plugins (ESM).

Status
------

- v0.1.x: API surface is small and focused on DOM primitives, a tiny UI kit, and host bridging helpers.
- No external deps, designed to be imported directly by plugins in the browser.

Install (npm)
-------------

```
npm i @refmd/plugin-sdk
```

Then in your plugin code:

```ts
import { createKit, resolveDocId } from '@refmd/plugin-sdk'

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

Use without npm (host-provided ESM)
-----------------------------------

Your RefMD host can serve the SDK at a fixed path:

```
/plugins/sdk/refmd-sdk/0.1.0/index.mjs
```

Import it directly from your plugin ESM:

```js
import { createKit } from '/plugins/sdk/refmd-sdk/0.1.0/index.mjs'
```

API (v0.1)
----------

- Core: `h`, `fragment`, `render`, `store`
- UI: `button`, `card`, `input`, `textarea`, `tokens`
- Utils: `markdownPreview(host, { text, options, target })`, `resolveDocId`, `escapeHtml`

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
- Attach the built `index.mjs` to the GitHub Release for hosts to mirror under `/plugins/sdk/refmd-sdk/<version>/index.mjs`.

