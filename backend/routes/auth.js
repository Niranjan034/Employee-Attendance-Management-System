const express = require('express');
const router = express.Router();
const db = require('../config/db');
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.query('SELECT * FROM admins WHERE username = ?', [username], (err, adminResult) => {
    if (err) return res.status(500).json({ message: 'DB error (admin)' });
    if (adminResult.length > 0) {
      const admin = adminResult[0];
      if (admin.password === password) {
        return res.json({ message: 'Login successful', role: 'admin', id: admin.admin_id, name: admin.username });
      } else {
        return res.status(401).json({ message: 'Invalid password' });
      }
    }
    db.query('SELECT * FROM employees WHERE email = ? OR name = ?', [username, username], (err, empResult) => {
      if (err) return res.status(500).json({ message: 'DB error (employee)' });
      if (empResult.length > 0) {
        const emp = empResult[0];
        if (emp.password === password) {
          return res.json({ message: 'Login successful', role: 'employee', id: emp.employee_id, name: emp.name });
        } else {
          return res.status(401).json({ message: 'Invalid password' });
        }
      } else {
        return res.status(404).json({ message: 'User not found' });
      }
    });
  });
});
module.exports = router;