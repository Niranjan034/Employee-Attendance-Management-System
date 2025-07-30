if (localStorage.getItem('role') !== 'employee') {
  window.location.href = 'index.html';
}

const userId = localStorage.getItem('userId');
const userName = localStorage.getItem('name');
document.getElementById('empName').textContent = userName;

function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
  document.querySelectorAll('.sidebar ul li').forEach(li => li.classList.remove('active'));
  document.querySelector(`.sidebar ul li[onclick="showSection('${id}')"]`).classList.add('active');
  if (id === 'attendance') loadTodayAttendance();
  if (id === 'history') loadHistory();
  if (id === 'leave') loadLeaveRequests();
  if (id === 'profile') loadProfile();
}

function logout() {
  localStorage.clear();
  window.location.href = 'index.html';
}

function isWithinWorkingHours() {
  const now = new Date();
  const hours = now.getHours();
  return hours >= 9 && hours < 18;
}

function isAfterWorkingHours() {
  const now = new Date();
  return now.getHours() >= 18;
}

async function markAttendance(type) {
  if (type === 'checkin' && !isWithinWorkingHours()) {
    alert('Check-in is allowed only between 9 AM and 6 PM');
    return;
  }
  if (type === 'checkout' && isAfterWorkingHours()) {
    alert('Check-out is not allowed after 6 PM');
    return;
  }

  const res = await fetch(`http://localhost:5000/api/attendance/mark`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employee_id: userId, type })
  });

  const data = await res.json();
  alert(data.message);
  loadTodayAttendance();
}

async function loadTodayAttendance() {
  const res = await fetch(`http://localhost:5000/api/attendance/today/${userId}`);
  const data = await res.json();
  document.getElementById('attendanceStatus').innerHTML = `
    <p><strong>Date:</strong> ${data.date || '-'}</p>
    <p><strong>Check In:</strong> ${data.check_in || '-'}</p>
    <p><strong>Check Out:</strong> ${data.check_out || '-'}</p>
    <p><strong>Status:</strong> ${data.status || '-'}</p>
  `;
  const now = new Date();
  const hour = now.getHours();
  const canCheckIn = !data.check_in && hour >= 9 && hour < 18;
  const canCheckOut = data.check_in && !data.check_out && hour < 18;
  document.getElementById('checkInBtn').classList.toggle('hidden', !canCheckIn);
  document.getElementById('checkOutBtn').classList.toggle('hidden', !canCheckOut);
}

function toggleLeaveForm() {
  const form = document.getElementById('leaveForm');
  form.classList.toggle('hidden');
}

function updateAttendanceStatus(message, type = 'info') {
  const statusDiv = document.getElementById('attendanceStatus');
  statusDiv.textContent = message;
  if (type === 'success') {
    statusDiv.style.backgroundColor = '#e8f5e9';
    statusDiv.style.borderLeftColor = '#2ecc71';
    statusDiv.style.color = '#2e7d32';
  } else if (type === 'error') {
    statusDiv.style.backgroundColor = '#fdecea';
    statusDiv.style.borderLeftColor = '#e74c3c';
    statusDiv.style.color = '#c0392b';
  } else {
    statusDiv.style.backgroundColor = '#fdf6e3';
    statusDiv.style.borderLeftColor = '#f39c12';
    statusDiv.style.color = '#7f8c8d';
  }
  statusDiv.style.display = 'block';
}

async function loadHistory() {
  const res = await fetch(`http://localhost:5000/api/attendance/history/${userId}`);
  const data = await res.json();
  const tbody = document.getElementById('historyTable');
  tbody.innerHTML = '';
  data.forEach(r => {
    const row = `<tr>
      <td>${r.date}</td>
      <td>${r.check_in || '-'}</td>
      <td>${r.check_out || '-'}</td>
      <td>${r.status}</td>
    </tr>`;
    tbody.innerHTML += row;
  });
}

async function applyLeave() {
  const from = document.getElementById('leaveFrom').value;
  const to = document.getElementById('leaveTo').value;
  const reason = document.getElementById('leaveReason').value;
  if (!from || !to || !reason) return alert('All fields required');
  const res = await fetch(`http://localhost:5000/api/leave`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employee_id: userId, from_date: from, to_date: to, reason })
  });
  const data = await res.json();
  alert(data.message);
  document.getElementById('leaveForm').classList.add('hidden');
  loadLeaveRequests();
}

async function loadLeaveRequests() {
  const res = await fetch(`http://localhost:5000/api/leave/${userId}`);
  const data = await res.json();
  const tbody = document.getElementById('leaveTable');
  tbody.innerHTML = '';
  data.forEach(r => {
    const row = `<tr>
      <td>${r.from_date}</td>
      <td>${r.to_date}</td>
      <td>${r.reason}</td>
      <td>${r.status}</td>
    </tr>`;
    tbody.innerHTML += row;
  });
}

async function loadProfile() {
  const res = await fetch(`http://localhost:5000/api/employees/${userId}`);
  if (!res.ok) {
    document.getElementById('profileBox').innerHTML = `<p>Error loading profile</p>`;
    return;
  }
  const emp = await res.json();
  document.getElementById('profileBox').innerHTML = `
    <p><strong>Name:</strong> ${emp.name}</p>
    <p><strong>Email:</strong> ${emp.email}</p>
    <p><strong>Department:</strong> ${emp.department || 'N/A'}</p> 
    <p><strong>Status:</strong> ${emp.status}</p>
    <p><strong>Join Date:</strong> ${emp.join_date}</p>
  `;
}

fetch(`http://localhost:5000/api/dashboard/employee/${userId}`)
  .then(res => res.json())
  .then(data => {
    document.getElementById('daysPresent').textContent = data.present || 0;
    document.getElementById('leavesTaken').textContent = data.leave || 0;
    document.getElementById('lateEntries').textContent = data.late || 0;
  });

function updateClock() {
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  document.getElementById('liveClock').textContent = `Current Time: ${timeString}`;
}
setInterval(updateClock, 1000);
updateClock();
