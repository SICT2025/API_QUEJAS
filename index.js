import express from 'express';
import cors from 'cors';
import { pool } from './db.js';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

const app = express();

// Configurar CORS
app.use(cors({ origin: '*' }));
app.options('*', cors());
app.use(express.json());

// Crear tablas si no existen
const crearTablas = async () => {
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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario VARCHAR(50) NOT NULL UNIQUE,
      password VARCHAR(100) NOT NULL
    )
  `);
};
crearTablas();

// Crear usuario admin solo una vez
const crearUsuarioAdmin = async () => {
  const usuario = 'admin';
  const contraseña = 'admin123';
  try {
    const hash = await bcrypt.hash(contraseña, 10);
    await pool.query(
      'INSERT INTO usuarios (usuario, password) VALUES (?, ?)',
      [usuario, hash]
    );
    console.log('✅ Usuario admin creado');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      console.log('⚠️ El usuario admin ya existe');
    } else {
      console.error('❌ Error creando usuario admin:', err.message);
    }
  }
};

// Crear nueva queja
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

// Obtener todas las quejas
app.get('/api/quejas', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT folio, tipo, texto, estatus, fecha FROM quejas ORDER BY fecha DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener quejas' });
  }
});

// Consultar una queja por folio
app.get('/api/quejas/:folio', async (req, res) => {
  const { folio } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT estatus, texto FROM quejas WHERE folio = ?',
      [folio]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'No encontrado' });

    res.json({
      estatus: rows[0].estatus,
      texto: rows[0].texto
    });
  } catch (err) {
    res.status(500).json({ error: 'Error en la consulta' });
  }
});

// Actualizar estatus
app.put('/api/quejas/:folio', async (req, res) => {
  const { folio } = req.params;
  const { estatus } = req.body;

  try {
    const [result] = await pool.query(
      'UPDATE quejas SET estatus = ? WHERE folio = ?',
      [estatus, folio]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Queja no encontrada' });
    }

    res.json({ success: true, message: 'Queja actualizada correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar la queja' });
  }
});

// Endpoint de login con validación segura
app.post('/api/login', async (req, res) => {
  const { usuario, password } = req.body;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM usuarios WHERE usuario = ?',
      [usuario]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    res.json({ success: true, usuario: user.usuario });
  } catch (err) {
    console.error('Error en login:', err.message);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Arrancar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
  crearUsuarioAdmin(); // ejecutar una vez, puedes comentarlo después
});
