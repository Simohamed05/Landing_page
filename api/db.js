import { sql } from "@vercel/postgres";
export { sql };
// Export simple : tu utiliseras `sql` partout

let pool;

function makePool() {
  return mysql.createPool({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,

    // Railway / serverless stability
    connectTimeout: 15000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    ssl: { rejectUnauthorized: false },

    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0
  });
}

export async function getPool() {
  if (!pool) pool = makePool();

  // Ping léger : si la connexion a été coupée, on recrée le pool
  try {
    await pool.query("SELECT 1");
  } catch (e) {
    pool = makePool();
  }

  return pool;
}
 