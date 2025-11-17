import express from 'express';
import { requireAuth } from "../middleware/requireAuth.js";
import { pool } from '../db/helpers.js';
import { auditMiddleware, AUDIT_ACTIONS, RESOURCE_TYPES } from '../middleware/auditLogger.js';

const router = express.Router();

function requireAdmin(req, res, next) {

  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}


router.get(
  '/admin/audit-logs',
  requireAuth,
  requireAdmin,
  auditMiddleware(AUDIT_ACTIONS.AUDIT_LOG_VIEW, RESOURCE_TYPES.AUDIT_LOG),
  async (req, res) => {
    try {
      const {
        user_email,
        action,
        resource_type,
        status,
        start_date,
        end_date,
        page = 1,
        limit = 50
      } = req.query;
      
      const conditions = [];
      const values = [];
      let paramCounter = 1;
      
      if (user_email) {
        conditions.push(`user_email = $${paramCounter++}`);
        values.push(user_email);
      }
      
      if (action) {
        conditions.push(`action = $${paramCounter++}`);
        values.push(action);
      }
      
      if (resource_type) {
        conditions.push(`resource_type = $${paramCounter++}`);
        values.push(resource_type);
      }
      
      if (status) {
        conditions.push(`status = $${paramCounter++}`);
        values.push(status);
      }
      
      if (start_date) {
        conditions.push(`timestamp >= $${paramCounter++}`);
        values.push(start_date);
      }
      
      if (end_date) {
        conditions.push(`timestamp <= $${paramCounter++}`);
        values.push(end_date);
      }
      
      const whereClause = conditions.length > 0 
        ? `WHERE ${conditions.join(' AND ')}`
        : '';
      
      const countQuery = `SELECT COUNT(*) FROM audit_logs ${whereClause}`;
      const countResult = await pool.query(countQuery, values);
      const total = parseInt(countResult.rows[0].count);
      
      const offset = (page - 1) * limit;
      values.push(limit, offset);
      
      const query = `
        SELECT 
          id,
          timestamp,
          user_email,
          action,
          resource_type,
          resource_id,
          status,
          ip_address,
          user_agent,
          request_method,
          request_path,
          details,
          error_message
        FROM audit_logs
        ${whereClause}
        ORDER BY timestamp DESC
        LIMIT $${paramCounter++} OFFSET $${paramCounter++}
      `;
      
      const result = await pool.query(query, values);
      
      res.json({
        logs: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);


router.get(
  '/admin/audit-stats',
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const { days = 30 } = req.query;
      
      const totalQuery = `
        SELECT COUNT(*) as total
        FROM audit_logs
        WHERE timestamp >= NOW() - INTERVAL '${days} days'
      `;
      const totalResult = await pool.query(totalQuery);
      
      const statusQuery = `
        SELECT status, COUNT(*) as count
        FROM audit_logs
        WHERE timestamp >= NOW() - INTERVAL '${days} days'
        GROUP BY status
      `;
      const statusResult = await pool.query(statusQuery);
      
      const actionsQuery = `
        SELECT action, COUNT(*) as count
        FROM audit_logs
        WHERE timestamp >= NOW() - INTERVAL '${days} days'
        GROUP BY action
        ORDER BY count DESC
        LIMIT 10
      `;
      const actionsResult = await pool.query(actionsQuery);
      
      const usersQuery = `
        SELECT user_email, COUNT(*) as count
        FROM audit_logs
        WHERE timestamp >= NOW() - INTERVAL '${days} days'
          AND user_email IS NOT NULL
        GROUP BY user_email
        ORDER BY count DESC
        LIMIT 10
      `;
      const usersResult = await pool.query(usersQuery);
      
      const activityQuery = `
        SELECT 
          DATE(timestamp) as date,
          COUNT(*) as count
        FROM audit_logs
        WHERE timestamp >= NOW() - INTERVAL '${days} days'
        GROUP BY DATE(timestamp)
        ORDER BY date DESC
      `;
      const activityResult = await pool.query(activityQuery);
      
      res.json({
        total: parseInt(totalResult.rows[0].total),
        byStatus: statusResult.rows,
        topActions: actionsResult.rows,
        topUsers: usersResult.rows,
        dailyActivity: activityResult.rows
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);


router.get(
  '/admin/audit-logs/export',
  requireAuth,
  requireAdmin,
  auditMiddleware(AUDIT_ACTIONS.AUDIT_LOG_EXPORT, RESOURCE_TYPES.AUDIT_LOG),
  async (req, res) => {
    try {
      const { start_date, end_date } = req.query;
      
      const conditions = [];
      const values = [];
      let paramCounter = 1;
      
      if (start_date) {
        conditions.push(`timestamp >= $${paramCounter++}`);
        values.push(start_date);
      }
      
      if (end_date) {
        conditions.push(`timestamp <= $${paramCounter++}`);
        values.push(end_date);
      }
      
      const whereClause = conditions.length > 0 
        ? `WHERE ${conditions.join(' AND ')}`
        : '';
      
      const query = `
        SELECT *
        FROM audit_logs
        ${whereClause}
        ORDER BY timestamp DESC
      `;
      
      const result = await pool.query(query, values);
      
      let csv = 'ID,Timestamp,User Email,Action,Resource Type,Resource ID,Status,IP Address,Request Method,Request Path,Error Message\n';
      
      for (const log of result.rows) {
        csv += `${log.id},"${log.timestamp}","${log.user_email || ''}","${log.action}","${log.resource_type}","${log.resource_id || ''}","${log.status}","${log.ip_address || ''}","${log.request_method || ''}","${log.request_path || ''}","${log.error_message || ''}"\n`;
      }
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csv);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;