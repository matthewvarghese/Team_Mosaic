import { describe, it, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/index.js";
import { pool } from "../src/db/helpers.js";

describe("Gap Analysis System Tests", () => {
  let ownerToken, memberToken, outsiderToken, teamId;

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

  beforeEach(async () => {
    await cleanDatabase();

    const ownerRes = await request(app)
      .post("/auth/login")
      .set("x-forwarded-proto", "https")
      .send({ providerCode: "dummy", email: "gap-owner@test.com" });
    ownerToken = ownerRes.body.token;

    const memberRes = await request(app)
      .post("/auth/login")
      .set("x-forwarded-proto", "https")
      .send({ providerCode: "dummy", email: "gap-member@test.com" });
    memberToken = memberRes.body.token;

    const outsiderRes = await request(app)
      .post("/auth/login")
      .set("x-forwarded-proto", "https")
      .send({ providerCode: "dummy", email: "gap-outsider@test.com" });
    outsiderToken = outsiderRes.body.token;

    const teamRes = await request(app)
      .post("/teams")
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({ name: "Gap Analysis Team" });
    teamId = teamRes.body.id;

    await request(app)
      .post(`/teams/${teamId}/members`)
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({ user: "gap-member@test.com", role: "member" });

    await request(app)
      .post("/me/skills")
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({ name: "JavaScript", level: 2 });

    await request(app)
      .post("/me/skills")
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({ name: "Python", level: 3 });

    await request(app)
      .post("/me/skills")
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${memberToken}`)
      .send({ name: "JavaScript", level: 4 });

    await request(app)
      .post("/me/skills")
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${memberToken}`)
      .send({ name: "Docker", level: 2 });
  });

  it("GAP-1: should compute gap analysis with averages", async () => {
    const res = await request(app)
      .post(`/teams/${teamId}/gap-analysis`)
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({
        requirements: [
          { skill: "JavaScript", level: 4, importance: "medium" },
          { skill: "Python", level: 5, importance: "medium" },
          { skill: "Docker", level: 3, importance: "medium" }
        ]
      });

    assert.strictEqual(res.status, 200);
    assert.ok(res.body.skills);
    assert.strictEqual(res.body.skills.JavaScript.required, 4);
    assert.strictEqual(res.body.skills.JavaScript.average, 3);
    assert.strictEqual(res.body.skills.JavaScript.gap, 1);
    assert.strictEqual(res.body.skills.Python.required, 5);
    assert.strictEqual(res.body.skills.Python.average, 3);
    assert.strictEqual(res.body.skills.Python.gap, 2);
    assert.strictEqual(res.body.skills.Docker.required, 3);
    assert.strictEqual(res.body.skills.Docker.average, 2);
    assert.strictEqual(res.body.skills.Docker.gap, 1);
  });

  it("GAP-2: should show zero average for missing skills", async () => {
    const res = await request(app)
      .post(`/teams/${teamId}/gap-analysis`)
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({
        requirements: [{ skill: "Node.js", level: 3, importance: "medium" }]
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.skills["Node.js"].required, 3);
    assert.strictEqual(res.body.skills["Node.js"].average, 0);
    assert.strictEqual(res.body.skills["Node.js"].gap, 3);
  });

  it("GAP-3: should reject invalid skill level", async () => {
    const res = await request(app)
      .post(`/teams/${teamId}/gap-analysis`)
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({
        requirements: [{ skill: "React", level: 7 }]
      });

    assert.strictEqual(res.status, 422);
    assert.ok(res.body.errors["requirements[0].level"]);
  });

  it("GAP-4: should reject empty requirements array", async () => {
    const res = await request(app)
      .post(`/teams/${teamId}/gap-analysis`)
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({ requirements: [] });

    assert.strictEqual(res.status, 422);
    assert.ok(res.body.errors.requirements);
  });

  it("GAP-5: should reject missing skill name", async () => {
    const res = await request(app)
      .post(`/teams/${teamId}/gap-analysis`)
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({
        requirements: [{ level: 3 }]
      });

    assert.strictEqual(res.status, 422);
    assert.ok(res.body.errors["requirements[0].skill"]);
  });

  it("GAP-6: should forbid non-team-members from running analysis", async () => {
    const res = await request(app)
      .post(`/teams/${teamId}/gap-analysis`)
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${outsiderToken}`)
      .send({
        requirements: [{ skill: "JavaScript", level: 3 }]
      });

    assert.strictEqual(res.status, 403);
    assert.ok(res.body.error.includes("Not a team member"));
  });

  it("GAP-7: should return 404 for non-existent team", async () => {
    const res = await request(app)
      .post("/teams/999/gap-analysis")
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({
        requirements: [{ skill: "JavaScript", level: 3 }]
      });

    assert.strictEqual(res.status, 404);
    assert.ok(res.body.error.includes("Team not found"));
  });
});