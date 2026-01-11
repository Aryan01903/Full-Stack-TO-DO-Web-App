const express = require("express")
const mongoose = require("mongoose")
const cors = require('cors')
const authRoutes = require('./routes/user.route')
require('dotenv').config()
const app = express()


const allowedOrigins = [
  process.env.FE_URL,
  'http://localhost:5173',
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
};

app.use(cors(corsOptions));
app.use(express.json());


app.use('/auth', authRoutes)


mongoose
  .connect(process.env.DB_URL)
  .then(()=>console.log("Connected to Database"))
  .catch(()=>console.error("Error Occurred in Connecting Database"));

const PORT = process.env.PORT||4000
app.listen(PORT, () => {
  console.log("Server Started at ", PORT);
});


