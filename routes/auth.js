const express = require("express");
const router = express.Router();

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

router.post("/login", async (req, res) => {

    const { dni, password } = req.body;

    if (!dni || !password) {
        return res.status(400).json({
            success: false,
            message: "Ingrese DNI y contraseña"
        });
    }

    try {

        const { data, error } = await supabase
            .from("administradores")
            .select("*")
            .eq("dni", dni)
            .eq("activo", true)
            .single();

        if (error || !data) {
            return res.status(401).json({
                success: false,
                message: "Usuario o contraseña incorrectos"
            });
        }

        // Comparar contraseña
        const coincide = await bcrypt.compare(
            password,
            data.password
        );

        if (!coincide) {
            return res.status(401).json({
                success: false,
                message: "Usuario o contraseña incorrectos"
            });
        }

        const token = jwt.sign(
            {
                id: data.id,
                dni: data.dni,
                nombre: data.nombre
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "8h"
            }
        );

        res.json({
            success: true,
            token,
            nombre: data.nombre
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Error interno"
        });

    }

});

module.exports = router;