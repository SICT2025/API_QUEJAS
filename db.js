import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Configura __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

// Validación de variables de entorno
if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD) {
  throw new Error("❌ Faltan variables de entorno esenciales para la DB");
}

// Configuración SSL
const sslConfig = {
  ca: fs.readFileSync(path.join(__dirname, 'certs', 'ca.pem')),
  rejectUnauthorized: true
};

// Pool de conexiones
export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'mysql-api-quejas-sict-gto.f.aivencloud.com',
  port: Number(process.env.DB_PORT) || 15419,
  user: process.env.DB_USER || 'avnadmin',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'defaultdb',
  ssl: sslConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Prueba de conexión (opcional)
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ Conexión exitosa a Aiven MySQL");
    conn.release();
  } catch (err) {
    console.error("❌ Error de conexión:", err.message);
  }
})();