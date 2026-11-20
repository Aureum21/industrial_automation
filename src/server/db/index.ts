import 'server-only';
import { getSqlClient, isDbConfigured, type Sql } from './client';
import { ensureSchema } from './migrations';
import { hashPassword } from '../auth/password';

export { isDbConfigured };
export type { Sql };

let ownerSeeded: Promise<void> | null = null;

/**
 * Returns the database client after making sure migrations have run.
 * Throws an HttpError(503) when DATABASE_URL is missing.
 */
export async function db(): Promise<Sql> {
  const sql = getSqlClient();
  await ensureSchema(sql);
  if (!ownerSeeded) {
    ownerSeeded = seedOwnerIfConfigured(sql).catch((error) => {
      ownerSeeded = null;
      throw error;
    });
  }
  await ownerSeeded;
  return sql;
}

/**
 * Fresh databases have no owner. When OWNER_INITIAL_PASSWORD is set, create one with the
 * public handle. Nothing happens if an owner already exists.
 */
async function seedOwnerIfConfigured(sql: Sql): Promise<void> {
  const password = process.env.OWNER_INITIAL_PASSWORD?.trim();
  if (!password) return;
  const owners = (await sql`SELECT 1 FROM users WHERE is_owner = TRUE LIMIT 1`) as unknown[];
  if (owners.length > 0) return;
  const hash = await hashPassword(password);
  await sql`
    INSERT INTO users (id, name, email, password_hash, role, is_owner)
    VALUES ('usr-owner', 'alex_eng_aut', 'alex_eng_aut@industrialautomation.website', ${hash}, 'Author', TRUE)
    ON CONFLICT DO NOTHING`;
}
