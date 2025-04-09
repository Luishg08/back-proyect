const express = require("express"); //Al importarla nos permirte hacer request
require("dotenv").config(); //Nos permite leer las variables de entorno
const connectionDB = require("./config/database"); //Importamos la funcion que nos permite conectarnos a la base de datos
const routes = require('./routes/routes');
const bodyParser = require('body-parser');
const cors = require("cors"); //Nos permite hacer peticiones entre dominios diferentes

const app = express();
const port=process.env.PORT || 3005; // EL PROCCES.ENV NOS PERMITE ACCEDER LAS VARIABLES DE ENTORNO
//console.log(port);

/*const printMessenge = (port) => {  
return `Server running on port ${port}`;
}

const printMessenge1 = function(){  
return `Server running on port ${port}`;
}
console.log(printMessenge(port));*/

// app.use(cors({
//     origin: "http://localhost:5173", //URL del frontend
//     methods: ['GET', 'POST', 'PUT','PATCH', 'DELETE'], //Métodos permitidos
//     allowedHeaders: ['Content-Type', 'Authorization'], //Cabeceras permitidas
// })); //Usamos cors para permitir peticiones entre dominios diferentes

app.use(cors()); 

// app.options('*', cors()); //Permitir todas las opciones de peticiones entre dominios diferentes

app.listen(port, () => {
    console.log(`Server running on ${port}`);
    
});

app.use(bodyParser.json());
app.use('/api/v1', routes);

connectionDB(); //Llamamos a la funcion para conectarnos a la base de datos
