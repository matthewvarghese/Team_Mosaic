import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/index.js";

test("US-1: GET /auth/providers returns provider list", async () => {
  const res = await request(app)
    .get("/auth/providers")
    .set("x-forwarded-proto", "https");
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.providers));
  assert.ok(res.body.providers.includes("dummy"));
});

test("US-1: POST /auth/logout returns 204", async () => {
  const res = await request(app)
    .post("/auth/logout")
    .set("x-forwarded-proto", "https");
  assert.equal(res.status, 204);
});