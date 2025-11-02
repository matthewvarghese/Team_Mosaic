import { test, afterEach, after } from "node:test";
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


async function login(email = "profile@test.dev") {
  const res = await request(app)
    .post("/auth/login")
    .set("x-forwarded-proto", "https")
    .send({ providerCode: "dummy", email });
  return res.body.token;
}

test("US-2: before create", async () => {
  const token = await login("u1@test.dev");
  const res = await request(app)
    .get("/me/profile")
    .set("x-forwarded-proto", "https")
    .set("authorization", `Bearer ${token}`);
  assert.equal(res.status, 404);
  assert.equal(res.body.error, "Profile not found");
});

test("US-2: create profile ", async () => {
  const token = await login("u2@test.dev");
  const res = await request(app)
    .post("/me/profile")
    .set("x-forwarded-proto", "https")
    .set("authorization", `Bearer ${token}`)
    .send({ name: "Alice", title: "Engineer", bio: "Loves code" });
  assert.equal(res.status, 201);
  assert.equal(res.headers.location, "/me/profile");
  assert.equal(res.body.name, "Alice");
  assert.equal(res.body.email, "u2@test.dev");
});

test("US-2:updates profile ", async () => {
  const token = await login("u3@test.dev");

  await request(app)
    .post("/me/profile")
    .set("x-forwarded-proto", "https")
    .set("authorization", `Bearer ${token}`)
    .send({ name: "Bob", title: "Eng I" });

  const upd = await request(app)
    .put("/me/profile")
    .set("x-forwarded-proto", "https")
    .set("authorization", `Bearer ${token}`)
    .send({ title: "Eng II" });
  assert.equal(upd.status, 200);
  assert.equal(upd.body.title, "Eng II");
  assert.equal(upd.body.name, "Bob"); 
});

test("US-2: DELETE /me/profile removes profile", async () => {
  const token = await login("delete@test.dev");
  
  await request(app)
    .post("/me/profile")
    .set("x-forwarded-proto", "https")
    .set("authorization", `Bearer ${token}`)
    .send({ name: "Delete User" });
    
  const deleteRes = await request(app)
    .delete("/me/profile")
    .set("x-forwarded-proto", "https")
    .set("authorization", `Bearer ${token}`);
  assert.equal(deleteRes.status, 204);
  
  const getRes = await request(app)
    .get("/me/profile")
    .set("x-forwarded-proto", "https")
    .set("authorization", `Bearer ${token}`);
  assert.equal(getRes.status, 404);
});

test("US-2: profile validation with long name fails", async () => {
  const token = await login("validation@test.dev");
  const longName = "a".repeat(61); 
  
  const res = await request(app)
    .post("/me/profile")
    .set("x-forwarded-proto", "https")
    .set("authorization", `Bearer ${token}`)
    .send({ name: longName });
    
  assert.equal(res.status, 422);
  assert.ok(res.body.errors.name.includes("≤ 60"));
});

test("US-2: profile with invalid URL fails validation", async () => {
  const token = await login("url@test.dev");
  
  const res = await request(app)
    .post("/me/profile")
    .set("x-forwarded-proto", "https")
    .set("authorization", `Bearer ${token}`)
    .send({ 
      name: "URL User",
      links: ["not-a-url", "https://valid.com"]
    });
    
  assert.equal(res.status, 422);
  assert.ok(res.body.errors.links.includes("invalid URL"));
});