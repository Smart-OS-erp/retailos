import { type NextRequest } from "next/server";

import { authorizeImportApiRequest } from "@/lib/import-api/handler";
import { PostgresImportApiStore } from "@/lib/import-api/postgres-store";
import { getServerEnv } from "@/lib/env/server";

export const runtime = "nodejs";

const store = new PostgresImportApiStore();

export async function POST(request: NextRequest) {
  const env = getServerEnv();

  return authorizeImportApiRequest(
    request,
    store,
    env.IMPORT_API_TOKEN_HASH_SECRET,
  );
}
