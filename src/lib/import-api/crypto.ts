import { createHash, createHmac } from "node:crypto";

const HASH_PREFIX = "hmac-sha256:";

export function hashImportApiToken(token: string, secret: string) {
  return `${HASH_PREFIX}${createHmac("sha256", secret).update(token).digest("hex")}`;
}

export function sha256Evidence(value: string) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}
