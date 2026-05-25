/**
 * Canonical Rello-emitted outbound webhook event-type registry.
 *
 * This is the single source of truth for the set of `event` strings Rello
 * stamps on outbound webhook deliveries (`WebhookDelivery.event`) and that
 * tenants may subscribe to on a `WebhookEndpoint`. It mirrors the zero-drift
 * `@rello-platform/billing-client` `WebhookEventType` pattern: producer and
 * consumers import the SAME union, so a stray event literal cannot compile.
 *
 * Provenance: byte-identical to Rello `src/lib/webhooks/webhook-events.ts`
 * `WEBHOOK_EVENTS` (origin/main `d4a870fe`) — the 28-entry `as const` array.
 * This package becomes that file's upstream; Rello's local const collapses to
 * a thin re-export of this module.
 *
 * Lifecycle partition (Platform-Identifier-Drift-Guards SPEC §3, OQ-1):
 *   - "active"   → emitted by Rello today (21).
 *   - "reserved" → subscribable but NOT emitted by any code path — the
 *     "phantom-7". Retained (a tenant may already subscribe); never deleted.
 *
 * Scope (KEYSPACE-SEED, step A): the canonical set + lifecycle metadata + a
 * runtime guard ONLY. The normalizer (`normalizeWebhookEvent`, step B) and the
 * per-app subscription map (D-K2-gated wave) are intentionally NOT here.
 */

/**
 * The canonical webhook events, in declaration order. This `as const` array is
 * the SOURCE of the `WebhookEvent` union — it stays byte-identical to the set
 * Rello shipped so the migration is behavior-neutral.
 */
export const WEBHOOK_EVENTS = [
  "lead.created",
  "lead.updated",
  "lead.deleted",
  "lead.scored",
  "lead.tag_added",
  "lead.tag_removed",
  "pipeline.stage_changed",
  "task.created",
  "task.completed",
  "journey.enrolled",
  "journey.completed",
  "journey.exited",
  "messaging.sent",
  "messaging.delivered",
  "messaging.failed",
  "messaging.inbound",
  "messaging.bounced",
  "thread.created",
  "thread.archived",
  "agent.created",
  "agent.updated",
  "agent.deactivated",
  "agent.profile_updated",
  "credits.purchase.completed",
  "rello.meeting_booked",
  "rello.meeting_completed",
  "rello.meeting_canceled",
  "rello.meeting_no_show",
] as const;

/** The canonical outbound webhook event type — byte-identical to today's 28. */
export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

/** Lifecycle of a canonical webhook event. */
export type WebhookEventLifecycle = "active" | "reserved";

/** Declarative registry row for a canonical webhook event. */
export interface WebhookEventEntry {
  readonly event: WebhookEvent;
  /**
   * "active"  — emitted by a live Rello code path.
   * "reserved" — subscribable but emitted by nothing today (the phantom-7).
   */
  readonly lifecycle: WebhookEventLifecycle;
}

/**
 * Canonical event → declarative entry, keyed by the literal union for
 * `tsc`-time per-key completeness: a missing or stray key is a compile error,
 * so the registry can never silently drift from the union.
 *
 * The 7 `lifecycle: "reserved"` rows are the phantom-7 (allowlisted, never
 * emitted). The other 21 are "active".
 */
export const EXACT_REGISTRY: Record<WebhookEvent, WebhookEventEntry> = {
  "lead.created": { event: "lead.created", lifecycle: "active" },
  "lead.updated": { event: "lead.updated", lifecycle: "active" },
  "lead.deleted": { event: "lead.deleted", lifecycle: "active" },
  "lead.scored": { event: "lead.scored", lifecycle: "reserved" },
  "lead.tag_added": { event: "lead.tag_added", lifecycle: "active" },
  "lead.tag_removed": { event: "lead.tag_removed", lifecycle: "active" },
  "pipeline.stage_changed": {
    event: "pipeline.stage_changed",
    lifecycle: "active",
  },
  "task.created": { event: "task.created", lifecycle: "reserved" },
  "task.completed": { event: "task.completed", lifecycle: "reserved" },
  "journey.enrolled": { event: "journey.enrolled", lifecycle: "active" },
  "journey.completed": { event: "journey.completed", lifecycle: "active" },
  "journey.exited": { event: "journey.exited", lifecycle: "active" },
  "messaging.sent": { event: "messaging.sent", lifecycle: "active" },
  "messaging.delivered": {
    event: "messaging.delivered",
    lifecycle: "reserved",
  },
  "messaging.failed": { event: "messaging.failed", lifecycle: "active" },
  "messaging.inbound": { event: "messaging.inbound", lifecycle: "active" },
  "messaging.bounced": { event: "messaging.bounced", lifecycle: "reserved" },
  "thread.created": { event: "thread.created", lifecycle: "reserved" },
  "thread.archived": { event: "thread.archived", lifecycle: "reserved" },
  "agent.created": { event: "agent.created", lifecycle: "active" },
  "agent.updated": { event: "agent.updated", lifecycle: "active" },
  "agent.deactivated": { event: "agent.deactivated", lifecycle: "active" },
  "agent.profile_updated": {
    event: "agent.profile_updated",
    lifecycle: "active",
  },
  "credits.purchase.completed": {
    event: "credits.purchase.completed",
    lifecycle: "active",
  },
  "rello.meeting_booked": { event: "rello.meeting_booked", lifecycle: "active" },
  "rello.meeting_completed": {
    event: "rello.meeting_completed",
    lifecycle: "active",
  },
  "rello.meeting_canceled": {
    event: "rello.meeting_canceled",
    lifecycle: "active",
  },
  "rello.meeting_no_show": {
    event: "rello.meeting_no_show",
    lifecycle: "active",
  },
};

/**
 * Canonical event set for O(1) runtime membership checks. Typed as
 * `ReadonlySet<string>` so callers can test arbitrary raw strings.
 */
export const CANONICAL_WEBHOOK_EVENT_SET: ReadonlySet<string> = new Set(
  WEBHOOK_EVENTS,
);

/** Runtime type guard: is `raw` one of the canonical webhook events? */
export function isCanonicalWebhookEvent(raw: string): raw is WebhookEvent {
  return CANONICAL_WEBHOOK_EVENT_SET.has(raw);
}
