import pkg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pkg;

export const pool = new Pool({
  //   user: process.env.DB_USER,
  //   host: process.env.DB_HOST,
  //   database: process.env.DB_DATABASE,
  //   password: process.env.DB_PASSWORD,
  //   port: process.env.DB_PORT,
  connectionString: process.env.DATABASE_URL, // Use environment variable
  ssl: { rejectUnauthorized: false }, // Required for some cloud providers
});
console.log("pool", pool);
