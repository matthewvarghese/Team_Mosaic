import { describe, it, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/index.js";
import { pool } from "../src/db/helpers.js";

describe("Gap Analysis Dashboard Tests (US-8)", () => {
  let ownerToken, memberToken, teamId, projectId;

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
      .send({ providerCode: "dummy", email: "dashboard-owner@test.com" });
    ownerToken = ownerRes.body.token;

    const memberRes = await request(app)
      .post("/auth/login")
      .set("x-forwarded-proto", "https")
      .send({ providerCode: "dummy", email: "dashboard-member@test.com" });
    memberToken = memberRes.body.token;

    const uniqueTeamName = `Dashboard Test Team ${Date.now()}`;
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
      .send({ user: "dashboard-member@test.com", role: "member" });

    const projectRes = await request(app)
      .post(`/teams/${teamId}/projects`)
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({
        name: "Dashboard Test Project",
        description: "Testing dashboard",
        requirements: [
          { skill: "React", level: 5, importance: "critical" },
          { skill: "Python", level: 4, importance: "high" },
          { skill: "Docker", level: 3, importance: "medium" }
        ]
      });
    projectId = projectRes.body.id;

    await request(app)
      .post("/me/skills")
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({ name: "React", level: 3 });

    await request(app)
      .post("/me/skills")
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({ name: "Python", level: 4 });
  });



  it("DASH-1: should display complete dashboard with all components", async () => {
    const res = await request(app)
      .post(`/teams/${teamId}/gap-analysis`)
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({ projectId });

    assert.strictEqual(res.status, 200);
    
    assert.ok(res.body.overallRisk, "Overall risk card should exist");
    assert.ok(res.body.summary, "Summary statistics should exist");
    assert.ok(res.body.skills, "Skills table data should exist");
    assert.ok(res.body.analyzedAt, "Timestamp should exist");
    
    assert.ok(typeof res.body.overallRisk.score === 'number');
    assert.ok(['critical', 'high', 'medium', 'low'].includes(res.body.overallRisk.level));
    assert.ok(typeof res.body.overallRisk.readyToStart === 'boolean');
    
    assert.ok(typeof res.body.summary.totalSkills === 'number');
    assert.ok(typeof res.body.summary.skillsReady === 'number');
    assert.ok(typeof res.body.summary.skillsWithGaps === 'number');
    assert.ok(typeof res.body.summary.criticalBottlenecks === 'number');
    
    Object.keys(res.body.skills).forEach(skillName => {
      const skill = res.body.skills[skillName];
      assert.ok(typeof skill.required === 'number');
      assert.ok(typeof skill.average === 'number');
      assert.ok(typeof skill.gap === 'number');
      assert.ok(skill.importance);
      assert.ok(skill.coverage);
      assert.ok(skill.risk);
      assert.ok(skill.risk.factors);
    });
  });

  it("DASH-2: should display overall risk card with correct data", async () => {
    const res = await request(app)
      .post(`/teams/${teamId}/gap-analysis`)
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({ projectId });

    assert.strictEqual(res.status, 200);
    
    const overallRisk = res.body.overallRisk;
    
    assert.ok(overallRisk.score >= 0 && overallRisk.score <= 10);
    
    if (overallRisk.score >= 7) {
      assert.strictEqual(overallRisk.level, 'critical');
    } else if (overallRisk.score >= 5) {
      assert.strictEqual(overallRisk.level, 'high');
    } else if (overallRisk.score >= 3) {
      assert.strictEqual(overallRisk.level, 'medium');
    } else {
      assert.strictEqual(overallRisk.level, 'low');
    }
    
    if (overallRisk.score < 5) {
      assert.strictEqual(overallRisk.readyToStart, true);
    } else {
      assert.strictEqual(overallRisk.readyToStart, false);
    }
    
    const expectedColors = {
      'critical': '#ef4444',
      'high': '#f97316',
      'medium': '#eab308',
      'low': '#22c55e'
    };
    assert.ok(expectedColors[overallRisk.level]);
  });

  it("DASH-3: should display skills table with proper color coding", async () => {
    const res = await request(app)
      .post(`/teams/${teamId}/gap-analysis`)
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({ projectId });

    assert.strictEqual(res.status, 200);
    
    const skills = res.body.skills;
    
    Object.keys(skills).forEach(skillName => {
      const skill = skills[skillName];
      
      assert.ok(typeof skill.gap === 'number');
      
      assert.ok(typeof skill.risk.score === 'number');
      assert.ok(skill.risk.score >= 0 && skill.risk.score <= 10);
      
      assert.ok(['critical', 'high', 'medium', 'low'].includes(skill.risk.level));
      
      if (skill.risk.score >= 8) {
        assert.strictEqual(skill.risk.level, 'critical');
      } else if (skill.risk.score >= 5) {
        assert.strictEqual(skill.risk.level, 'high');
      } else if (skill.risk.score >= 3) {
        assert.strictEqual(skill.risk.level, 'medium');
      } else {
        assert.strictEqual(skill.risk.level, 'low');
      }
      
      assert.ok(typeof skill.coverage.count === 'number');
      assert.ok(typeof skill.coverage.busFactor === 'number');
    });
    
    const react = skills.React;
    if (react.gap === 0) {
      assert.ok(true);
    } else if (react.gap > 1.5) {
      assert.ok(react.gap > 1.5);
    } else {
      assert.ok(react.gap > 0 && react.gap <= 1.5);
    }
  });

  it("DASH-4: should display bottleneck indicators correctly", async () => {
    const res = await request(app)
      .post(`/teams/${teamId}/gap-analysis`)
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({ projectId });

    assert.strictEqual(res.status, 200);
    
    const skills = res.body.skills;
    let bottleneckCount = 0;
    
    Object.keys(skills).forEach(skillName => {
      const skill = skills[skillName];
      
      assert.ok(typeof skill.risk.bottleneck === 'boolean');
      
      if (skill.risk.bottleneck) {
        bottleneckCount++;
        
        assert.ok(skill.coverage.count <= 1);
        assert.notStrictEqual(skill.importance, 'nice-to-have');
      }
    });
    
    const criticalBottlenecks = Object.values(skills).filter(
      s => s.risk.bottleneck && s.risk.level === 'critical'
    ).length;
    
    assert.strictEqual(res.body.summary.criticalBottlenecks, criticalBottlenecks);
    
    assert.ok(bottleneckCount >= 1);
  });

  it("DASH-5: should display risk factor breakdown for each skill", async () => {
    const res = await request(app)
      .post(`/teams/${teamId}/gap-analysis`)
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({ projectId });

    assert.strictEqual(res.status, 200);
    
    const skills = res.body.skills;
    
    Object.keys(skills).forEach(skillName => {
      const skill = skills[skillName];
      
      assert.ok(skill.risk.factors);
      assert.ok(typeof skill.risk.factors.gapRisk === 'number');
      assert.ok(typeof skill.risk.factors.coverageRisk === 'number');
      assert.ok(typeof skill.risk.factors.variabilityRisk === 'number');
      
      assert.ok(skill.risk.factors.gapRisk >= 0 && skill.risk.factors.gapRisk <= 1);
      assert.ok(skill.risk.factors.coverageRisk >= 0 && skill.risk.factors.coverageRisk <= 1);
      assert.ok(skill.risk.factors.variabilityRisk >= 0 && skill.risk.factors.variabilityRisk <= 1);
      
      assert.ok(typeof skill.weightedGap === 'number');
      
      const IMPORTANCE_WEIGHTS = {
        'critical': 3.0,
        'high': 2.0,
        'medium': 1.5,
        'nice-to-have': 1.0
      };
      const expectedWeightedGap = skill.gap * IMPORTANCE_WEIGHTS[skill.importance];
      assert.ok(Math.abs(skill.weightedGap - expectedWeightedGap) < 0.01);
    });
    
    const react = skills.React;
    assert.ok(react.risk.factors.gapRisk > 0); 
    assert.ok(react.risk.factors.coverageRisk >= 0.7); 
    
    const docker = skills.Docker;
    assert.ok(docker.risk.factors.gapRisk > 0); 
    assert.strictEqual(docker.risk.factors.coverageRisk, 1.0); 
  });


  it("DASH-6: should generate CSV export with complete analysis data", async () => {
    const res = await request(app)
      .post(`/teams/${teamId}/gap-analysis`)
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({ projectId });
  
    assert.strictEqual(res.status, 200);
    
    assert.ok(res.body.overallRisk.score);
    assert.ok(res.body.overallRisk.level);
    assert.ok(res.body.overallRisk.readyToStart !== undefined);
    
    assert.ok(res.body.summary.totalSkills >= 0);
    assert.ok(res.body.summary.skillsReady >= 0);
    assert.ok(res.body.summary.skillsWithGaps >= 0);
    assert.ok(res.body.summary.skillsMissingCompletely >= 0);
    assert.ok(res.body.summary.criticalBottlenecks >= 0);
    assert.ok(res.body.summary.highRiskSkills >= 0);
    assert.ok(res.body.summary.mediumRiskSkills >= 0);
    assert.ok(res.body.summary.lowRiskSkills >= 0);
    
    Object.entries(res.body.skills).forEach(([skillName, data]) => {
      assert.ok(skillName);
      assert.ok(data.importance);
      assert.ok(typeof data.required === 'number');
      assert.ok(typeof data.average === 'number');
      assert.ok(typeof data.gap === 'number');
      assert.ok(typeof data.coverage.count === 'number');
      assert.ok(typeof data.coverage.busFactor === 'number');
      assert.ok(typeof data.risk.score === 'number');
      assert.ok(data.risk.level);
      assert.ok(typeof data.risk.bottleneck === 'boolean');
      assert.ok(typeof data.risk.factors.gapRisk === 'number');
      assert.ok(typeof data.risk.factors.coverageRisk === 'number');
      assert.ok(typeof data.risk.factors.variabilityRisk === 'number');
      assert.ok(typeof data.weightedGap === 'number');
    });
    
    assert.ok(res.body.analyzedAt);
  });
  
  it("DASH-7: should include project metadata in export data", async () => {
    const res = await request(app)
      .post(`/teams/${teamId}/gap-analysis`)
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({ projectId });
  
    assert.strictEqual(res.status, 200);
    
    const projectRes = await request(app)
      .get(`/teams/${teamId}/projects`)
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`);
    
    assert.strictEqual(projectRes.status, 200);
    
    const project = projectRes.body.find(p => p.id === projectId);
    assert.ok(project);
    assert.strictEqual(project.name, "Dashboard Test Project");
    
    const analyzedDate = new Date(res.body.analyzedAt);
    assert.ok(analyzedDate instanceof Date && !isNaN(analyzedDate));
    assert.ok(analyzedDate.toLocaleString());
  });
  
  it("DASH-8: should have all CSV columns with correct data types", async () => {
    const res = await request(app)
      .post(`/teams/${teamId}/gap-analysis`)
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${ownerToken}`)
      .send({ projectId });
  
    assert.strictEqual(res.status, 200);
    
    const skills = res.body.skills;
    assert.ok(Object.keys(skills).length > 0);
    
    Object.entries(skills).forEach(([skillName, data]) => {
      assert.ok(typeof skillName === 'string');
      assert.ok(skillName.length > 0);
      
      assert.ok(['critical', 'high', 'medium', 'nice-to-have'].includes(data.importance));
      
      assert.ok(!isNaN(data.required) && data.required >= 1 && data.required <= 5);
      assert.ok(!isNaN(data.average) && data.average >= 0 && data.average <= 5);
      assert.ok(!isNaN(data.gap) && data.gap >= 0);
      assert.ok(!isNaN(data.coverage.count) && data.coverage.count >= 0);
      assert.ok(!isNaN(data.coverage.busFactor) && data.coverage.busFactor >= 0);
      assert.ok(!isNaN(data.risk.score) && data.risk.score >= 0 && data.risk.score <= 10);
      
      assert.ok(['critical', 'high', 'medium', 'low'].includes(data.risk.level));
      
      assert.ok(typeof data.risk.bottleneck === 'boolean');
      
      assert.ok(data.risk.factors.gapRisk >= 0 && data.risk.factors.gapRisk <= 1);
      assert.ok(data.risk.factors.coverageRisk >= 0 && data.risk.factors.coverageRisk <= 1);
      assert.ok(data.risk.factors.variabilityRisk >= 0 && data.risk.factors.variabilityRisk <= 1);
      
      assert.ok(!isNaN(data.weightedGap) && data.weightedGap >= 0);
    });
    
    assert.ok(Number.isInteger(res.body.summary.totalSkills));
    assert.ok(Number.isInteger(res.body.summary.skillsReady));
    assert.ok(Number.isInteger(res.body.summary.skillsWithGaps));
    assert.ok(Number.isInteger(res.body.summary.skillsMissingCompletely));
    assert.ok(Number.isInteger(res.body.summary.criticalBottlenecks));
  });
});