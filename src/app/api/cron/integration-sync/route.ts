import { timingSafeEqual } from "node:crypto";

import { type NextRequest, NextResponse } from "next/server";

import { getServerEnv } from "@/lib/env/server";
import { runScheduledIntegrationSync } from "@/lib/integrations/scheduled-sync";

export const runtime = "nodejs";

// RLS_SCOPED_REVIEWED: this route performs no Supabase client query directly.
// Schedule claiming and tenant scoping are handled by the scheduled sync store.
export async function GET(request: NextRequest) {
  const env = getServerEnv();

  if (!isAuthorizedCronRequest(request, env.CRON_SECRET)) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: env.CRON_SECRET ? 401 : 503 },
    );
  }

  const result = await runScheduledIntegrationSync();

  return NextResponse.json({
    ok: true,
    ...result,
  });
}

function isAuthorizedCronRequest(
  request: NextRequest,
  secret: string | undefined,
) {
  if (!secret) return false;

  const authorization = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const actualBuffer = Buffer.from(authorization);
  const expectedBuffer = Buffer.from(expected);

  return actualBuffer.length === expectedBuffer.length
    && timingSafeEqual(actualBuffer, expectedBuffer);
}
