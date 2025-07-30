if (localStorage.getItem('role') !== 'admin') {
  window.location.href = 'index.html';
}

function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(sec => sec.classList.add('hidden'));
  document.getElementById(sectionId).classList.remove('hidden');

  document.querySelectorAll('.sidebar ul li').forEach(item => item.classList.remove('active'));

  const activeItem = document.querySelector(`.sidebar ul li[data-section="${sectionId}"]`);
  if (activeItem) activeItem.classList.add('active');

  if (sectionId === 'dashboard') loadDepartmentSummary();
  if (sectionId === 'employees') loadEmployees();
  if (sectionId === 'attendance') {
    populateEmployeeFilter();
    loadAttendance();
  }
  if (sectionId === 'reports') {
    generateYearOptions();
    loadReport();
  }
  if (sectionId === 'leaveRequests') loadLeaveRequests();
}

function logout() {
  localStorage.clear();
  window.location.href = 'index.html';
}

window.onload = async () => {
  showSection('dashboard');

  const adminId = localStorage.getItem('userId');
  if (!adminId) {
    logout();
    return;
  }

  try {
    const res = await fetch(`http://localhost:5000/api/dashboard/admin/${adminId}`);
    const data = await res.json();

    const spans = document.querySelectorAll('.card span');
    spans[0].textContent = data.totalEmployees;
    spans[1].textContent = data.presentToday;
    spans[2].textContent = data.halfDayToday;
    spans[3].textContent = data.leavesPending;


    loadDepartmentSummary();
  } catch (error) {
    console.error('Error loading admin dashboard data', error);
  }
};

