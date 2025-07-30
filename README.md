# Gradious Employee Attendance Management System

A full-featured web-based **Employee Attendance Management System** built using **Node.js**, **Express.js**, **MySQL**, **Vanilla JavaScript**, and **Bootstrap**. It is designed for organizations to efficiently track employee attendance with role-based access for admins and employees.

## Features

### Authentication
- Secure login for Admin and Employee roles
- Role-based access redirection

### Admin Dashboard
- View overall employee stats
- Manage employee records (add, edit, delete)
- View and filter attendance by date and department
- Approve or reject leave requests
- Define and manage holidays
- Export attendance reports to Excel/CSV

### Employee Dashboard
- Check-in / Check-out attendance with time validation
- Prevent check-ins on holidays or non-working hours
- View own attendance history
- Apply for leaves and track leave status
- View company-declared holidays
- Live clock display and status updates

### 🌐 Frontend
- Responsive UI built with HTML, CSS, and Bootstrap
- Enhanced UX with modals, dark mode, live clock, and toast alerts

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Frontend**: HTML5, CSS3, Bootstrap, Vanilla JavaScript
- **Authentication**: Session-based login

---

## 📂 Project Structure

attendance-system/
├── backend/
│ ├── routes/
│ | ├── holidays.js
│ │ ├── employee.js
│ │ └── employees.js
│ │ ├── attendance.js
│ │ └── auth.js
│ │ ├── leave.js
│ │ └── reports.js
│ ├── config/
│ │ ├── db.js
│ ├── server.js
│ └── .env
├── frontend/
│ ├── css/
│ │ └── styles.css
│ ├── js/
│ │ ├── admin.js
│ │ ├── employee.js
│ │ └── app.js
│ ├── admin.html
│ ├── employee.html
│ └── index.html
└── README.md


---

## ⚙️ Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/Niranjan034/Employee-Attendance-Management-System.git
cd attendance-system
```
### 2. Install Dependencies
 ```
npm install
```
### 3. Configure Environment Variables
```
Create a .env file in the root directory:

env
Copy
Edit
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=attendance_system
```
### 4. Import SQL Schema
```
```
### Database Tables
```
employees – stores employee details and credentials

attendance – logs daily check-in/check-out data

leaves – records leave applications

holidays – stores declared holidays

```
Notes
```
Attendance check-in is allowed only between 9 AM and 6 PM.

No check-in allowed on declared holidays.

Admin can export attendance in Excel/CSV format.
