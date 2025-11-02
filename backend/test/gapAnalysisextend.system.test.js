import { describe, it, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/index.js";
import { pool } from "../src/db/helpers.js";

describe("Enhanced Gap Analysis Tests (US-7)", () => {
  let ownerToken, memberToken, member2Token, outsiderToken, teamId;

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
      .send({ providerCode: "dummy", email: "enhanced-owner@test.com" });
    ownerToken = ownerRes.body.token;

    const memberRes = await request(app)
      .post("/auth/login")
      .set("x-forwarded-proto", "https")
      .send({ providerCode: "dummy", email: "enhanced-member1@test.com" });
    memberToken = memberRes.body.token;

    const member2Res = await request(app)
      .post("/auth/login")
      .set("x-forwarded-proto", "https")
      .send({ providerCode: "dummy", email: "enhanced-member2@test.com" });
    member2Token = member2Res.body.token;

    const outsiderRes = await request(app)
      .post("/auth/login")
      .set("x-forwarded-proto", "https")
      .send({ providerCode: "dummy", email: "enhanced-outsider@test.com" });
    outsiderToken = outsiderRes.body.token;

    const uniqueTeamName = `Enhanced Gap Team ${Date.now()}`;
    const teamRes = await request(app)
      .post("/teams")
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({ name: uniqueTeamName });
    teamId = teamRes.body.id;

    await request(app)
      .post(`/teams/${teamId}/members`)
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({ user: "enhanced-member1@test.com", role: "member" });

    await request(app)
      .post(`/teams/${teamId}/members`)
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({ user: "enhanced-member2@test.com", role: "member" });
  });

 

  it("GAP-8: should apply critical importance weight (3.0x) to risk calculation", async () => {
    await request(app)
      .post("/me/skills")
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({ name: "React", level: 2 });

    const res = await request(app)
      .post(`/teams/${teamId}/gap-analysis`)
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({
        requirements: [
          { skill: "React", level: 5, importance: "critical" }
        ]
      });

    assert.strictEqual(res.status, 200);
    assert.ok(res.body.skills.React.risk);
    assert.strictEqual(res.body.skills.React.importance, "critical");
    assert.ok(res.body.skills.React.risk.score >= 8); 
    assert.ok(["critical", "high"].includes(res.body.skills.React.risk.level));
  });

  it("GAP-9: should detect bottleneck when only one member has critical skill", async () => {
    await request(app)
      .post("/me/skills")
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({ name: "Kubernetes", level: 4 });

    const res = await request(app)
      .post(`/teams/${teamId}/gap-analysis`)
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({
        requirements: [
          { skill: "Kubernetes", level: 4, importance: "critical" }
        ]
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.skills.Kubernetes.coverage.count, 1);
    assert.strictEqual(res.body.skills.Kubernetes.risk.bottleneck, true);
    assert.strictEqual(res.body.summary.criticalBottlenecks, 1);
  });

  it("GAP-10: should calculate lower coverage risk with multiple team members", async () => {
    await request(app)
      .post("/me/skills")
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({ name: "Python", level: 4 });

    await request(app)
      .post("/me/skills")
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${memberToken}`)
      .send({ name: "Python", level: 4 });

    const res = await request(app)
      .post(`/teams/${teamId}/gap-analysis`)
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({
        requirements: [
          { skill: "Python", level: 4, importance: "medium" }
        ]
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.skills.Python.coverage.count, 2);
    assert.ok(res.body.skills.Python.risk.factors.coverageRisk <= 0.3); 
  });

  it("GAP-11: should show gap=0 but still have risk due to bus factor", async () => {
    await request(app)
      .post("/me/skills")
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({ name: "Go", level: 4 });

    const res = await request(app)
      .post(`/teams/${teamId}/gap-analysis`)
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({
        requirements: [
          { skill: "Go", level: 4, importance: "high" }
        ]
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.skills.Go.gap, 0); 
    assert.strictEqual(res.body.skills.Go.coverage.count, 1);
    assert.ok(res.body.skills.Go.risk.score > 0); 
    assert.strictEqual(res.body.skills.Go.risk.bottleneck, true);
  });

  it("GAP-12: should calculate weighted overall risk with mixed importance", async () => {
    await request(app)
      .post("/me/skills")
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({ name: "JavaScript", level: 5 });

    await request(app)
      .post("/me/skills")
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({ name: "CSS", level: 3 });

    const res = await request(app)
      .post(`/teams/${teamId}/gap-analysis`)
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({
        requirements: [
          { skill: "JavaScript", level: 5, importance: "critical" },
          { skill: "CSS", level: 3, importance: "nice-to-have" },
          { skill: "Docker", level: 4, importance: "medium" }
        ]
      });

    assert.strictEqual(res.status, 200);
    assert.ok(res.body.overallRisk);
    assert.ok(typeof res.body.overallRisk.score === 'number');
    assert.ok(res.body.overallRisk.score >= 0 && res.body.overallRisk.score <= 10);
    assert.ok(['critical', 'high', 'medium', 'low'].includes(res.body.overallRisk.level));
    assert.ok(typeof res.body.overallRisk.readyToStart === 'boolean');
  });

  it("GAP-13: should calculate variability risk for inconsistent skill levels", async () => {
    await request(app)
      .post("/me/skills")
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({ name: "Java", level: 2 });

    await request(app)
      .post("/me/skills")
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${memberToken}`)
      .send({ name: "Java", level: 5 });

    const res = await request(app)
      .post(`/teams/${teamId}/gap-analysis`)
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({
        requirements: [
          { skill: "Java", level: 4, importance: "medium" }
        ]
      });

    assert.strictEqual(res.status, 200);
    assert.ok(res.body.skills.Java.risk.factors.variabilityRisk > 0); 
    assert.strictEqual(res.body.skills.Java.coverage.levels.length, 2);
  });

  it("GAP-14: should reject invalid importance value", async () => {
    const res = await request(app)
      .post(`/teams/${teamId}/gap-analysis`)
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({
        requirements: [
          { skill: "React", level: 4, importance: "super-critical" }
        ]
      });

    assert.strictEqual(res.status, 422);
    assert.ok(res.body.errors["requirements[0].importance"]);
  });

  it("GAP-15: should load importance from stored project requirements", async () => {
    const projectRes = await request(app)
      .post(`/teams/${teamId}/projects`)
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({
        name: "Test Project",
        description: "Test",
        requirements: [
          { skill: "React", level: 5, importance: "critical" },
          { skill: "Node.js", level: 4, importance: "high" }
        ]
      });

    const projectId = projectRes.body.id;

    await request(app)
      .post("/me/skills")
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({ name: "React", level: 3 });

    const res = await request(app)
      .post(`/teams/${teamId}/gap-analysis`)
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({ projectId });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.skills.React.importance, "critical");
    assert.strictEqual(res.body.skills["Node.js"].importance, "high");
  });

  it("GAP-16: should not flag nice-to-have missing skills as bottlenecks", async () => {
    const res = await request(app)
      .post(`/teams/${teamId}/gap-analysis`)
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({
        requirements: [
          { skill: "Photoshop", level: 3, importance: "nice-to-have" }
        ]
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.skills.Photoshop.coverage.count, 0);
    assert.strictEqual(res.body.skills.Photoshop.risk.bottleneck, false); 
  });

  it("GAP-17: mark project not ready when overall risk >= 5", async () => {
    const res = await request(app)
      .post(`/teams/${teamId}/gap-analysis`)
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({
        requirements: [
          { skill: "Rust", level: 5, importance: "critical" },
          { skill: "WebAssembly", level: 4, importance: "critical" }
        ]
      });

    assert.strictEqual(res.status, 200);
    assert.ok(res.body.overallRisk.score >= 5);
    assert.strictEqual(res.body.overallRisk.readyToStart, false);
  });

  it("GAP-18: provide accurate summary statistics", async () => {
    await request(app)
      .post("/me/skills")
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({ name: "JavaScript", level: 5 });

    await request(app)
      .post("/me/skills")
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({ name: "Python", level: 3 });

    const res = await request(app)
      .post(`/teams/${teamId}/gap-analysis`)
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({
        requirements: [
          { skill: "JavaScript", level: 5, importance: "critical" },
          { skill: "Python", level: 4, importance: "high" },
          { skill: "Docker", level: 3, importance: "medium" }
        ]
      });

      assert.strictEqual(res.status, 200);
      assert.ok(res.body.summary);
      assert.strictEqual(res.body.summary.totalSkills, 3);
      
      assert.strictEqual(res.body.skills.JavaScript.gap, 0); 
      assert.strictEqual(res.body.skills.Python.gap, 1); 
      assert.strictEqual(res.body.skills.Docker.gap, 3); 
      
      assert.strictEqual(res.body.summary.skillsReady, 1);
      assert.strictEqual(res.body.summary.skillsWithGaps, 2);
      assert.strictEqual(res.body.summary.skillsMissingCompletely, 1); 
      assert.ok(typeof res.body.summary.criticalBottlenecks === 'number');
      assert.ok(typeof res.body.summary.highRiskSkills === 'number');
      assert.ok(typeof res.body.summary.mediumRiskSkills === 'number');
      assert.ok(typeof res.body.summary.lowRiskSkills === 'number');
  });
});