const express = require("express")
const mongoose = require("mongoose")
require('dotenv').config()
const app = express()



mongoose
  .connect(process.env.DB_URL)
  .then(()=>console.log("Connected to Database"))
  .catch(()=>console.error("Error Occurred in Connecting Database"));

const PORT = process.env.PORT||4000
app.listen(PORT, () => {
  console.log("Server Started at ", PORT);
});


