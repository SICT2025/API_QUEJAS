import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// 1. Validación de variables de entorno
if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD) {
  throw new Error("❌ Faltan variables de entorno esenciales para la DB");
}

// 2. Configuración SSL (obligatorio en Aiven)
const sslConfig = {
  ca: fs.readFileSync(path.join(__dirname, 'certs/ca.pem')), // Descarga el CA de Aiven
  rejectUnauthorized: true // Aiven requiere validación estricta
};

// 3. Pool de conexiones
export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'mysql-api-quejas-sict-gto.f.aivencloud.com',
  port: Number(process.env.DB_PORT) || 15419,
  user: process.env.DB_USER || 'avnadmin',
  password: process.env.DB_PASSWORD, // ¡Nunca lo hardcodees!
  database: process.env.DB_NAME || 'defaultdb',
  ssl: sslConfig, // SSL es REQUERIDO
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 4. Prueba de conexión al iniciar (opcional pero recomendado)
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ Conexión exitosa a Aiven MySQL");
    conn.release();
  } catch (err) {
    console.error("❌ Error de conexión:", err.message);
  }
})();
