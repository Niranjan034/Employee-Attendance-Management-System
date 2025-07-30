document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  if (!username || !password) {
    alert('Please enter both username and password.');
    return;
  }

  try {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const result = await res.json();

    if (res.ok) {
      localStorage.setItem('userId', result.id);
      localStorage.setItem('role', result.role);
      localStorage.setItem('name', result.name);

      if (result.role === 'admin') {
        window.location.href = 'admin.html';
      } else if (result.role === 'employee') {
        window.location.href = 'employee.html';
      } else {
        alert('Unknown role. Contact admin.');
      }
    } else {
      alert(result.message || 'Invalid credentials.');
    }
  } catch (error) {
    console.error('Login error:', error);
    alert('Server error. Please try again later.');
  }
});
