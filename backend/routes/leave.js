const express = require('express');
const router = express.Router();
const db = require('../config/db');
router.post('/', (req, res) => {
  const { employee_id, from_date, to_date, reason } = req.body;

  if (!employee_id || !from_date || !to_date || !reason) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  db.query(
    'INSERT INTO leave_requests (employee_id, from_date, to_date, reason, status) VALUES (?, ?, ?, ?, "Pending")',
    [employee_id, from_date, to_date, reason],
    err => {
      if (err) {
        console.error('DB Error:', err);
        return res.status(500).json({ message: 'Error submitting request' });
      }
      res.json({ message: 'Leave request submitted' });
    }
  );
});
router.get('/:id', (req, res) => {
  const query = `
    SELECT 
      leave_id,
      employee_id,
      DATE_FORMAT(from_date, '%d-%m-%Y') AS from_date,
      DATE_FORMAT(to_date, '%d-%m-%Y') AS to_date,
      reason,
      status
    FROM leave_requests
    WHERE employee_id = ?
    ORDER BY from_date DESC
  `;

  db.query(query, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ message: 'DB error' });
    res.json(rows);
  });
});

router.get('/admin/pending', (req, res) => {
  const query = `
    SELECT l.leave_id, l.employee_id, e.name, DATE_FORMAT(l.from_date, '%d-%m-%Y') AS from_date, DATE_FORMAT(l.to_date, '%d-%m-%Y') AS to_date
, l.reason, l.status
    FROM leave_requests l
    JOIN employees e ON l.employee_id = e.employee_id
    WHERE l.status = 'Pending'
    ORDER BY l.from_date DESC
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ message: 'DB error', error: err });
    res.json(results);
  });
});
router.put('/:id', (req, res) => {
  const leaveId = req.params.id;
  const { status } = req.body;

  if (!['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const query = 'UPDATE leave_requests SET status = ? WHERE leave_id = ?';
  db.query(query, [status, leaveId], (err, result) => {
    if (err) return res.status(500).json({ message: 'DB error', error: err });
    res.json({ message: `Leave ${status.toLowerCase()}` });
  });
});

module.exports = router;