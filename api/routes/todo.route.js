const express = require("express")
const router = express.Router()

const authMW = require("../middlewares/authMW")
const saveTodo = require("../controllers/saveTodo")
const deleteTodo = require("../controllers/deleteTodo")
const getTodos = require("../controllers/getTodos")

router.post("/save", authMW, saveTodo)
router.get("/list", authMW, getTodos)
router.delete("/:id", authMW, deleteTodo)

module.exports = router
