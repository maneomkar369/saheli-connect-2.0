// Admin Login and Dashboard Script

// Admin login page functionality
if (window.location.pathname === '/admin.html' || window.location.pathname === '/admin') {
    document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('adminUsername').value;
        const password = document.getElementById('adminPassword').value;

        try {
            const response = await fetch(`${API_BASE_URL}/auth/admin-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('userType', 'admin');
                localStorage.setItem('userName', 'Administrator');

                showToast('Login successful!', 'success');

                setTimeout(() => {
                    window.location.href = '/admin-dashboard';
                }, 1000);
            } else {
                showToast(data.message || 'Login failed', 'error');
            }
        } catch (error) {
            showToast('An error occurred. Please try again.', 'error');
            console.error('Login error:', error);
        }
    });
}
