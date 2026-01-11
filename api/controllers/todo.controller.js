const Todo = require("../models/todo")

exports.saveTodo = async (req, res) => {
  try {
    const { todoId, title, description, priority, dueDate, completed } = req.body

    if (todoId) {
      const todo = await Todo.findOneAndUpdate(
        { _id: todoId, user: req.user.id, isDeleted: false },
        { title, description, priority, dueDate, completed },
        { new: true }
      )

      if (!todo) {
        return res.status(404).json({ message: "Todo not found" })
      }

      return res.status(200).json({
        success: true,
        message: "Todo updated",
        data: todo
      })
    }

    const todo = await Todo.create({
      title,
      description,
      priority,
      dueDate,
      user: req.user.id
    })

    res.status(201).json({
      success: true,
      message: "Todo created",
      data: todo
    })

  } catch (error) {
    res.status(500).json({
      message: "Failed to save todo",
      error: error.message
    })
  }
}

exports.deleteTodo = async (req, res) => {
  try {
    const { id } = req.params

    const todo = await Todo.findOneAndUpdate(
      { _id: id, user: req.user.id, isDeleted: false },
      {
        isDeleted: true,
        deletedAt: new Date()
      },
      { new: true }
    )

    if (!todo) {
      return res.status(404).json({ message: "Todo not found" })
    }

    res.status(200).json({
      success: true,
      message: "Todo deleted"
    })
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete todo",
      error: error.message
    })
  }
}

exports.getTodos = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10
    const skip = (page - 1) * limit

    const filter = {
      user: req.user.id,
      isDeleted: false
    }

    const [todos, total] = await Promise.all([
      Todo.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Todo.countDocuments(filter)
    ])

    res.status(200).json({
      success: true,
      data: todos,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch todos",
      error: error.message
    })
  }
}
