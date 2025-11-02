import pg from 'pg';
const { Pool } = pg;

const testPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: 'teammosaic_test', 
  user: process.env.DB_USER || process.env.USER,
  password: process.env.DB_PASSWORD || undefined,
  max: 5,
});

export async function query(text, params) {
  return await testPool.query(text, params);
}

export { testPool as pool };