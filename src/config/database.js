const mongoose = require("mongoose");
require("dotenv").config();


const connectionDB = async () => {
    try {
        const db = await mongoose.connect(process.env.DATABASE_URL);
        console.log(`Database connected to ${db.connection.name}`);
    }
    catch (error) {
        console.log(error);
        process.exit(1);
    }

}

module.exports = connectionDB; //Exportamos la funcion para poder usarla en otro archivo
