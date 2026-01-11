const express = require("express")
const router = express.Router()

const authMW = require("../middleware/authMW")
const {saveTodo, getTodos, deleteTodo} = require('../controllers/todo.controller')

router.post("/save", authMW, saveTodo)
router.get("/list", authMW, getTodos)
router.delete("/:id", authMW, deleteTodo)

module.exports = router
