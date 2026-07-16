import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  runScheduledIntegrationSync: vi.fn(async () => ({
    claimed: 1,
    enqueued: 1,
    failed: 0,
    normalized: 1,
    reused: 0,
  })),
}));

vi.mock("@/lib/integrations/scheduled-sync", () => ({
  runScheduledIntegrationSync: mocks.runScheduledIntegrationSync,
}));

import { GET } from "@/app/api/cron/integration-sync/route";

function request(secret: string | null) {
  return new NextRequest("https://retailos.example/api/cron/integration-sync", {
    headers: secret ? { authorization: `Bearer ${secret}` } : {},
  });
}

describe("scheduled sync cron route", () => {
  beforeEach(() => {
    mocks.runScheduledIntegrationSync.mockClear();
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-test";
    process.env.DATABASE_URL = "postgres://retailos.example/test";
    process.env.CRON_SECRET = "cron-secret-test";
  });

  it("rejects requests without the cron secret", async () => {
    const response = await GET(request(null));

    expect(response.status).toBe(401);
    expect(mocks.runScheduledIntegrationSync).not.toHaveBeenCalled();
  });

  it("runs scheduled sync when CRON_SECRET matches", async () => {
    const response = await GET(request("cron-secret-test"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      claimed: 1,
      enqueued: 1,
      failed: 0,
      normalized: 1,
      ok: true,
      reused: 0,
    });
    expect(mocks.runScheduledIntegrationSync).toHaveBeenCalledOnce();
  });

  it("fails closed when CRON_SECRET is not configured", async () => {
    delete process.env.CRON_SECRET;

    const response = await GET(request("cron-secret-test"));

    expect(response.status).toBe(503);
    expect(mocks.runScheduledIntegrationSync).not.toHaveBeenCalled();
  });
});
