const { query } = require('../helpers');


async function getProfile(email) {
  const result = await query(
    'SELECT * FROM profiles WHERE email = $1',
    [email]
  );
  return result.rows[0] || null;
}


async function createProfile(email, data) {
  const { name, title, bio, location, website } = data;
  
  const result = await query(
    `INSERT INTO profiles (email, name, title, bio, location, website)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [email, name, title || null, bio || null, location || null, website || null]
  );
  
  return result.rows[0];
}


async function updateProfile(email, data) {
  const { name, title, bio, location, website } = data;
  
  const result = await query(
    `UPDATE profiles
     SET name = $2, title = $3, bio = $4, location = $5, website = $6, updated_at = CURRENT_TIMESTAMP
     WHERE email = $1
     RETURNING *`,
    [email, name, title || null, bio || null, location || null, website || null]
  );
  
  return result.rows[0] || null;
}


async function deleteProfile(email) {
  await query('DELETE FROM profiles WHERE email = $1', [email]);
}

module.exports = {
  getProfile,
  createProfile,
  updateProfile,
  deleteProfile
};