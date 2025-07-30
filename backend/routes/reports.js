const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', (req, res) => {
  const { month, year } = req.query;

  if (!month || !year) {
    return res.status(400).json({ message: 'Month and year required' });
  }

  const query = `
    SELECT e.employee_id, e.name,
      SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) AS present,
      SUM(CASE WHEN a.status = 'Half-Day' THEN 1 ELSE 0 END) AS half_day,
      SUM(CASE WHEN a.status = 'Leave' THEN 1 ELSE 0 END) AS \`leave\`
    FROM employees e
    LEFT JOIN attendance a
      ON e.employee_id = a.employee_id
      AND MONTH(a.date) = ? AND YEAR(a.date) = ?
    GROUP BY e.employee_id, e.name
    ORDER BY e.name
  `;

  db.query(query, [month, year], (err, results) => {
    if (err) {
      console.error('Error fetching report:', err);
      return res.status(500).json({ message: 'DB error', error: err });
    }
    res.json(results);
  });
});

module.exports = router;