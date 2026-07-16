import "server-only";

const SERVER_ENV_KEYS = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
] as const;

type ServerEnv = {
  SUPABASE_SERVICE_ROLE_KEY: string;
  DATABASE_URL: string;
  IMPORT_API_TOKEN_HASH_SECRET?: string;
  CRON_SECRET?: string;
};

export function getServerEnv(): ServerEnv {
  const values = {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    IMPORT_API_TOKEN_HASH_SECRET: process.env.IMPORT_API_TOKEN_HASH_SECRET,
    CRON_SECRET: process.env.CRON_SECRET,
  };

  for (const key of SERVER_ENV_KEYS) {
    if (!values[key]) {
      throw new Error(`Missing required server environment variable: ${key}`);
    }
  }

  return values as ServerEnv;
}
