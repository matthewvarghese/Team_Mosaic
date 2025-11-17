import { pool } from '../db/helpers.js';


export const AUDIT_ACTIONS = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  
  PROFILE_CREATE: 'profile_create',
  PROFILE_UPDATE: 'profile_update',
  PROFILE_DELETE: 'profile_delete',
  PROFILE_VIEW: 'profile_view',
  
  SKILL_CREATE: 'skill_create',
  SKILL_UPDATE: 'skill_update',
  SKILL_DELETE: 'skill_delete',
  
  TEAM_CREATE: 'team_create',
  TEAM_UPDATE: 'team_update',
  TEAM_DELETE: 'team_delete',
  TEAM_VIEW: 'team_view',

  MEMBER_ADD: 'member_add',
  MEMBER_UPDATE: 'member_update',
  MEMBER_REMOVE: 'member_remove',
  MEMBER_LIST: 'member_list',

  
  PROJECT_CREATE: 'project_create',
  PROJECT_UPDATE: 'project_update',
  PROJECT_DELETE: 'project_delete',
  PROJECT_VIEW: 'project_view',
  
  GAP_ANALYSIS_RUN: 'gap_analysis_run',
  GAP_ANALYSIS_EXPORT: 'gap_analysis_export',
  
  AUDIT_LOG_VIEW: 'audit_log_view',
  AUDIT_LOG_EXPORT: 'audit_log_export'
};


export const RESOURCE_TYPES = {
  USER: 'user',
  PROFILE: 'profile',
  SKILL: 'skill',
  TEAM: 'team',
  MEMBER: 'member',
  PROJECT: 'project',
  GAP_ANALYSIS: 'gap_analysis',
  AUDIT_LOG: 'audit_log'
};


export async function createAuditLog({
  userEmail,
  action,
  resourceType,
  resourceId = null,
  status = 'success',
  ipAddress = null,
  userAgent = null,
  requestMethod = null,
  requestPath = null,
  details = null,
  errorMessage = null
}) {
  try {
    const query = `
      INSERT INTO audit_logs (
        user_email, action, resource_type, resource_id, status,
        ip_address, user_agent, request_method, request_path,
        details, error_message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, timestamp
    `;
    
    const values = [
      userEmail,
      action,
      resourceType,
      resourceId,
      status,
      ipAddress,
      userAgent,
      requestMethod,
      requestPath,
      details ? JSON.stringify(details) : null,
      errorMessage
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Failed to create audit log:', error);
    return null;
  }
}


export function auditMiddleware(action, resourceType) {
  return async (req, res, next) => {
    const originalJson = res.json;
    const originalSend = res.send;
    
    let responseBody;
    let responseStatus = 200;
    
    res.json = function(data) {
      responseBody = data;
      responseStatus = res.statusCode;
      return originalJson.call(this, data);
    };
    
    res.send = function(data) {
      responseBody = data;
      responseStatus = res.statusCode;
      return originalSend.call(this, data);
    };
    
    next();
    
    res.on('finish', async () => {
      const userEmail = req.user?.email || null;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('user-agent');
      
      let resourceId = req.params.id || req.params.teamId || req.params.projectId;
      if (!resourceId && responseBody?.id) {
        resourceId = responseBody.id.toString();
      }
      
      const status = responseStatus >= 200 && responseStatus < 300 ? 'success' : 'failure';
      
      const details = {
        params: req.params,
        query: req.query,
        body: sanitizeRequestBody(req.body)
      };
      
      let errorMessage = null;
      if (status === 'failure' && typeof responseBody === 'object') {
        errorMessage = responseBody.error || responseBody.message || 'Unknown error';
      }
      
      await createAuditLog({
        userEmail,
        action,
        resourceType,
        resourceId,
        status,
        ipAddress,
        userAgent,
        requestMethod: req.method,
        requestPath: req.path,
        details,
        errorMessage
      });
    });
  };
}


function sanitizeRequestBody(body) {
  if (!body || typeof body !== 'object') return body;
  
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'accessToken'];
  
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
}


export async function logAudit(req, action, resourceType, resourceId, status = 'success', additionalDetails = {}) {
  const userEmail = req.user?.email || null;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('user-agent');
  
  await createAuditLog({
    userEmail,
    action,
    resourceType,
    resourceId: resourceId?.toString(),
    status,
    ipAddress,
    userAgent,
    requestMethod: req.method,
    requestPath: req.path,
    details: additionalDetails
  });
}