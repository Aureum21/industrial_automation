import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import { hashPassword } from './authCrypto';

let sqlClient: NeonQueryFunction<false, false> | null = null;
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
 * and seeds the lead author account if not yet present.
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
        avatar VARCHAR(16) DEFAULT 'AW',
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

    // 4. Seed Default Author User if not exists
    const authorEmail = 'alazar@industrialautomation.website';
    const existing = await sql`
      SELECT id FROM users WHERE LOWER(email) = LOWER(${authorEmail}) OR LOWER(name) = 'alazar' LIMIT 1;
    `;

    if (!existing || existing.length === 0) {
      // Default initial password: 'alazar-industrial' (can be updated immediately via change password / settings)
      const defaultPasswordHash = await hashPassword('alazar-industrial');
      await sql`
        INSERT INTO users (id, name, email, password_hash, role, station_id, avatar, bio)
        VALUES (
          'usr-alazar-lead',
          'Alazar Wake Kore',
          ${authorEmail},
          ${defaultPasswordHash},
          'Electrical Engineering Technology Senior at Higher Colleges of Technology (UAE)',
          'PLC-STATION-ALPHA',
          'AW',
          'Electrical Engineering Technology Senior at Higher Colleges of Technology (UAE) specializing in deterministic PLC logic, SCADA safety interlocks, and closed-loop process control.'
        )
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
