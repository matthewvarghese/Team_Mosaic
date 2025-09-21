import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/index.js";

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
  assert.equal(res.body.owner, "u2@test.dev");
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
