import { test, afterEach, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../src/index.js';
import { pool } from '../src/db/helpers.js';

async function cleanDatabase() {
  const tables = [
    'project_requirements',
    'projects',
    'team_members',
    'teams',
    'skills',
    'profiles',
    'users'
  ];

  for (const table of tables) {
    await pool.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
  }
}

afterEach(async () => {
  await cleanDatabase();
});


test('US13 https test', async () => {
  const server = http.createServer(app);
  
  await new Promise(resolve => {
    server.listen(0, resolve);
  });
  
  const { port } = server.address();

  try {
    const res = await fetch(`http://localhost:${port}/health`, {
      headers: { 'x-forwarded-proto': 'https' }
    });
    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(await res.json(), { status: 'ok' });
  } finally {
    server.close();
  }
});