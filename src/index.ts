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
  // RATE-ENGINE — the canonical tenant-agnostic market-move broadcast. Rello is
  // the SOLE publisher (AOM "Generic market-move rate.changed broadcast" row,
  // 2026-06-04). Spokes Drumbeat / Home-Scout subscribe via WebhookEndpoint
  // (Milo delivery path TBD — no `milo` key in APP_WEBHOOK_EVENTS, flagged for
  // follow-up). ONE literal — `rate.changed` — shared with the internal signal
  // type `rate.changed` in @rello-platform/signals (v0.12.0).
  "rate.changed",
  // PHONE-DISCONNECTED (CROSS-REPO-WALK-DECISIONS-260609 Q2, v0.5.0) — Rello
  // emits when a Twilio SMS delivery-status callback reports a terminal
  // delivery failure with a disconnected-class ErrorCode (30003/30005/30006).
  // Harvest-Home subscribes (APP_WEBHOOK_EVENTS["harvest-home"]) and routes the
  // event to its ReplacementClaim checkPhoneDisconnected() receiver. ONE
  // literal — `rello.lead_phone_disconnected` — shared with the internal signal
  // type of the same name in @rello-platform/signals (v0.15.0).
  "rello.lead_phone_disconnected",
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
  // RATE-ENGINE — Rello-emitted on SIGNIFICANT/CRITICAL rate detection
  // (src/trigger/jobs/rate-data.ts). Active from go-live (Drumbeat / Home-Scout
  // / Milo subscribe via APP_WEBHOOK_EVENTS).
  "rate.changed": { event: "rate.changed", lifecycle: "active" },
  // PHONE-DISCONNECTED (Q2) — Rello-emitted from the Twilio SMS delivery-status
  // webhook on disconnected-class delivery failure. Harvest-Home subscribes.
  "rello.lead_phone_disconnected": {
    event: "rello.lead_phone_disconnected",
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

/**
 * Deterministic legacy → canonical fold map (Platform-Identifier-Drift-Guards
 * SPEC §3.2, step B). Each KEY is a legacy event string Rello once emitted or a
 * tenant once subscribed to; each VALUE is the canonical Rello-emitted event it
 * folds to — and every value is a member of `WEBHOOK_EVENTS` (the canonical 28),
 * so a fold can never produce a non-canonical result. This doubles as the
 * documented retirement list for the legacy forms.
 *
 * The `contact.*` keys are the MarketIntel inbound-handler set (the recon
 * under-inventoried them): the "lead not contact" platform rule means every
 * `contact.<x>` legacy form folds to its `lead.<x>` / `pipeline.<x>` canonical.
 *
 * INTENTIONALLY NOT FOLDED (not pure 1→1 canonical folds — left for later /
 * D-K2 / D-K3 waves; documented so the omission is a decision, not an oversight):
 *   - `lead.tags_changed`            → a 1→2 split into `lead.tag_added` +
 *                                      `lead.tag_removed` (OQ-2 handler rewrite,
 *                                      not a fold).
 *   - `app.activated`                → `app.<slug>.activated` — slug-dependent,
 *                                      ambiguous without publisher context.
 *   - `journey.step_executed`        → no clean canonical target.
 *   - `journey.enrollment_changed`   → no clean canonical target.
 *   - `harvesthome.lead_scored`      → `harvest-home.lead_scored` is a CROSS-SPOKE
 *                                      namespaced event (PathfinderPro inbound
 *                                      route), NOT in the canonical 28 and
 *                                      D-K2-gated; folding it here would still be
 *                                      rejected by the membership check and would
 *                                      imply cross-spoke namespace registration.
 */
export const WEBHOOK_EVENT_FOLDS: Readonly<Record<string, WebhookEvent>> = {
  "lead.stage_changed": "pipeline.stage_changed",
  "contact.created": "lead.created",
  "contact.updated": "lead.updated",
  "contact.tag_added": "lead.tag_added",
  "contact.tag_removed": "lead.tag_removed",
  "contact.stage_changed": "pipeline.stage_changed",
  "journey.enrollment_created": "journey.enrolled",
  "journey.enrollment_completed": "journey.completed",
};

/**
 * Normalize a raw event string to its canonical webhook event, or `null` if it
 * is neither canonical nor a known legacy fold.
 *
 * Resolution order (deterministic, pure):
 *   1. trim surrounding whitespace;
 *   2. if already canonical (`isCanonicalWebhookEvent`) → return it unchanged;
 *   3. else if it has a legacy fold → return the canonical target (∈ the 28);
 *   4. else → `null` (truly-invalid; callers keep their existing reject path).
 *
 * Apply at boundaries that read a tenant- or wire-supplied event string (e.g.
 * the subscription-create endpoint): fold-if-legacy, then membership-check, so
 * a legacy subscription input stores its canonical form instead of 400ing while
 * genuine garbage still fails.
 */
export function normalizeWebhookEvent(raw: string): WebhookEvent | null {
  const trimmed = raw.trim();
  if (isCanonicalWebhookEvent(trimmed)) {
    return trimmed;
  }
  return WEBHOOK_EVENT_FOLDS[trimmed] ?? null;
}
