const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.post('/holidays', (req, res) => {
  const { date, name } = req.body;

  if (!date || !name) {
    return res.status(400).json({ message: 'Date and name are required' });
  }

  const insertQuery = 'INSERT INTO holidays (date, name) VALUES (?, ?)';

  db.query(insertQuery, [date, name], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'Holiday already exists for this date' });
      }
      return res.status(500).json({ message: 'Database error', err });
    }
    res.status(201).json({ message: 'Holiday added successfully' });
  });
});

router.get('/holidays', (req, res) => {
  const { month, year } = req.query;

  let query = 'SELECT * FROM holidays';
  const params = [];

  if (month && year) {
    query += ' WHERE MONTH(date) = ? AND YEAR(date) = ?';
    params.push(month, year);
  } else {
    query += ' WHERE date >= CURDATE()'; 
  }

  query += ' ORDER BY date ASC';

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', err });
    res.json(results);
  });
});

module.exports = router;
