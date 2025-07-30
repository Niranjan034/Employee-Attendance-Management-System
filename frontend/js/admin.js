if (localStorage.getItem('role') !== 'admin') {
  window.location.href = 'index.html';
}
document.getElementById('holidayMonth')?.addEventListener('change', loadHolidays);
document.getElementById('holidayYear')?.addEventListener('change', loadHolidays);

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
        <button onclick="enableInlineEdit(this.closest('tr'))">Edit</button>
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
    const { daysInMonth, dateHeaders, data } = await res.json();

    const headRow = ['Employee ID', 'Employee Name', 'Department', ...dateHeaders];

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

    data.forEach(emp => {
      const tr = document.createElement('tr');
      tr.innerHTML += `<td>${emp.employee_id}</td><td>${emp.name}</td><td>${emp.department}</td>`;
      emp.attendance.forEach(status => {
        const td = document.createElement('td');
        td.textContent = status;

        if (status === 'Holiday') {
          td.classList.add('holiday');
        }

        tr.appendChild(td);
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
async function loadHolidays() {
  const month = document.getElementById('holidayMonth')?.value;
  const year = document.getElementById('holidayYear')?.value;

  if (!month || !year) return;

  try {
    const url = `http://localhost:5000/api/holidays?month=${month.padStart(2, '0')}&year=${year}`;
    const res = await fetch(url);
    const holidays = await res.json();

    const holidayTableBody = document.getElementById('holidayTableBody');
    holidayTableBody.innerHTML = '';

    if (!Array.isArray(holidays) || holidays.length === 0) {
      holidayTableBody.innerHTML = `<tr><td colspan="2">No holidays for this month.</td></tr>`;
      return;
    }

    holidays.forEach(holiday => {
      const holidayDate = new Date(holiday.date);
      const formattedDate = holidayDate.toLocaleDateString('en-IN');
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${formattedDate}</td>
        <td>${holiday.name}</td>
      `;
      holidayTableBody.appendChild(tr);
    });
  } catch (err) {
    console.error('Failed to load holidays:', err);
    const holidayTableBody = document.getElementById('holidayTableBody');
    holidayTableBody.innerHTML = `<tr><td colspan="2">Error loading holidays.</td></tr>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const monthSelect = document.getElementById('holidayMonth');
  const yearSelect = document.getElementById('holidayYear');

  if (monthSelect && yearSelect) {
    monthSelect.addEventListener('change', loadHolidays);
    yearSelect.addEventListener('change', loadHolidays);
  }

  loadHolidays();
});

function populateMonthAndYearSelectors() {
  const monthSelect = document.getElementById('holidayMonth');
  const yearSelect = document.getElementById('holidayYear');

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  for (let i = currentMonth; i < 12; i++) {
    const option = document.createElement('option');
    option.value = String(i + 1).padStart(2, '0');
    option.textContent = monthNames[i];
    monthSelect.appendChild(option);
  }

  for (let y = currentYear; y <= currentYear + 2; y++) {
    const option = document.createElement('option');
    option.value = y;
    option.textContent = y;
    yearSelect.appendChild(option);
  }

  monthSelect.value = String(currentMonth + 1).padStart(2, '0');
  yearSelect.value = currentYear;
}

populateMonthAndYearSelectors();

function enableInlineEdit(row) {
  const tds = row.querySelectorAll('td');
  const id = tds[0].innerText;
  const name = tds[1].innerText;
  const email = tds[2].innerText;
  const dept = tds[3].innerText;
  const status = tds[4].innerText;

  row.dataset.originalName = name;
  row.dataset.originalEmail = email;
  row.dataset.originalDept = dept;
  row.dataset.originalStatus = status;

  tds[1].innerHTML = `<input type="text" value="${name}" />`;
  tds[2].innerHTML = `<input type="email" value="${email}" />`;

  tds[3].innerHTML = `
    <select>
      <option${dept === 'HR' ? ' selected' : ''}>HR</option>
      <option${dept === 'Technical' ? ' selected' : ''}>Technical</option>
      <option${dept === 'Sales' ? ' selected' : ''}>Sales</option>
      <option${dept === 'Marketing' ? ' selected' : ''}>Marketing</option>
      <option${dept === 'Finance' ? ' selected' : ''}>Finance</option>
      <option${dept === 'Support' ? ' selected' : ''}>Support</option>
    </select>
  `;

  tds[4].innerHTML = `
    <select>
      <option${status === 'Active' ? ' selected' : ''}>Active</option>
      <option${status === 'Inactive' ? ' selected' : ''}>Inactive</option>
    </select>
  `;

  tds[5].innerHTML = `
    <button onclick="saveInlineEdit(this)">Save</button>
    <button onclick="cancelInlineEdit(this)">Cancel</button>
  `;
}

function saveInlineEdit(button) {
  const row = button.closest('tr');
  const tds = row.querySelectorAll('td');
  const id = tds[0].innerText;
  const updatedName = tds[1].querySelector('input').value;
  const updatedEmail = tds[2].querySelector('input').value;
  const updatedDept = tds[3].querySelector('select').value;
  const updatedStatus = tds[4].querySelector('select').value;

  tds[1].innerText = updatedName;
  tds[2].innerText = updatedEmail;
  tds[3].innerText = updatedDept;
  tds[4].innerText = updatedStatus;

  tds[5].innerHTML = `
    <button class="edit-btn" onclick="enableInlineEdit(this.closest('tr'))">Edit</button>
    <button class="delete-btn" onclick="deleteEmployee(${id})">Delete</button>
  `;
}

function cancelInlineEdit(button) {
  loadEmployeeData();
}
function cancelInlineEdit(button) {
  const row = button.closest('tr');
  const tds = row.querySelectorAll('td');

  const originalName = row.dataset.originalName;
  const originalEmail = row.dataset.originalEmail;
  const originalDept = row.dataset.originalDept;
  const originalStatus = row.dataset.originalStatus;
  const id = tds[0].innerText;

  tds[1].innerText = originalName;
  tds[2].innerText = originalEmail;
  tds[3].innerText = originalDept;
  tds[4].innerText = originalStatus;

  tds[5].innerHTML = `
    <button class="edit-btn" onclick="enableInlineEdit(this.closest('tr'))">Edit</button>
    <button class="delete-btn" onclick="deleteEmployee(${id})">Delete</button>
  `;

  delete row.dataset.originalName;
  delete row.dataset.originalEmail;
  delete row.dataset.originalDept;
  delete row.dataset.originalStatus;
}
