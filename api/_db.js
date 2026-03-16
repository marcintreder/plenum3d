import { neon } from '@neondatabase/serverless';

let _sql = null;

export function getDb() {
  if (!_sql) {
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!url) throw new Error('No database URL configured (DATABASE_URL or POSTGRES_URL)');
    _sql = neon(url);
  }
  return _sql;
}

export async function ensureTable() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS user_data (
      user_id TEXT NOT NULL,
      key     TEXT NOT NULL,
      value   JSONB,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (user_id, key)
    )
  `;
}

export async function getData(userId, key) {
  const sql = getDb();
  const rows = await sql`
    SELECT value FROM user_data WHERE user_id = ${userId} AND key = ${key}
  `;
  return rows[0]?.value ?? null;
}

export async function setData(userId, key, value) {
  const sql = getDb();
  await sql`
    INSERT INTO user_data (user_id, key, value, updated_at)
    VALUES (${userId}, ${key}, ${JSON.stringify(value)}, NOW())
    ON CONFLICT (user_id, key)
    DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
  `;
}
