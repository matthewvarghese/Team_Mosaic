import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/index.js";

async function login(email = "skills@test.dev") {
  const res = await request(app)
    .post("/auth/login")
    .set("x-forwarded-proto", "https")
    .send({ providerCode: "dummy", email });
  return res.body.token;
}

test("US-3: skills empty", async () => {
  const token = await login("empty@test.dev");
  const res = await request(app)
    .get("/me/skills")
    .set("x-forwarded-proto", "https")
    .set("authorization", `Bearer ${token}`);
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, []);
});

test("US-3: adds skill", async () => {
  const token = await login("add@test.dev");
  const res = await request(app)
    .post("/me/skills")
    .set("x-forwarded-proto", "https")
    .set("authorization", `Bearer ${token}`)
    .send({ name: "JavaScript", level: 3 });
  assert.equal(res.status, 201);
  assert.ok(res.body.id);
  assert.equal(res.body.name, "JavaScript");
  assert.equal(res.body.level, 3);
});

test("US-3: updates skill level", async () => {
  const token = await login("update@test.dev");
  
  const create = await request(app)
    .post("/me/skills")
    .set("x-forwarded-proto", "https")
    .set("authorization", `Bearer ${token}`)
    .send({ name: "Python", level: 2 });
  const id = create.body.id;

  const upd = await request(app)
    .put(`/me/skills/${id}`)
    .set("x-forwarded-proto", "https")
    .set("authorization", `Bearer ${token}`)
    .send({ level: 5 });
  assert.equal(upd.status, 200);
  assert.equal(upd.body.level, 5);
  assert.equal(upd.body.name, "Python");
});

test("US-3:  removes skill", async () => {
  const token = await login("delete@test.dev");
  
  const create = await request(app)
    .post("/me/skills")
    .set("x-forwarded-proto", "https")
    .set("authorization", `Bearer ${token}`)
    .send({ name: "Go", level: 4 });
  const id = create.body.id;

  const del = await request(app)
    .delete(`/me/skills/${id}`)
    .set("x-forwarded-proto", "https")
    .set("authorization", `Bearer ${token}`);
  assert.equal(del.status, 204);
  
  const verify = await request(app)
    .get("/me/skills")
    .set("x-forwarded-proto", "https")
    .set("authorization", `Bearer ${token}`);
  assert.equal(verify.body.length, 0);
});

test("US-3: rejects invalid level", async () => {
  const token = await login("validate@test.dev");
  const res = await request(app)
    .post("/me/skills")
    .set("x-forwarded-proto", "https")
    .set("authorization", `Bearer ${token}`)
    .send({ name: "Rust", level: 7 });
  assert.equal(res.status, 422);
  assert.ok(res.body.errors.level);
});

test("US-3: rejects missing name", async () => {
  const token = await login("noname@test.dev");
  const res = await request(app)
    .post("/me/skills")
    .set("x-forwarded-proto", "https")
    .set("authorization", `Bearer ${token}`)
    .send({ level: 3 });
  assert.equal(res.status, 422);
  assert.ok(res.body.errors.name);
});