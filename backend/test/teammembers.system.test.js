import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/index.js";

async function login(email) {
  const res = await request(app)
    .post("/auth/login")
    .set("x-forwarded-proto", "https")
    .send({ providerCode: "dummy", email });
  return res.body.token;
}

async function createTeam(ownerEmail, name) {
  const token = await login(ownerEmail);
  const res = await request(app)
    .post("/teams")
    .set("x-forwarded-proto", "https")
    .set("authorization", `Bearer ${token}`)
    .send({ name, description: "Test team" });
  return { id: res.body.id, token };
}

test("US-5: lists team members", async () => {
  const { id, token } = await createTeam("list@test.dev", "List Team");
  
  const res = await request(app)
    .get(`/teams/${id}/members`)
    .set("x-forwarded-proto", "https")
    .set("authorization", `Bearer ${token}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.length, 1);
  assert.equal(res.body[0].user, "list@test.dev");
  assert.equal(res.body[0].role, "owner");
});

test("US-5: Owner adds member ", async () => {
  const { id, token } = await createTeam("addowner@test.dev", "Add Team");
  
  const res = await request(app)
    .post(`/teams/${id}/members`)
    .set("x-forwarded-proto", "https")
    .set("authorization", `Bearer ${token}`)
    .send({ user: "newmember@test.dev", role: "member" });
  assert.equal(res.status, 201);
  assert.equal(res.body.length, 2);
});

test("US-5: non owner cant add members", async () => {
  const { id } = await createTeam("owner2@test.dev", "Restricted Team");
  const memberToken = await login("notowner@test.dev");
  
  const res = await request(app)
    .post(`/teams/${id}/members`)
    .set("x-forwarded-proto", "https")
    .set("authorization", `Bearer ${memberToken}`)
    .send({ user: "hacker@test.dev", role: "member" });
  assert.equal(res.status, 403);
});

test("US-5: no duplicate member", async () => {
  const { id, token } = await createTeam("dup@test.dev", "Dup Team");
  
  await request(app)
    .post(`/teams/${id}/members`)
    .set("x-forwarded-proto", "https")
    .set("authorization", `Bearer ${token}`)
    .send({ user: "first@test.dev", role: "member" });
  
  const dup = await request(app)
    .post(`/teams/${id}/members`)
    .set("x-forwarded-proto", "https")
    .set("authorization", `Bearer ${token}`)
    .send({ user: "first@test.dev", role: "member" });
  assert.equal(dup.status, 409);
});

test("US-5: changes role", async () => {
  const { id, token } = await createTeam("role@test.dev", "Role Team");
  
  await request(app)
    .post(`/teams/${id}/members`)
    .set("x-forwarded-proto", "https")
    .set("authorization", `Bearer ${token}`)
    .send({ user: "member@test.dev", role: "member" });
  
  const res = await request(app)
    .put(`/teams/${id}/members/${encodeURIComponent("member@test.dev")}`)
    .set("x-forwarded-proto", "https")
    .set("authorization", `Bearer ${token}`)
    .send({ role: "owner" });
  assert.equal(res.status, 200);
  assert.equal(res.body.role, "owner");
});

test("US-5: cant remove last owner", async () => {
  const { id, token } = await createTeam("last@test.dev", "Last Owner Team");
  
  const res = await request(app)
    .delete(`/teams/${id}/members/${encodeURIComponent("last@test.dev")}`)
    .set("x-forwarded-proto", "https")
    .set("authorization", `Bearer ${token}`);
  assert.equal(res.status, 409);
  assert.ok(res.body.error.includes("last owner"));
});

test("US-5: removes member", async () => {
  const { id, token } = await createTeam("remove@test.dev", "Remove Team");
  
  await request(app)
    .post(`/teams/${id}/members`)
    .set("x-forwarded-proto", "https")
    .set("authorization", `Bearer ${token}`)
    .send({ user: "temp@test.dev", role: "member" });
  
  const res = await request(app)
    .delete(`/teams/${id}/members/${encodeURIComponent("temp@test.dev")}`)
    .set("x-forwarded-proto", "https")
    .set("authorization", `Bearer ${token}`);
  assert.equal(res.status, 204);
});