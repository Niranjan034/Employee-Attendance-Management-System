const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', (req, res) => {
  const query = `
    SELECT 
      e.employee_id,
      e.name,
      e.email,
      e.status,
      e.join_date,
      d.name AS department
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.department_id
    ORDER BY e.employee_id
  `;
  db.query(query, (err, result) => {
    if (err) return res.status(500).json({ message: 'DB error' });
    res.json(result);
  });
});

router.get('/:id', (req, res) => {
  const query = `
    SELECT 
      e.employee_id,
      e.name,
      e.email,
      e.status,
      DATE_FORMAT(e.join_date, '%d-%m-%Y') AS join_date,
      d.name AS department
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.department_id
    WHERE e.employee_id = ?
  `;
  db.query(query, [req.params.id], (err, result) => {
    if (err) {
      console.error("SQL ERROR:", err);
      return res.status(500).json({ message: 'DB error' });
    }
    if (result.length === 0) return res.status(404).json({ message: 'Not found' });
    res.json(result[0]);
  });
});

router.post('/', (req, res) => {
  const { name, email, password, department_id, status } = req.body;
  if (!name || !email || !password || !department_id || !status) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const query = `
    INSERT INTO employees (name, email, password, department_id, join_date, status)
    VALUES (?, ?, ?, ?, CURDATE(), ?)
  `;
  const values = [name, email, password, department_id, status];

  db.query(query, values, (err, result) => {
    if (err) return res.status(500).json({ message: 'Insert error' });
    res.json({ message: 'Employee added', id: result.insertId });
  });
});

router.put('/:id', (req, res) => {
  const { name, email, password, department_id, status } = req.body;
  if (!name || !email || !password || !department_id || !status) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const query = `
    UPDATE employees 
    SET name = ?, email = ?, password = ?, department_id = ?, status = ?
    WHERE employee_id = ?
  `;
  const values = [name, email, password, department_id, status, req.params.id];

  db.query(query, values, (err) => {
    if (err) return res.status(500).json({ message: 'Update error' });
    res.json({ message: 'Employee updated' });
  });
});

router.delete('/:id', (req, res) => {
  db.query('DELETE FROM employees WHERE employee_id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: 'Delete error' });
    res.json({ message: 'Employee deleted' });
  });
});

module.exports = router;
