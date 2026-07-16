import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  runScheduledIntegrationSync,
  scheduledIdempotencyKey,
  type ScheduledSyncCandidate,
  type ScheduledSyncStore,
} from "@/lib/integrations/scheduled-sync";

const candidate = {
  dataSourceId: "20000000-0000-4000-8000-000000000001",
  intervalMinutes: 1440,
  nextRunAt: "2026-07-16T02:00:00.000Z",
  organizationId: "10000000-0000-4000-8000-000000000001",
  providerKey: "shopify",
  runAsUserId: "30000000-0000-4000-8000-000000000001",
  scheduleId: "40000000-0000-4000-8000-000000000001",
} satisfies ScheduledSyncCandidate;

class FakeScheduledSyncStore implements ScheduledSyncStore {
  completedJobs: string[] = [];
  enqueuedKeys: string[] = [];
  failedSchedules: string[] = [];

  constructor(
    private readonly candidates: ScheduledSyncCandidate[],
    private readonly reused = false,
  ) {}

  async claimDueSchedules() {
    return this.candidates;
  }

  async enqueueScheduledSync(
    _candidate: ScheduledSyncCandidate,
    idempotencyKey: string,
  ) {
    this.enqueuedKeys.push(idempotencyKey);
    return {
      jobId: "50000000-0000-4000-8000-000000000001",
      reused: this.reused,
    };
  }

  async normalizeExternalRecords() {
    return { error: null };
  }

  async markScheduleComplete(
    _candidate: ScheduledSyncCandidate,
    jobId: string,
  ) {
    this.completedJobs.push(jobId);
  }

  async markScheduleFailed(candidate: ScheduledSyncCandidate) {
    this.failedSchedules.push(candidate.scheduleId);
  }
}

describe("scheduled integration sync", () => {
  it("uses deterministic schedule idempotency keys", () => {
    expect(scheduledIdempotencyKey(candidate)).toBe(
      "scheduled-40000000-0000-4000-8000-000000000001-20260716T020000Z",
    );
  });

  it("claims due schedules, enqueues scheduled jobs, and runs provider sync", async () => {
    const store = new FakeScheduledSyncStore([candidate]);
    const providerSync = vi.fn(async () => ({
      externalRecords: 2,
      jobId: "50000000-0000-4000-8000-000000000001",
      shouldNormalize: true as const,
      status: "normalized" as const,
    }));

    const result = await runScheduledIntegrationSync(
      { now: new Date("2026-07-16T02:00:00Z") },
      { providerSync, store },
    );

    expect(result).toEqual({
      claimed: 1,
      enqueued: 1,
      failed: 0,
      normalized: 1,
      reused: 0,
    });
    expect(store.enqueuedKeys).toEqual([scheduledIdempotencyKey(candidate)]);
    expect(store.completedJobs).toEqual([
      "50000000-0000-4000-8000-000000000001",
    ]);
    expect(providerSync).toHaveBeenCalledWith({
      jobId: "50000000-0000-4000-8000-000000000001",
      normalizeExternalRecords: expect.any(Function),
      organizationId: candidate.organizationId,
    });
  });

  it("counts idempotency reuse without claiming a new enqueue", async () => {
    const store = new FakeScheduledSyncStore([candidate], true);

    const result = await runScheduledIntegrationSync(
      { now: new Date("2026-07-16T02:00:00Z") },
      {
        providerSync: async () => ({
          jobId: "50000000-0000-4000-8000-000000000001",
          shouldNormalize: false,
          status: "skipped" as const,
          reason: "job-not-queued" as const,
        }),
        store,
      },
    );

    expect(result.enqueued).toBe(0);
    expect(result.reused).toBe(1);
  });

  it("fails closed for an unsupported injected provider candidate", async () => {
    const store = new FakeScheduledSyncStore([
      {
        ...candidate,
        providerKey: "google_sheets",
      },
    ]);

    const result = await runScheduledIntegrationSync(
      { now: new Date("2026-07-16T02:00:00Z") },
      { store },
    );

    expect(result.failed).toBe(1);
    expect(store.failedSchedules).toEqual([candidate.scheduleId]);
  });
});
