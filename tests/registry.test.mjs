import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  WEBHOOK_EVENTS,
  EXACT_REGISTRY,
  CANONICAL_WEBHOOK_EVENT_SET,
  isCanonicalWebhookEvent,
} from "../dist/index.js";

// The canonical 28, verbatim from Rello webhook-events.ts @ d4a870fe.
const EXPECTED_28 = [
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
];

// The phantom-7 — allowlisted but never emitted (SPEC OQ-1).
const EXPECTED_RESERVED = [
  "lead.scored",
  "task.created",
  "task.completed",
  "messaging.delivered",
  "messaging.bounced",
  "thread.created",
  "thread.archived",
];

describe("WEBHOOK_EVENTS — canonical 28, byte-identical & ordered", () => {
  it("is exactly the 28 events in declaration order", () => {
    assert.deepEqual([...WEBHOOK_EVENTS], EXPECTED_28);
  });
  it("has no duplicates", () => {
    assert.equal(new Set(WEBHOOK_EVENTS).size, WEBHOOK_EVENTS.length);
  });
});

describe("EXACT_REGISTRY — per-key completeness & lifecycle partition", () => {
  it("has exactly one row per canonical event (no missing, no stray)", () => {
    assert.deepEqual(Object.keys(EXACT_REGISTRY).sort(), [...EXPECTED_28].sort());
  });
  it("each row's `event` matches its key", () => {
    for (const [key, entry] of Object.entries(EXACT_REGISTRY)) {
      assert.equal(entry.event, key, `row ${key} self-reference mismatch`);
    }
  });
  it("lifecycle is always 'active' or 'reserved'", () => {
    for (const entry of Object.values(EXACT_REGISTRY)) {
      assert.ok(
        entry.lifecycle === "active" || entry.lifecycle === "reserved",
        `bad lifecycle ${entry.lifecycle} for ${entry.event}`,
      );
    }
  });
  it("the 7 reserved rows are exactly the phantom-7", () => {
    const reserved = Object.values(EXACT_REGISTRY)
      .filter((e) => e.lifecycle === "reserved")
      .map((e) => e.event)
      .sort();
    assert.deepEqual(reserved, [...EXPECTED_RESERVED].sort());
  });
  it("partitions 21 active / 7 reserved", () => {
    const active = Object.values(EXACT_REGISTRY).filter(
      (e) => e.lifecycle === "active",
    );
    const reserved = Object.values(EXACT_REGISTRY).filter(
      (e) => e.lifecycle === "reserved",
    );
    assert.equal(active.length, 21);
    assert.equal(reserved.length, 7);
  });
});

describe("CANONICAL_WEBHOOK_EVENT_SET + isCanonicalWebhookEvent", () => {
  it("set mirrors the union exactly", () => {
    assert.equal(CANONICAL_WEBHOOK_EVENT_SET.size, 28);
    for (const e of EXPECTED_28) {
      assert.ok(CANONICAL_WEBHOOK_EVENT_SET.has(e), `set missing ${e}`);
    }
  });
  it("guard accepts every canonical event (incl. reserved)", () => {
    for (const e of EXPECTED_28) {
      assert.equal(isCanonicalWebhookEvent(e), true, `guard rejected ${e}`);
    }
  });
  it("guard rejects non-canonical / legacy spoke forms", () => {
    assert.equal(isCanonicalWebhookEvent("lead.stage_changed"), false);
    assert.equal(isCanonicalWebhookEvent("email.sent"), false);
    assert.equal(isCanonicalWebhookEvent("contact.updated"), false);
    assert.equal(isCanonicalWebhookEvent(""), false);
    assert.equal(isCanonicalWebhookEvent("LEAD.CREATED"), false);
  });
});
