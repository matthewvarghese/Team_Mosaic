import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/index.js";
import { teams, projects, teamNames, skillsByUser } from "../src/db/memory.js";

describe("Project Management System Tests", () => {
  let ownerToken, memberToken, outsiderToken, teamId;

  beforeEach(async () => {
    teams.clear();
    teamNames.clear();
    projects.clear();
    skillsByUser.clear();

    const ownerRes = await request(app)
      .post("/auth/login")
      .set("x-forwarded-proto", "https")
      .send({ providerCode: "dummy", email: "proj-owner@test.com" });
    ownerToken = ownerRes.body.token;

    const memberRes = await request(app)
      .post("/auth/login")
      .set("x-forwarded-proto", "https")
      .send({ providerCode: "dummy", email: "proj-member@test.com" });
    memberToken = memberRes.body.token;

    const outsiderRes = await request(app)
      .post("/auth/login")
      .set("x-forwarded-proto", "https")
      .send({ providerCode: "dummy", email: "proj-outsider@test.com" });
    outsiderToken = outsiderRes.body.token;

    const teamRes = await request(app)
      .post("/teams")
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({ name: "Project Test Team" });
    teamId = teamRes.body.id;

    await request(app)
      .post(`/teams/${teamId}/members`)
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({ user: "proj-member@test.com", role: "member" });
  });

  it("PROJ-1: owner creates project with requirements", async () => {
    const res = await request(app)
      .post(`/teams/${teamId}/projects`)
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({
        name: "E-Commerce Platform",
        description: "Online shopping system",
        requirements: [
          { skill: "React", level: 4 },
          { skill: "Node.js", level: 3 }
        ]
      });

    assert.strictEqual(res.status, 201);
    assert.ok(res.body.id);
    assert.strictEqual(res.body.name, "E-Commerce Platform");
    assert.strictEqual(res.body.teamId, teamId);
    assert.strictEqual(res.body.requirements.length, 2);
  });

  it("PROJ-2: lists team projects", async () => {
    await request(app)
      .post(`/teams/${teamId}/projects`)
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({
        name: "Project Alpha",
        requirements: [{ skill: "Python", level: 3 }]
      });

    const res = await request(app)
      .get(`/teams/${teamId}/projects`)
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`);

    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body));
    assert.strictEqual(res.body.length, 1);
    assert.strictEqual(res.body[0].name, "Project Alpha");
  });

  it("PROJ-3: gets specific project by ID", async () => {
    const createRes = await request(app)
      .post(`/teams/${teamId}/projects`)
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({
        name: "Project Beta",
        requirements: [{ skill: "Java", level: 4 }]
      });

    const projectId = createRes.body.id;

    const res = await request(app)
      .get(`/teams/${teamId}/projects/${projectId}`)
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.id, projectId);
    assert.strictEqual(res.body.name, "Project Beta");
  });

  it("PROJ-4: owner updates project", async () => {
    const createRes = await request(app)
      .post(`/teams/${teamId}/projects`)
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({
        name: "Original Name",
        requirements: [{ skill: "Go", level: 2 }]
      });

    const projectId = createRes.body.id;

    const res = await request(app)
      .put(`/teams/${teamId}/projects/${projectId}`)
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({
        name: "Updated Name",
        description: "New description"
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.name, "Updated Name");
    assert.strictEqual(res.body.description, "New description");
  });

  it("PROJ-5: owner deletes project", async () => {
    const createRes = await request(app)
      .post(`/teams/${teamId}/projects`)
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({
        name: "To Be Deleted",
        requirements: [{ skill: "Rust", level: 3 }]
      });

    const projectId = createRes.body.id;

    const deleteRes = await request(app)
      .delete(`/teams/${teamId}/projects/${projectId}`)
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`);

    assert.strictEqual(deleteRes.status, 204);

    const getRes = await request(app)
      .get(`/teams/${teamId}/projects/${projectId}`)
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`);

    assert.strictEqual(getRes.status, 404);
  });

  it("PROJ-6: member cannot create project", async () => {
    const res = await request(app)
      .post(`/teams/${teamId}/projects`)
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${memberToken}`)
      .send({
        name: "Unauthorized Project",
        requirements: [{ skill: "TypeScript", level: 3 }]
      });

    assert.strictEqual(res.status, 403);
    assert.ok(res.body.error.includes("Owner role required"));
  });

  it("PROJ-7: member can view projects", async () => {
    await request(app)
      .post(`/teams/${teamId}/projects`)
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({
        name: "Viewable Project",
        requirements: [{ skill: "Docker", level: 2 }]
      });

    const res = await request(app)
      .get(`/teams/${teamId}/projects`)
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${memberToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.length, 1);
  });

  it("PROJ-8: rejects project without name", async () => {
    const res = await request(app)
      .post(`/teams/${teamId}/projects`)
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({
        requirements: [{ skill: "Python", level: 3 }]
      });

    assert.strictEqual(res.status, 422);
    assert.ok(res.body.errors.name);
  });

  it("PROJ-9: rejects project with empty requirements", async () => {
    const res = await request(app)
      .post(`/teams/${teamId}/projects`)
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({
        name: "No Requirements Project",
        requirements: []
      });

    assert.strictEqual(res.status, 422);
    assert.ok(res.body.errors.requirements);
  });

  it("PROJ-10: rejects invalid skill level in requirements", async () => {
    const res = await request(app)
      .post(`/teams/${teamId}/projects`)
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({
        name: "Invalid Level Project",
        requirements: [{ skill: "Ruby", level: 7 }]
      });

    assert.strictEqual(res.status, 422);
    assert.ok(res.body.errors["requirements[0].level"]);
  });

  it("PROJ-11: gap analysis uses stored project requirements", async () => {
    const projRes = await request(app)
      .post(`/teams/${teamId}/projects`)
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({
        name: "Analysis Project",
        requirements: [
          { skill: "JavaScript", level: 4 },
          { skill: "Python", level: 3 }
        ]
      });

    const projectId = projRes.body.id;

    await request(app)
      .post("/me/skills")
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({ name: "JavaScript", level: 2 });

    const res = await request(app)
      .post(`/teams/${teamId}/gap-analysis`)
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({ projectId });

    assert.strictEqual(res.status, 200);
    assert.ok(res.body.JavaScript);
    assert.strictEqual(res.body.JavaScript.required, 4);
    assert.strictEqual(res.body.JavaScript.average, 2);
    assert.strictEqual(res.body.JavaScript.gap, 2);
  });

  it("PROJ-12: non-member cannot access team projects", async () => {
    const res = await request(app)
      .get(`/teams/${teamId}/projects`)
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${outsiderToken}`);

    assert.strictEqual(res.status, 403);
    assert.ok(res.body.error.includes("Not a team member"));
  });
});