const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
const holidayRoutes = require('./routes/holidays');
app.use('/api', holidayRoutes);

const employeeRoutes = require('./routes/employees');
app.use('/api/employees', employeeRoutes);
const attendanceRoutes = require('./routes/attendance');
app.use('/api/attendance', attendanceRoutes)
const reportRoutes = require('./routes/reports');
app.use('/api/reports', reportRoutes);
const leaveRoutes = require('./routes/leave');
app.use('/api/leave', leaveRoutes);
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
