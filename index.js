import express from 'express';
import cors from 'cors';
import { pool } from './db.js';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Crear la tabla si no existe
const crearTabla = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS quejas (
      id INT AUTO_INCREMENT PRIMARY KEY,
      folio VARCHAR(50) NOT NULL UNIQUE,
      tipo VARCHAR(20) NOT NULL,
      texto TEXT NOT NULL,
      estatus VARCHAR(50) DEFAULT 'Recibida',
      fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};
crearTabla();

// Endpoint para recibir una queja
app.post('/api/quejas', async (req, res) => {
  const { tipo, texto } = req.body;
  if (!tipo || !texto) return res.status(400).json({ error: 'Faltan datos' });
  const folio = 'QJ-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  try {
    await pool.query(
      'INSERT INTO quejas (folio, tipo, texto) VALUES (?, ?, ?)',
      [folio, tipo, texto]
    );
    res.json({ folio });
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar la queja' });
  }
});

// Endpoint para consultar estatus por folio
app.get('/api/quejas/:folio', async (req, res) => {
  const { folio } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT estatus FROM quejas WHERE folio = ?',
      [folio]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
    res.json({ estatus: rows[0].estatus });
  } catch (err) {
    res.status(500).json({ error: 'Error en la consulta' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});