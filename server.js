require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 🎯 Endpoint principal: Registrar Voto
app.post('/api/votar', async (req, res) => {
  const { dni, voto } = req.body;

  // 1. Validaciones de negocio (Backend)
  if (!dni || !voto) {
    return res.status(400).json({ success: false, message: 'El DNI y el voto son obligatorios.' });
  }

  if (!/^\d{8}$/.test(dni)) {
    return res.status(400).json({ success: false, message: 'El DNI debe tener exactamente 8 dígitos numéricos.' });
  }

  try {
    // 2. Intentar insertar el voto en Supabase
    const { error } = await supabase
      .from('votos')
      .insert([{ dni, voto }]);

    // 3. Manejo de errores (incluido el DNI duplicado)
    if (error) {
      if (error.code === '23505') { // Código de error de PostgreSQL para UNIQUE constraint
        return res.status(409).json({ success: false, message: 'Este DNI ya ha registrado su voto.' });
      }
      throw error;
    }

    res.json({ success: true, message: 'Voto registrado correctamente.' });
  } catch (error) {
    console.error('Error al registrar voto:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
});

// ✨ Endpoint extra: Obtener Resultados Totales
app.get('/api/resultados', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('votos')
      .select('voto');

    if (error) throw error;

    // Calcular totales por partido y total general sin exponer DNI
    const conteo = data.reduce((acc, curr) => {
      acc[curr.voto] = (acc[curr.voto] || 0) + 1;
      return acc;
    }, {});

    res.json({ success: true, total: data.length, resultados: conteo });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener resultados.' });
  }
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor de Elecciones corriendo en http://localhost:${port}`);
});

// Solo iniciar el servidor localmente si no estamos en producción
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Servidor de Elecciones corriendo en http://localhost:${port}`);
  });
}

// Exportar la app para que Vercel la trate como una función Serverless
module.exports = app;