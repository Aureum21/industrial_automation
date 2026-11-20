#!/usr/bin/env node
/**
 * Local stand-in for Neon's HTTP query endpoint, so the app can run against an ordinary
 * Postgres during development and tests (no Neon account needed).
 *
 *   LOCAL_PG_URL=postgres://app@localhost:5432/automationhub node scripts/local-db-proxy.mjs
 *
 * Then start the app with:
 *   DATABASE_URL=postgres://app@localhost/automationhub
 *   NEON_FETCH_ENDPOINT=http://localhost:4444/sql
 *
 * It implements just what @neondatabase/serverless sends over HTTP: a single query
 * ({ query, params }) or a batch ({ queries: [...] }), answered in "raw text, array mode".
 */
import http from 'node:http';
import pg from 'pg';

const port = Number(process.env.PORT || 4444);
const pool = new pg.Pool({ connectionString: process.env.LOCAL_PG_URL || 'postgres://app@localhost:5432/automationhub' });
// Return every column as text; the Neon driver parses values itself using the type OIDs.
const rawTypes = { getTypeParser: () => (value) => value };

async function run(client, { query, params }) {
  const result = await client.query({ text: query, values: params ?? [], rowMode: 'array', types: rawTypes });
  return {
    command: result.command,
    rowCount: result.rowCount,
    fields: result.fields.map((field) => ({ name: field.name, dataTypeID: field.dataTypeID })),
    rows: result.rows,
  };
}

const server = http.createServer(async (req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(405).end();
    return;
  }
  let body = '';
  for await (const chunk of req) body += chunk;
  const client = await pool.connect();
  try {
    const payload = JSON.parse(body);
    let response;
    if (Array.isArray(payload.queries)) {
      await client.query('BEGIN');
      const results = [];
      for (const query of payload.queries) results.push(await run(client, query));
      await client.query('COMMIT');
      response = { results };
    } else {
      response = await run(client, payload);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(response));
  } catch (error) {
    if (Array.isArray(JSON.parse(body || '{}').queries)) await client.query('ROLLBACK').catch(() => {});
    res.writeHead(400, { 'Content-Type': 'application/json' }).end(JSON.stringify({ message: error.message, code: error.code }));
  } finally {
    client.release();
  }
});

server.listen(port, () => console.log(`Local Neon-compatible SQL endpoint on http://localhost:${port}/sql`));
