import 'server-only';
import type { Sql } from './client';

/**
 * Ordered, append-only schema migrations. Each runs once per database and is recorded in
 * `schema_migrations`. Statements are idempotent so two serverless instances starting at the
 * same time cannot corrupt the schema. Never edit a migration that has shipped; add a new one.
 */
interface Migration {
  id: string;
  up: (sql: Sql) => Promise<void>;
}

const LEGACY_OWNER_ID = 'usr-alazar-lead';
const LEGACY_OWNER_EMAIL = 'alazar@industrialautomation.website';
const OWNER_HANDLE = 'alex_eng_aut';
const OWNER_EMAIL = 'alex_eng_aut@industrialautomation.website';

export const MIGRATIONS: Migration[] = [
  {
    // Matches the schema the site already had in production, so it is a no-op there.
    id: '001_initial_schema',
    up: async (sql) => {
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(255) DEFAULT 'Engineer',
          station_id VARCHAR(128) DEFAULT 'TERMINAL-LOCAL-01',
          avatar VARCHAR(16),
          bio TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )`;
      await sql`
        CREATE TABLE IF NOT EXISTS sessions (
          id VARCHAR(128) PRIMARY KEY,
          user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )`;
      await sql`
        CREATE TABLE IF NOT EXISTS articles (
          slug VARCHAR(128) PRIMARY KEY,
          title TEXT NOT NULL,
          excerpt TEXT,
          author VARCHAR(255) NOT NULL,
          author_url TEXT,
          date_str VARCHAR(64),
          reading_time VARCHAR(64),
          tag VARCHAR(64),
          views INT DEFAULT 1,
          content_json JSONB NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )`;
      await sql`ALTER TABLE articles ADD COLUMN IF NOT EXISTS author_id VARCHAR(64)`;
      await sql`ALTER TABLE articles ADD COLUMN IF NOT EXISTS author_email VARCHAR(255)`;
      await sql`
        CREATE TABLE IF NOT EXISTS article_views (
          slug VARCHAR(128) PRIMARY KEY,
          views INT DEFAULT 0,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )`;
    },
  },
  {
    // Replaces the old name-based "lead author" check with an explicit flag.
    id: '002_owner_flag',
    up: async (sql) => {
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_owner BOOLEAN NOT NULL DEFAULT FALSE`;
      // The owner was seeded with a fixed ID, but may have been created through sign-up instead,
      // so also match the original owner email. Exactly one row is updated.
      await sql`
        UPDATE users
        SET name = ${OWNER_HANDLE}, email = ${OWNER_EMAIL}, role = 'Author',
            station_id = NULL, avatar = NULL, bio = '', is_owner = TRUE
        WHERE id = (
          SELECT id FROM users
          WHERE id = ${LEGACY_OWNER_ID} OR LOWER(email) = ${LEGACY_OWNER_EMAIL}
          ORDER BY (id = ${LEGACY_OWNER_ID}) DESC, created_at ASC
          LIMIT 1
        )
        AND NOT EXISTS (SELECT 1 FROM users WHERE LOWER(email) = ${OWNER_EMAIL} AND id <> ${LEGACY_OWNER_ID})`;
    },
  },
  {
    // Sessions are now stored as SHA-256 hashes of the cookie token, so a database leak does not
    // hand out live sessions. Old plaintext sessions cannot be converted and are removed (everyone
    // signs in again once).
    id: '003_hashed_sessions',
    up: async (sql) => {
      await sql`DELETE FROM sessions`;
      await sql`CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id)`;
    },
  },
  {
    // Author emails were copied into the public article JSON. Strip them and stop storing them.
    id: '004_strip_author_email_from_articles',
    up: async (sql) => {
      await sql`UPDATE articles SET content_json = content_json - 'authorEmail' WHERE content_json ? 'authorEmail'`;
      await sql`UPDATE articles SET content_json = content_json - 'views' WHERE content_json ? 'views'`;
      await sql`CREATE INDEX IF NOT EXISTS articles_author_id_idx ON articles(author_id)`;
    },
  },
  {
    // Fixed-window counters for rate limiting (shared across serverless instances).
    id: '005_rate_limits',
    up: async (sql) => {
      await sql`
        CREATE TABLE IF NOT EXISTS rate_limits (
          key VARCHAR(255) PRIMARY KEY,
          window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          count INT NOT NULL DEFAULT 0
        )`;
    },
  },
  {
    // Challenge progress follows the account across devices (local progress is merged on sign-in).
    id: '006_challenge_progress',
    up: async (sql) => {
      await sql`
        CREATE TABLE IF NOT EXISTS challenge_progress (
          user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          challenge_slug VARCHAR(64) NOT NULL,
          solved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (user_id, challenge_slug)
        )`;
    },
  },
  {
    // Community gallery of published circuits. Forks are new rows that remember their source.
    id: '007_gallery_circuits',
    up: async (sql) => {
      await sql`
        CREATE TABLE IF NOT EXISTS gallery_circuits (
          id VARCHAR(32) PRIMARY KEY,
          owner_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(120) NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          document JSONB NOT NULL,
          block_count INT NOT NULL,
          forked_from VARCHAR(32),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`;
      await sql`CREATE INDEX IF NOT EXISTS gallery_circuits_created ON gallery_circuits (created_at DESC)`;
      await sql`CREATE INDEX IF NOT EXISTS gallery_circuits_owner ON gallery_circuits (owner_id)`;
    },
  },
];

let pending: Promise<void> | null = null;

/** Applies outstanding migrations once per server instance. Retries on the next call if it fails. */
export function ensureSchema(sql: Sql): Promise<void> {
  if (!pending) {
    pending = runMigrations(sql).catch((error) => {
      pending = null;
      throw error;
    });
  }
  return pending;
}

async function runMigrations(sql: Sql): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id VARCHAR(128) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
  const rows = (await sql`SELECT id FROM schema_migrations`) as { id: string }[];
  const applied = new Set(rows.map((row) => row.id));
  for (const migration of MIGRATIONS) {
    if (applied.has(migration.id)) continue;
    await migration.up(sql);
    await sql`INSERT INTO schema_migrations (id) VALUES (${migration.id}) ON CONFLICT (id) DO NOTHING`;
  }
}
