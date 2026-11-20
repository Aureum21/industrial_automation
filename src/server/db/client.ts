import 'server-only';
import { neon, neonConfig, type NeonQueryFunction } from '@neondatabase/serverless';
import { HttpError } from '../http';

// Local development / tests: route queries to scripts/local-db-proxy.mjs instead of Neon.
// Never set this in production.
if (process.env.NEON_FETCH_ENDPOINT) {
  neonConfig.fetchEndpoint = process.env.NEON_FETCH_ENDPOINT;
}

export type Sql = NeonQueryFunction<false, false>;

let client: Sql | null = null;

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

/** Raw Neon client. Callers should normally use `db()` from `./index`, which also ensures the schema. */
export function getSqlClient(): Sql {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new HttpError(503, 'The database is not configured on this deployment.');
  }
  if (!client) client = neon(url);
  return client;
}
