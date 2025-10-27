const { query } = require('../helpers');


async function createUser(email) {
  const result = await query(
    'INSERT INTO users (email) VALUES ($1) ON CONFLICT (email) DO NOTHING RETURNING *',
    [email]
  );
  
  if (result.rows.length === 0) {
    return getUserByEmail(email);
  }
  
  return result.rows[0];
}


async function getUserByEmail(email) {
  const result = await query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0] || null;
}

async function userExists(email) {
  const result = await query(
    'SELECT 1 FROM users WHERE email = $1',
    [email]
  );
  return result.rows.length > 0;
}

module.exports = {
  createUser,
  getUserByEmail,
  userExists
};