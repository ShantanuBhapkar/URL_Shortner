import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL ,
ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false, // in production we want to use SSL but in development we can skip it for simplicity. This also allows us to connect to local Postgres without SSL.
});

export default pool;