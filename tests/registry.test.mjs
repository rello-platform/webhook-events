import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  WEBHOOK_EVENTS,
  EXACT_REGISTRY,
  CANONICAL_WEBHOOK_EVENT_SET,
  isCanonicalWebhookEvent,
  WEBHOOK_EVENT_FOLDS,
  normalizeWebhookEvent,
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

describe("normalizeWebhookEvent — deterministic legacy → canonical folds", () => {
  // The 8 D-K2-independent folds (every target ∈ the canonical 28).
  const EXPECTED_FOLDS = {
    "lead.stage_changed": "pipeline.stage_changed",
    "contact.created": "lead.created",
    "contact.updated": "lead.updated",
    "contact.tag_added": "lead.tag_added",
    "contact.tag_removed": "lead.tag_removed",
    "contact.stage_changed": "pipeline.stage_changed",
    "journey.enrollment_created": "journey.enrolled",
    "journey.enrollment_completed": "journey.completed",
  };

  // Not pure 1→1 canonical folds — must return null (later / D-K2 / D-K3 waves).
  const EXCLUDED_NON_FOLDS = [
    "lead.tags_changed",
    "app.activated",
    "journey.step_executed",
    "journey.enrollment_changed",
    "harvesthome.lead_scored",
  ];

  it("fold map has exactly the 8 expected pairs", () => {
    assert.deepEqual(
      Object.keys(WEBHOOK_EVENT_FOLDS).sort(),
      Object.keys(EXPECTED_FOLDS).sort(),
    );
  });

  it("EVERY fold target is a member of the canonical 28", () => {
    for (const target of Object.values(WEBHOOK_EVENT_FOLDS)) {
      assert.ok(
        CANONICAL_WEBHOOK_EVENT_SET.has(target),
        `fold target ${target} is NOT canonical`,
      );
    }
  });

  it("each legacy input folds to its canonical target", () => {
    for (const [legacy, canonical] of Object.entries(EXPECTED_FOLDS)) {
      assert.equal(
        normalizeWebhookEvent(legacy),
        canonical,
        `${legacy} should fold to ${canonical}`,
      );
    }
  });

  it("a canonical input normalizes to itself (incl. reserved)", () => {
    for (const e of EXPECTED_28) {
      assert.equal(normalizeWebhookEvent(e), e, `${e} should be unchanged`);
    }
  });

  it("trims surrounding whitespace before resolving", () => {
    assert.equal(normalizeWebhookEvent("  lead.created  "), "lead.created");
    assert.equal(
      normalizeWebhookEvent(" contact.updated "),
      "lead.updated",
    );
  });

  it("returns null for the EXCLUDED non-folds (left for later waves)", () => {
    for (const e of EXCLUDED_NON_FOLDS) {
      assert.equal(normalizeWebhookEvent(e), null, `${e} must NOT fold`);
    }
  });

  it("returns null for true garbage / unknown events", () => {
    assert.equal(normalizeWebhookEvent("totally.bogus"), null);
    assert.equal(normalizeWebhookEvent(""), null);
    assert.equal(normalizeWebhookEvent("LEAD.CREATED"), null);
    assert.equal(normalizeWebhookEvent("contact"), null);
  });
});
