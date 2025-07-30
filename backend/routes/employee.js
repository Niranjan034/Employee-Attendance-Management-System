const express = require('express')
const router = express.Router()
const db = require('../config/db')

router.get('/profile/:id', (req, res) => {
  const employeeId = req.params.id
  db.query('SELECT * FROM employees WHERE employee_id = ?', [employeeId], (err, result) => {
    if (err) return res.status(500).json({ message: 'Database error' })
    if (result.length === 0) return res.status(404).json({ message: 'Employee not found' })
    res.json(result[0])
  })
})

module.exports = router