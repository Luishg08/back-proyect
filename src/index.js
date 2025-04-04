const express = require('express');
require('dotenv').config();
const connectionDB = require('./config/database');
const routes = require('./routes/routes');
const bodyParser = require('body-parser');
const cors = require("cors");


const app = express();
app.use(cors({
    origin: "http://localhost:5173" ,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    }));

    app.options("*", cors());

const port= process.env.PORT || 3005;

app.listen(port, ()=>{console.log(`Code running on port ${port}`)})

app.use(bodyParser.json());
app.use('/api/v1', routes)

connectionDB();