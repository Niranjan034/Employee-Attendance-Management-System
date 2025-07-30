const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.post('/mark', (req, res) => {
  const { employee_id, type } = req.body;
  const today = new Date().toISOString().slice(0, 10);

  db.query('SELECT * FROM attendance WHERE employee_id = ? AND date = ?', [employee_id, today], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Error checking attendance' });

    if (rows.length === 0 && type === 'checkin') {
      const now = new Date().toTimeString().slice(0, 8);
      const status = now <= '09:30:00' ? 'Present' : 'Half-Day';
      db.query(
        'INSERT INTO attendance (employee_id, date, check_in, status) VALUES (?, ?, ?, ?)',
        [employee_id, today, now, status],
        err => {
          if (err) return res.status(500).json({ message: 'Check-in failed' });
          res.json({ message: 'Checked In Successfully' });
        }
      );
    } else if (rows.length > 0 && type === 'checkout' && !rows[0].check_out) {
      const now = new Date().toTimeString().slice(0, 8);
      db.query(
        'UPDATE attendance SET check_out = ? WHERE attendance_id = ?',
        [now, rows[0].attendance_id],
        err => {
          if (err) return res.status(500).json({ message: 'Check-out failed' });
          res.json({ message: 'Checked Out Successfully' });
        }
      );
    } else {
      res.status(400).json({ message: 'Already marked or invalid action' });
    }
  });
});

router.get('/today/:id', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);

  const query = `
    SELECT 
      attendance_id,
      employee_id,
      DATE_FORMAT(date, '%d-%m-%Y') AS date,
      check_in,
      check_out,
      status
    FROM attendance
    WHERE employee_id = ? AND date = ?
  `;

  db.query(query, [req.params.id, today], (err, result) => {
    if (err) return res.status(500).json({ message: 'DB error' });
    res.json(result[0] || {});
  });
});

router.get('/history/:id', (req, res) => {
  const query = `
    SELECT 
      attendance_id,
      employee_id,
      DATE_FORMAT(date, '%d-%m-%Y') AS date,
      check_in,
      check_out,
      status
    FROM attendance
    WHERE employee_id = ?
    ORDER BY date DESC
    LIMIT 30
  `;

  db.query(query, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ message: 'DB error' });
    res.json(rows);
  });
});

router.get('/summary/:id', (req, res) => {
  db.query(
    `SELECT
      SUM(status = 'Present') AS present,
      SUM(status = 'Leave') AS leave,
      SUM(status = 'Half-Day') AS late
     FROM attendance WHERE employee_id = ?`,
    [req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({ message: 'Error loading summary' });
      res.json(result[0]);
    }
  );
});

router.get('/', (req, res) => {
  let sql = `
    SELECT a.attendance_id, a.employee_id, e.name, DATE_FORMAT(a.date, '%d-%m-%Y') as date, a.check_in, a.check_out, a.status
    FROM attendance a
    JOIN employees e ON a.employee_id = e.employee_id
    WHERE 1
  `;
  const params = [];

  if (req.query.employee_id) {
    sql += ' AND a.employee_id = ?';
    params.push(req.query.employee_id);
  }

  if (req.query.date) {
    sql += ' AND a.date = ?';
    params.push(req.query.date);
  }

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error('Error fetching attendance:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    res.json(results);
  });
});

router.get('/report/monthly', async (req, res) => {
  const { month, year, department } = req.query;

  if (!month || !year) {
    return res.status(400).json({ message: 'Month and year are required' });
  }

  const monthNum = parseInt(month);
  const yearNum = parseInt(year);
  const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

  const startDate = `${year}-${month.padStart(2, '0')}-01`;
  const endDate = `${year}-${month.padStart(2, '0')}-${daysInMonth.toString().padStart(2, '0')}`;

  let query = `
    SELECT e.employee_id, e.name AS employee_name, d.name AS department_name, a.date, a.status
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.department_id
    LEFT JOIN attendance a 
      ON e.employee_id = a.employee_id 
      AND a.date BETWEEN ? AND ?
  `;

  const params = [startDate, endDate];

  if (department) {
    query += ` WHERE d.name = ?`;
    params.push(department);
  }

  try {
    db.query(query, params, (err, results) => {
      if (err) return res.status(500).json({ message: 'DB error', err });

      const report = {};
      results.forEach(row => {
        if (!report[row.employee_id]) {
          report[row.employee_id] = {
            employee_id: row.employee_id,
            name: row.employee_name,
            department: row.department_name,
            attendance: Array(daysInMonth).fill('Leave'),
          };
        }

        if (row.date && row.status) {
          const day = new Date(row.date).getDate();
          report[row.employee_id].attendance[day - 1] = row.status;
        }
      });

      const formattedData = Object.values(report);
      res.json({ daysInMonth, data: formattedData });
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
});

module.exports = router;
