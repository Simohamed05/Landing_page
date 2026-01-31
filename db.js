// db.js
import { Pool } from 'pg';

// Privilégiez l'URL de connexion fournie par Vercel (Variable d’environnement DATABASE_URL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

// Méthode query : exécute une requête SQL avec paramètres
export const db = {
  query: (text, params) => pool.query(text, params),
};

// getPool : retourne le pool (si vous en avez besoin ailleurs)
export const getPool = () => pool;
