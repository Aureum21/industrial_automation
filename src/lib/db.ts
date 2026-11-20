import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import { hashPassword } from './authCrypto';

let sqlClient: NeonQueryFunction<false, false> | null = null;

const OWNER_HANDLE = 'alex_eng_aut';
const OWNER_EMAIL = 'alex_eng_aut@industrialautomation.website';
const LEGACY_OWNER_ID = 'usr-alazar-lead';
let initialized = false;

/**
 * Returns true if DATABASE_URL is set in environment variables.
 */
export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0);
}

/**
 * Returns the active Neon SQL query client.
 * Returns null if DATABASE_URL is not configured yet.
 */
export function getDb() {
  if (!isDbConfigured()) {
    return null;
  }

  if (!sqlClient) {
    const connString = process.env.DATABASE_URL!.trim();
    sqlClient = neon(connString);
  }

  return sqlClient;
}

/**
 * Initializes database tables (users, sessions, custom articles) in Neon PostgreSQL
 * and seeds the site owner account if OWNER_INITIAL_PASSWORD is set.
 */
export async function initDb() {
  const sql = getDb();
  if (!sql) {
    return { ok: false, error: 'DATABASE_URL is not set' };
  }

  if (initialized) {
    return { ok: true, cached: true };
  }

  try {
    // 1. Create Users Table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(255) DEFAULT 'Engineer',
        station_id VARCHAR(128) DEFAULT 'TERMINAL-LOCAL-01',
        avatar VARCHAR(16) DEFAULT 'OP',
        bio TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // 2. Create Sessions Table
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(128) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // 3. Create Custom Articles / Masterclasses Table (for cloud sync)
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
      );
    `;

    // Ensure author_id and author_email exist in articles table for multi-author isolation
    await sql`
      ALTER TABLE articles ADD COLUMN IF NOT EXISTS author_id VARCHAR(64);
    `;
    await sql`
      ALTER TABLE articles ADD COLUMN IF NOT EXISTS author_email VARCHAR(255);
    `;

    // 4. Create Article Views Table for Real Live Read Counts
    await sql`
      CREATE TABLE IF NOT EXISTS article_views (
        slug VARCHAR(128) PRIMARY KEY,
        views INT DEFAULT 1,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    const initialSeeds = [
      { slug: 'water-treatment', views: 18 },
      { slug: 'industrial-heater-pi-pwm-anti-windup', views: 15 },
      { slug: 'traffic-lights', views: 19 },
      { slug: 'conveyor-sorting', views: 12 },
      { slug: 'two-hand-safety', views: 16 },
      { slug: 'hvac-economizer', views: 11 },
      { slug: 'tank-hysteresis', views: 14 },
      { slug: 'pump-alternator', views: 13 },
      { slug: 'esd-delays', views: 9 },
      { slug: 'solar-logging', views: 14 },
    ];

    for (const item of initialSeeds) {
      await sql`
        INSERT INTO article_views (slug, views)
        VALUES (${item.slug}, ${item.views})
        ON CONFLICT (slug) DO NOTHING;
      `;
    }

    // 5. Site owner flag (replaces the old name-based "lead author" check)
    await sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_owner BOOLEAN DEFAULT FALSE;
    `;

    // One-time migration: the original owner account (id kept as-is, it is an internal key)
    // is renamed to the public handle and flagged as owner.
    await sql`
      UPDATE users
      SET name = ${OWNER_HANDLE},
          email = ${OWNER_EMAIL},
          role = 'Author',
          station_id = 'TERMINAL-LOCAL-01',
          avatar = 'AL',
          bio = ''
      WHERE id = ${LEGACY_OWNER_ID} AND name <> ${OWNER_HANDLE};
    `;
    await sql`
      UPDATE users SET is_owner = TRUE WHERE id = ${LEGACY_OWNER_ID} AND is_owner IS NOT TRUE;
    `;

    // 6. Fresh databases: seed an owner account only when an initial password is provided.
    const owners = await sql`SELECT id FROM users WHERE is_owner = TRUE LIMIT 1;`;
    const initialPassword = process.env.OWNER_INITIAL_PASSWORD?.trim();
    if ((!owners || owners.length === 0) && initialPassword) {
      const passwordHash = await hashPassword(initialPassword);
      await sql`
        INSERT INTO users (id, name, email, password_hash, role, avatar, bio, is_owner)
        VALUES ('usr-owner', ${OWNER_HANDLE}, ${OWNER_EMAIL}, ${passwordHash}, 'Author', 'AL', '', TRUE)
        ON CONFLICT (email) DO NOTHING;
      `;
    }

    initialized = true;
    return { ok: true };
  } catch (err) {
    console.error('Failed to initialize Neon database:', err);
    return { ok: false, error: (err as Error).message };
  }
}
