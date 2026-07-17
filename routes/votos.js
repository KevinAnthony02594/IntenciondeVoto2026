const express = require("express");

const router = express.Router();

const { createClient } = require("@supabase/supabase-js");


const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);


// Registrar voto

router.post("/votar", async(req,res)=>{


    const {
        dni,
        candidato_id,
        zona
    }=req.body;

   if(!candidato_id){

        return res.status(400).json({

        success:false,

        message:"Debe seleccionar candidato"

        });

    }


    try{


        const {error}=await supabase
        .from("votos")
        .insert([

            {
                dni:dni || null,
                candidato_id,
                zona
            }

        ]);



        if(error){


            if(error.code==="23505"){

                return res.status(409).json({

                    success:false,

                    message:"El DNI ya registró un voto"

                });

            }


            throw error;

        }



        res.json({

            success:true,

            message:"Voto registrado correctamente"

        });



    }catch(error){


        console.error(error);


        res.status(500).json({

            success:false,

            message:"Error interno"

        });


    }


});



module.exports=router;