async function loadEmployees() {
  const res = await fetch('http://localhost:5000/api/employees');
  const data = await res.json();
  const tbody = document.querySelector('#employeeTable tbody');
  tbody.innerHTML = '';
  data.forEach(emp => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${emp.employee_id}</td>
      <td>${emp.name}</td>
      <td>${emp.email}</td>
      <td>${emp.department || 'N/A'}</td>
      <td>${emp.status}</td>
      <td>
        <button onclick="editEmployee(${emp.employee_id})">Edit</button>
        <button style="background-color:red"  onclick="deleteEmployee(${emp.employee_id})">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function openAddEmployeeForm() {
  document.getElementById('formTitle').textContent = 'Add Employee';
  document.getElementById('empId').value = '';
  document.getElementById('empName').value = '';
  document.getElementById('empEmail').value = '';
  document.getElementById('empPassword').value = '';
  document.getElementById('empDept').value = '1';
  document.getElementById('empStatus').value = 'Active';
  document.getElementById('employeeForm').classList.remove('hidden');
}

async function editEmployee(id) {
  const res = await fetch(`http://localhost:5000/api/employees/${id}`);
  const emp = await res.json();
  document.getElementById('formTitle').textContent = 'Edit Employee';
  document.getElementById('empId').value = emp.employee_id;
  document.getElementById('empName').value = emp.name;
  document.getElementById('empEmail').value = emp.email;
  document.getElementById('empPassword').value = emp.password;
  document.getElementById('empDept').value = emp.department_id;
  document.getElementById('empStatus').value = emp.status;
  document.getElementById('employeeForm').classList.remove('hidden');
}

function closeForm() {
  document.getElementById('employeeForm').classList.add('hidden');
}

async function submitEmployeeForm() {
  const id = document.getElementById('empId').value;
  const data = {
    name: document.getElementById('empName').value,
    email: document.getElementById('empEmail').value,
    password: document.getElementById('empPassword').value,
    department_id: document.getElementById('empDept').value,
    status: document.getElementById('empStatus').value
  };
  const method = id ? 'PUT' : 'POST';
  const url = id ? `http://localhost:5000/api/employees/${id}` : 'http://localhost:5000/api/employees';
  await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  closeForm();
  loadEmployees();
}

async function deleteEmployee(id) {
  if (!confirm('Are you sure?')) return;
  await fetch(`http://localhost:5000/api/employees/${id}`, { method: 'DELETE' });
  loadEmployees();
}

if (document.getElementById('employees')) loadEmployees();

async function loadAttendance() {
  const empId = document.getElementById('filterEmployee').value;
  const date = document.getElementById('filterDate').value;
  let url = 'http://localhost:5000/api/attendance';
  if (empId || date) {
    const query = [];
    if (empId) query.push(`employee_id=${empId}`);
    if (date) query.push(`date=${date}`);
    url += '?' + query.join('&');
  }
  const res = await fetch(url);
  const data = await res.json();
  const tbody = document.querySelector('#attendanceTable tbody');
  tbody.innerHTML = '';
  data.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.attendance_id}</td>
      <td>${row.name}</td>
      <td>${row.date}</td>
      <td>${row.check_in || '-'}</td>
      <td>${row.check_out || '-'}</td>
      <td>${row.status}</td>
    `;
    tbody.appendChild(tr);
  });
}

async function populateEmployeeFilter() {
  const res = await fetch('http://localhost:5000/api/employees');
  const employees = await res.json();
  const select = document.getElementById('filterEmployee');
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = '-- All Employees --';
  select.appendChild(defaultOption);
  employees.forEach(emp => {
    const opt = document.createElement('option');
    opt.value = emp.employee_id;
    opt.textContent = emp.name;
    select.appendChild(opt);
  });
}

if (document.getElementById('attendance')) {
  populateEmployeeFilter();
  loadAttendance();
}

async function loadDepartmentSummary() {
  const table = document.getElementById('departmentSummaryTable');
  if (!table) return;

  try {
    const res = await fetch('http://localhost:5000/api/dashboard/departments');
    const data = await res.json();
    const tbody = table;
    tbody.innerHTML = '';

    data.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row.department_name}</td>
        <td>${row.total}</td>
        <td>${row.present}</td>
        <td>${row.half_day}</td> 
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Error loading department summary:', err);
  }
}


function generateYearOptions() {
  const currentYear = new Date().getFullYear();
  const yearSelect = document.getElementById('reportYear');
  for (let y = currentYear; y >= currentYear - 5; y--) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    yearSelect.appendChild(opt);
  }
  yearSelect.value = currentYear;
}

async function loadLeaveRequests() {
  const res = await fetch('http://localhost:5000/api/leave/admin/pending');
  const data = await res.json();
  const tbody = document.getElementById('leaveRequestsTable');
  tbody.innerHTML = '';
  data.forEach(req => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${req.name}</td>
      <td>${req.from_date}</td>
      <td>${req.to_date}</td>
      <td>${req.reason}</td>
      <td>${req.status}</td>
      <td>
        <button onclick="updateLeaveStatus(${req.leave_id}, 'Approved')">Approve</button>
        <button style="background-color:red"  onclick="updateLeaveStatus(${req.leave_id}, 'Rejected')">Reject</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

async function updateLeaveStatus(id, status) {
  const confirmed = confirm(`Are you sure to ${status.toLowerCase()} this request?`);
  if (!confirmed) return;

  await fetch(`http://localhost:5000/api/leave/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  loadLeaveRequests();
}

if (document.getElementById('leaveRequests')) {
  loadLeaveRequests();
}

if (document.getElementById('reports')) {
  generateYearOptions();
  loadReport();
}
function filterEmployeeTable() {
  const input = document.getElementById('employeeSearch').value.toLowerCase();
  const rows = document.querySelectorAll('#employeeTable tbody tr');
  rows.forEach(row => {
    const name = row.children[1].textContent.toLowerCase();
    const email = row.children[2].textContent.toLowerCase();
    row.style.display = (name.includes(input) || email.includes(input)) ? '' : 'none';
  });
}
async function loadReport() {
  const month = document.getElementById('reportMonth').value.padStart(2, '0');
  const year = document.getElementById('reportYear').value;
  const department = document.getElementById('reportDepartment')?.value || '';

  const url = `http://localhost:5000/api/attendance/report/monthly?month=${month}&year=${year}&department=${encodeURIComponent(department)}`;

  try {
    const res = await fetch(url);
    const { daysInMonth, data } = await res.json();

    // Generate Table Head
    const headRow = ['Employee ID','Employee Name', 'Department'];
    for (let i = 1; i <= daysInMonth; i++) {
      headRow.push(`Day ${i}`);
    }

    const thead = document.getElementById('reportTableHead');
    const tbody = document.getElementById('reportTableBody');
    thead.innerHTML = '';
    tbody.innerHTML = '';

    const trHead = document.createElement('tr');
    headRow.forEach(col => {
      const th = document.createElement('th');
      th.textContent = col;
      trHead.appendChild(th);
    });
    thead.appendChild(trHead);

    // Table Body
    data.forEach(emp => {
      const tr = document.createElement('tr');
      tr.innerHTML += `<td>${emp.employee_id}</td><td>${emp.name}</td><td>${emp.department}</td>`;
      emp.attendance.forEach(status => {
        tr.innerHTML += `<td>${status}</td>`;
      });
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error('Report loading error:', err);
    alert('Failed to load report. Please check the backend.');
  }
}

function exportTableToExcel(tableID = 'reportTable', filename = '') {
  const table = document.getElementById(tableID);
  const wb = XLSX.utils.table_to_book(table, { sheet: "Report" });
  filename = filename || `Attendance_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}

function exportTableToPDF() {
  const table = document.getElementById('reportTable');
  const doc = new jspdf.jsPDF('l', 'pt', 'a4');
  doc.autoTable({ html: table, theme: 'grid', startY: 20 });
  doc.save(`Attendance_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
}

function filterReportTable() {
  const input = document.getElementById("reportSearch").value.toLowerCase();
  const rows = document.querySelectorAll("#reportTableBody tr");
  rows.forEach(row => {
    const nameCell = row.querySelector("td:nth-child(2)");
    if (nameCell) {
      const name = nameCell.textContent.toLowerCase();
      row.style.display = name.includes(input) ? '' : 'none';
    }
  });
}

// Initialize year options
function populateReportYears() {
  const yearSelect = document.getElementById('reportYear');
  const currentYear = new Date().getFullYear();
  for (let i = currentYear; i >= currentYear - 5; i--) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = i;
    yearSelect.appendChild(opt);
  }
  yearSelect.value = currentYear;
}
populateReportYears();
