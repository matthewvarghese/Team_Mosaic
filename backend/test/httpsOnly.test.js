import app from '../src/index.js'
import assert from 'node:assert/strict'
import { test, afterEach, after } from 'node:test'
import http from 'node:http'
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
test('US13 blocks non HTTPS requests', async () => {
  const server = http.createServer(app);
  
  await new Promise(resolve => {
    server.listen(0, resolve);
  });
  
  const { port } = server.address();

  try {
    const res = await fetch(`http://localhost:${port}/health`);
    assert.strictEqual(res.status, 400);
    assert.deepStrictEqual(await res.json(), { error: 'HTTPS is required' });
  } finally {
    server.close();
  }
});

test('US-13: mixed header blocked', async () => {
  const server = http.createServer(app);
  
  await new Promise(resolve => {
    server.listen(0, resolve);
  });
  
  const { port } = server.address();

  try {
    const res = await fetch(`http://localhost:${port}/health`, {
      headers: { 'x-forwarded-proto': 'http' }
    });
    assert.strictEqual(res.status, 400);
    assert.deepStrictEqual(await res.json(), { error: 'HTTPS is required' });
  } finally {
    server.close();
  }
});