const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/admin/:adminId', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);

  const queries = {
    totalEmployees: 'SELECT COUNT(*) AS total FROM employees',
    presentToday: `SELECT COUNT(*) AS present FROM attendance WHERE date = ? AND status = 'Present'`,
    halfDayToday: `SELECT COUNT(*) AS half_day FROM attendance WHERE date = ? AND status = 'Half-Day'`,
    pendingLeaves: `SELECT COUNT(*) AS pending FROM leave_requests WHERE status = 'Pending'`
  };

  db.query(queries.totalEmployees, (err, empResult) => {
    if (err) return res.status(500).json({ message: 'Error fetching total employees' });

    db.query(queries.presentToday, [today], (err, presentResult) => {
      if (err) return res.status(500).json({ message: 'Error fetching present count' });

      db.query(queries.halfDayToday, [today], (err, halfDayResult) => {
        if (err) return res.status(500).json({ message: 'Error fetching half-day count' });

        db.query(queries.pendingLeaves, (err, leaveResult) => {
          if (err) return res.status(500).json({ message: 'Error fetching leave requests' });

          res.json({
            totalEmployees: empResult[0].total,
            presentToday: presentResult[0].present,
            halfDayToday: halfDayResult[0].half_day,
            leavesPending: leaveResult[0].pending
          });
        });
      });
    });
  });
});

router.get('/employee/:empId', (req, res) => {
  const empId = req.params.empId;

  const queries = {
    daysPresent: `SELECT COUNT(*) AS days FROM attendance WHERE employee_id = ? AND status = 'Present'`,
    leavesTaken: `SELECT COUNT(*) AS leaves FROM leave_requests WHERE employee_id = ? AND status = 'Approved'`,
    lateEntries: `SELECT COUNT(*) AS late FROM attendance WHERE employee_id = ? AND check_in > '09:30:00'`
  };

  db.query(queries.daysPresent, [empId], (err, presentRes) => {
    if (err) return res.status(500).json({ message: 'Error fetching attendance' });

    db.query(queries.leavesTaken, [empId], (err, leavesRes) => {
      if (err) return res.status(500).json({ message: 'Error fetching leaves' });

      db.query(queries.lateEntries, [empId], (err, lateRes) => {
        if (err) return res.status(500).json({ message: 'Error fetching late entries' });

        res.json({
          present: presentRes[0].days || 0,
          leave: leavesRes[0].leaves || 0,
          late: lateRes[0].late || 0
        });
      });
    });
  });
});

router.get('/departments', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);

  const query = `
    SELECT 
      d.name AS department_name,
      COUNT(DISTINCT e.employee_id) AS total_employees,
      COUNT(DISTINCT CASE WHEN a.date = ? AND a.status = 'Present' THEN a.employee_id END) AS present_today,
      COUNT(DISTINCT CASE WHEN a.date = ? AND a.status = 'Half-Day' THEN a.employee_id END) AS half_day_today
    FROM departments d
    LEFT JOIN employees e ON d.department_id = e.department_id
    LEFT JOIN attendance a ON e.employee_id = a.employee_id
    GROUP BY d.department_id, d.name
    ORDER BY d.name
  `;

  db.query(query, [today, today], (err, results) => {
    if (err) {
      console.error('Department summary error:', err);
      return res.status(500).json({ message: 'Database error', error: err });
    }

    res.json(results.map(row => ({
      department_name: row.department_name,
      total: row.total_employees,
      present: row.present_today || 0,
      half_day: row.half_day_today || 0
    })));
  });
});

module.exports = router;