import { test, before, after, afterEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/index.js";
import { pool } from "../src/db/helpers.js";

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



test("US-1: GET /auth/providers returns provider list", async () => {
  const res = await request(app)
    .get("/auth/providers")
    .set("x-forwarded-proto", "https");
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body)); 
  
  const providerCodes = res.body.map(p => p.code);
  assert.ok(providerCodes.includes("dummy"));
  assert.ok(providerCodes.includes("google"));
});

test("US-1: POST /auth/logout returns 204", async () => {
  const res = await request(app)
    .post("/auth/logout")
    .set("x-forwarded-proto", "https");
  
  assert.equal(res.status, 204);
});