require('dotenv').config();
console.log("JWT_SECRET:", process.env.JWT_SECRET);
const jwt = require('jsonwebtoken');

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
// El DNI es OPCIONAL: el elector puede votar sin ingresarlo.
// Si lo ingresa, debe tener 8 dígitos y sirve para evitar votos duplicados.
app.post('/api/votar', async (req, res) => {
  const { dni, voto, zona } = req.body;

  // 1. Validaciones de negocio (Backend)
  if (!voto) {
    return res.status(400).json({ success: false, message: 'Debes seleccionar una opción de voto.' });
  }

  let dniLimpio = null;
  if (dni) {
    if (!/^\d{8}$/.test(dni)) {
      return res.status(400).json({ success: false, message: 'Si ingresas tu DNI, debe tener exactamente 8 dígitos numéricos.' });
    }
    dniLimpio = dni;
  }

  try {
    // 2. Intentar insertar el voto en Supabase
    // dni puede ser null (voto anónimo); zona puede ser null si no se seleccionó
    const { error } = await supabase
      .from('votos')
      .insert([{ dni: dniLimpio, voto, zona: zona || null }]);

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
app.get('/api/resultados',verificarToken,async(req,res)=>{

    try{

        const {data,error}=await supabase
        .from('votos')
        .select("dni,voto,zona,fecha_registro");

        if(error) throw error;

        const resultados={};

        data.forEach(v=>{

            resultados[v.voto]=(resultados[v.voto]||0)+1;

        });

        res.json({

            success:true,

            total:data.length,

            resultados,

            votos:data

        });

    }catch(e){

        res.status(500).json({
            success:false,
            message: e.message

        });

    }

});

// Login simple para administrador
app.post('/api/admin/login', async (req, res) => {

    const { dni } = req.body;

    if (!dni) {
        return res.status(400).json({
            success:false,
            message:'Ingrese el DNI'
        });
    }

    try{

        const {data,error}=await supabase
        .from('administradores')
        .select('*')
        .eq('dni',dni)
        .eq('activo',true)
        .single();

        if(error || !data){

            return res.status(401).json({
                success:false,
                message:'No autorizado'
            });

        }

        const token=jwt.sign({

            id:data.id,
            dni:data.dni,
            nombre:data.nombre

        },process.env.JWT_SECRET,{

            expiresIn:'8h'

        });

        res.json({

            success:true,
            token,
            nombre:data.nombre

        });

    }catch(e){

        res.status(500).json({

            success:false,
            message:e.message

        });

    }

});

app.get('/api/resultados/:partido',verificarToken,async(req,res)=>{

    const partido=req.params.partido;

    try{

        const {data,error}=await supabase

        .from('votos')

        .select('*')

        .eq('voto',partido);

        if(error) throw error;

        res.json({

            success:true,

            total:data.length,

            votos:data

        });

    }catch(e){

        res.status(500).json({

            success:false

        });

    }

});

app.get('/api/dashboard',verificarToken,async(req,res)=>{

    try{

        const {data,error}=await supabase

        .from('votos')

        .select('voto,zona');

        if(error) throw error;

        const partidos={};

        const zonas={};

        data.forEach(v=>{

            partidos[v.voto]=(partidos[v.voto]||0)+1;

            zonas[v.zona]=(zonas[v.zona]||0)+1;

        });

        res.json({

            success:true,

            total:data.length,

            partidos,

            zonas

        });

    }catch(e){

        res.status(500).json({

            success:false

        });

    }

});
function verificarToken(req,res,next){

    const auth=req.headers.authorization;

    if(!auth){

        return res.status(401).json({
            success:false,
            message:"Token no enviado"
        });

    }

    const token=auth.split(" ")[1];

    try{

        req.usuario=jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        next();

    }catch(err){

        console.log(err);

        return res.status(401).json({

            success:false,

            message:"Token inválido"

        });

    }

}
// Iniciar servidor solo si no estamos en producción (Vercel usa module.exports)
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Servidor de Elecciones corriendo en http://localhost:${port}`);
  });
}

// Exportar la app para que Vercel la trate como una función Serverless
module.exports = app;