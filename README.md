# @rello-platform/webhook-events

Canonical registry of the outbound **webhook event types** Rello emits — the
single source of truth for the `event` string stamped on every
`WebhookDelivery` and the values a tenant may subscribe to on a
`WebhookEndpoint`.

Mirrors the zero-drift `@rello-platform/billing-client` `WebhookEventType`
pattern: producer (`enqueueWebhookDeliveriesAndDispatch`) and consumers
(endpoint-allowlist filter, etc.) import the **same** `WebhookEvent` union, so a
stray event literal cannot compile.

## Exports

| Symbol | Description |
| --- | --- |
| `WEBHOOK_EVENTS` | `readonly` tuple of the 28 canonical events, in declaration order. |
| `WebhookEvent` | The string-literal union (`= WEBHOOK_EVENTS[number]`). |
| `EXACT_REGISTRY` | `Record<WebhookEvent, WebhookEventEntry>` — per-key lifecycle metadata. |
| `WebhookEventEntry` / `WebhookEventLifecycle` | Row shape + `"active" \| "reserved"`. |
| `CANONICAL_WEBHOOK_EVENT_SET` | `ReadonlySet<string>` for O(1) membership. |
| `isCanonicalWebhookEvent(raw)` | Runtime type guard. |

## Lifecycle

- **`active` (21)** — emitted by a live Rello code path.
- **`reserved` (7)** — the "phantom-7": subscribable but emitted by nothing
  today (`lead.scored`, `task.created`, `task.completed`, `messaging.delivered`,
  `messaging.bounced`, `thread.created`, `thread.archived`). Retained — a tenant
  may already subscribe — never deleted.

## Scope

Registry + lifecycle metadata + runtime guard **only**. The normalizer
(`normalizeWebhookEvent`) and the per-app subscription map are later
Platform-Identifier-Drift-Guards waves and intentionally live elsewhere.

## Consuming

Git-tag pinned, no build step on install (`dist/` is committed):

```jsonc
"@rello-platform/webhook-events": "github:rello-platform/webhook-events#v0.1.0"
```

ESM-only build, but exposed under `import`/`require`/`default` (Node ≥22.12
`require(esm)`), so Next/CJS-interop consumers cannot crash with
`ERR_PACKAGE_PATH_NOT_EXPORTED`.

## Development

```bash
npm install
npm run build   # tsc → dist/ (committed)
npm test        # build + node --test
```

**No `prepare`/`postinstall` hook** — a `prepare` would force a git+ssh
clone-build on every Railway consumer and break them platform-wide. `dist/` is
committed instead.
