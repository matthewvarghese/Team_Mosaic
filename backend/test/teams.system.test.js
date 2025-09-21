import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/index.js";

async function login(email = "teams@test.dev") {
  const res = await request(app)
    .post("/auth/login")
    .set("x-forwarded-proto", "https")
    .send({ providerCode: "dummy", email });
  return res.body.token;
}

test("US-4: POST /teams creates team ", async () => {
  const token = await login("owner@test.dev");
  const res = await request(app)
    .post("/teams")
    .set("x-forwarded-proto", "https")
    .set("authorization", `Bearer ${token}`)
    .send({ name: "Alpha", description: "First team" });
  assert.equal(res.status, 201);
  assert.match(res.headers.location, /^\/teams\/\d+$/);
  assert.equal(res.body.name, "Alpha");
  assert.equal(res.body.members[0].user, "owner@test.dev");
  assert.equal(res.body.members[0].role, "owner");
});

test("US-4: POST /teams duplicate name", async () => {
  const token = await login("dup@test.dev");
  await request(app)
    .post("/teams")
    .set("x-forwarded-proto", "https")
    .set("authorization", `Bearer ${token}`)
    .send({ name: "Beta" })
    .expect(201);
  const dup = await request(app)
    .post("/teams")
    .set("x-forwarded-proto", "https")
    .set("authorization", `Bearer ${token}`)
    .send({ name: "beta" }); 
  assert.equal(dup.status, 409);
  assert.equal(dup.body.error, "Team name already exists");
});

test("US-4: GET teamid not found ", async () => {
  const token = await login("nf@test.dev");
  const res = await request(app)
    .get("/teams/9999")
    .set("x-forwarded-proto", "https")
    .set("authorization", `Bearer ${token}`);
  assert.equal(res.status, 404);
  assert.equal(res.body.error, "Team not found");
});
