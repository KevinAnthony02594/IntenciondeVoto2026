const jwt = require("jsonwebtoken");

module.exports = (req,res,next)=>{

    const auth=req.headers.authorization;

    if(!auth){

        return res.status(401).json({

            success:false,

            message:"Token requerido"

        });

    }

    const token=auth.split(" ")[1];

    try{

        req.usuario=jwt.verify(

            token,

            process.env.JWT_SECRET

        );

        next();

    }catch(e){

        return res.status(401).json({

            success:false,

            message:"Token inválido"

        });

    }

}