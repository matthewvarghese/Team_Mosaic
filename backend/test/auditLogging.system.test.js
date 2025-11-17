import { describe, it, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/index.js";
import { pool } from "../src/db/helpers.js";

describe("Audit Logging Tests (US-11)", () => {
  let userToken;

  async function cleanDatabase() {
    const tables = [
      'audit_logs',
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

    const userRes = await request(app)
      .post("/auth/login")
      .set("x-forwarded-proto", "https")
      .send({ providerCode: "dummy", email: "test@example.com" });
    userToken = userRes.body.token;
  });

  after(async () => {
    await cleanDatabase();
    await pool.end();
  });

  it("AUDIT-1: should log profile view action with user, action, and timestamp", async () => {
    await request(app)
      .post("/me/profile")
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${userToken}`)
      .send({ name: "Test User", title: "Engineer" });

    await request(app)
      .get("/me/profile")
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${userToken}`);

    const result = await pool.query(
      `SELECT * FROM audit_logs WHERE user_email = $1 AND action = $2`,
      ['test@example.com', 'profile_view']
    );

    assert.strictEqual(result.rows.length, 1);
    const log = result.rows[0];
    
    assert.strictEqual(log.user_email, 'test@example.com');
    
    assert.strictEqual(log.action, 'profile_view');
    
    assert.ok(log.timestamp);
    const timeDiff = Date.now() - new Date(log.timestamp).getTime();
    assert.ok(timeDiff < 60000); 
  });

  it("AUDIT-2: should log skill creation with complete details", async () => {
    await request(app)
      .post("/me/skills")
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${userToken}`)
      .send({ name: "JavaScript", level: 4 });

    const result = await pool.query(
      `SELECT * FROM audit_logs WHERE user_email = $1 AND action = $2`,
      ['test@example.com', 'skill_create']
    );

    assert.strictEqual(result.rows.length, 1);
    const log = result.rows[0];
    
    assert.strictEqual(log.user_email, 'test@example.com');
    assert.strictEqual(log.action, 'skill_create');
    assert.strictEqual(log.resource_type, 'skill');
    assert.strictEqual(log.status, 'success');
    assert.ok(log.timestamp);
  });

  it("AUDIT-3: should log both successful and failed operations", async () => {
    await request(app)
      .post("/me/skills")
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${userToken}`)
      .send({ name: "Python", level: 3 });

    await request(app)
      .post("/me/skills")
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${userToken}`)
      .send({ name: "Java", level: 99 });

    const successResult = await pool.query(
      `SELECT * FROM audit_logs WHERE user_email = $1 AND status = $2`,
      ['test@example.com', 'success']
    );
    assert.ok(successResult.rows.length >= 1);

    const failureResult = await pool.query(
      `SELECT * FROM audit_logs WHERE user_email = $1 AND status = $2`,
      ['test@example.com', 'failure']
    );
    assert.ok(failureResult.rows.length >= 1);
  });

  it("AUDIT-4: should prevent deletion of audit logs for compliance", async () => {
    await request(app)
      .post("/me/skills")
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${userToken}`)
      .send({ name: "React", level: 4 });

    try {
      await pool.query('DELETE FROM audit_logs WHERE user_email = $1', ['test@example.com']);
      assert.fail('Should not allow deletion of audit logs');
    } catch (error) {
      assert.ok(error.message.includes('cannot be deleted'));
    }

    const result = await pool.query(
      `SELECT COUNT(*) as count FROM audit_logs WHERE user_email = $1`,
      ['test@example.com']
    );
    assert.ok(parseInt(result.rows[0].count) > 0);
  });

  it("AUDIT-5: should prevent modification of audit logs for compliance", async () => {
    await request(app)
      .post("/me/skills")
      .set("x-forwarded-proto", "https")
      .set("authorization", `Bearer ${userToken}`)
      .send({ name: "TypeScript", level: 3 });

    const selectResult = await pool.query(
      `SELECT id, status FROM audit_logs WHERE user_email = $1 ORDER BY timestamp DESC LIMIT 1`,
      ['test@example.com']
    );
    
    assert.ok(selectResult.rows.length > 0);
    const logId = selectResult.rows[0].id;
    const originalStatus = selectResult.rows[0].status;

    try {
      await pool.query(
        'UPDATE audit_logs SET status = $1 WHERE id = $2',
        ['failure', logId]
      );
      assert.fail('Should not allow modification of audit logs');
    } catch (error) {
      assert.ok(error.message.includes('cannot be modified'));
    }

    const verifyResult = await pool.query(
      `SELECT status FROM audit_logs WHERE id = $1`,
      [logId]
    );
    assert.strictEqual(verifyResult.rows[0].status, originalStatus);
  });
});