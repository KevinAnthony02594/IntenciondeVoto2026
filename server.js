require("dotenv").config();

const express = require("express");
const path = require("path");

const app = express();


app.use(express.json());


app.use(
    express.static(
        path.join(__dirname,"public")
    )
);



app.use(
    "/api/admin",
    require("./routes/auth")
);



app.use(
    "/api",
    require("./routes/votos")
);



app.use(
    "/api/dashboard",
    require("./routes/dashboard")
);



const PORT = process.env.PORT || 3000;


app.listen(PORT,()=>{

console.log(
"Servidor iniciado:",
PORT
);

});