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
| `WEBHOOK_EVENT_FOLDS` | `Record<string, WebhookEvent>` — the 8 legacy→canonical folds (every target ∈ the 28). |
| `normalizeWebhookEvent(raw)` | `WebhookEvent \| null` — trim → canonical-passthrough → fold → `null`. |

## Normalizer

`normalizeWebhookEvent(raw)` folds a legacy event string to its canonical form
so a tenant subscribing with a retired name stores canonical instead of being
rejected. Resolution is pure & deterministic: **trim** → if already canonical
return it → else look up `WEBHOOK_EVENT_FOLDS` → else `null` (truly-invalid).
Apply at any boundary that reads a tenant/wire-supplied event string (today: the
subscription-create endpoint, **before** the membership check).

The 8 folds (each target ∈ the canonical 28) double as the documented
retirement list:

| Legacy | Canonical |
| --- | --- |
| `lead.stage_changed` | `pipeline.stage_changed` |
| `contact.created` | `lead.created` |
| `contact.updated` | `lead.updated` |
| `contact.tag_added` | `lead.tag_added` |
| `contact.tag_removed` | `lead.tag_removed` |
| `contact.stage_changed` | `pipeline.stage_changed` |
| `journey.enrollment_created` | `journey.enrolled` |
| `journey.enrollment_completed` | `journey.completed` |

**Intentionally NOT folded** (not pure 1→1 canonical folds — return `null`,
deferred to later / D-K2 / D-K3 waves): `lead.tags_changed` (1→2 split, OQ-2),
`app.activated` (slug-dependent), `journey.step_executed` /
`journey.enrollment_changed` (no clean target), and
`harvesthome.lead_scored`→`harvest-home.lead_scored` (cross-spoke namespaced
event, **not** in the canonical 28, D-K2-gated).

## Lifecycle

- **`active` (21)** — emitted by a live Rello code path.
- **`reserved` (7)** — the "phantom-7": subscribable but emitted by nothing
  today (`lead.scored`, `task.created`, `task.completed`, `messaging.delivered`,
  `messaging.bounced`, `thread.created`, `thread.archived`). Retained — a tenant
  may already subscribe — never deleted.

## Scope

Registry + lifecycle metadata + runtime guard + the legacy→canonical
normalizer (`normalizeWebhookEvent`, step B). The per-app subscription map and
cross-spoke publisher namespaces remain a later (D-K2-gated)
Platform-Identifier-Drift-Guards wave and intentionally live elsewhere.

## Consuming

Git-tag pinned, no build step on install (`dist/` is committed):

```jsonc
"@rello-platform/webhook-events": "github:rello-platform/webhook-events#v0.2.0"
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
