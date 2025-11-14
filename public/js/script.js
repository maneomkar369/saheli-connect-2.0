// Landing page script

// Check if already logged in
if (localStorage.getItem('token')) {
    const userType = localStorage.getItem('userType');
    if (userType === 'employer') {
        window.location.href = '/employer-dashboard';
    } else if (userType === 'helper') {
        window.location.href = '/seeker-dashboard';
    } else if (userType === 'admin') {
        window.location.href = '/admin-dashboard';
    }
}

// Modal handling
const loginModal = document.getElementById('loginModal');
const signupModal = document.getElementById('signupModal');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const closeBtns = document.querySelectorAll('.close');
const switchToSignup = document.getElementById('switchToSignup');
const switchToLogin = document.getElementById('switchToLogin');

loginBtn.addEventListener('click', () => {
    loginModal.style.display = 'block';
});

signupBtn.addEventListener('click', () => {
    signupModal.style.display = 'block';
});

closeBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        this.closest('.modal').style.display = 'none';
    });
});

switchToSignup.addEventListener('click', (e) => {
    e.preventDefault();
    loginModal.style.display = 'none';
    signupModal.style.display = 'block';
});

switchToLogin.addEventListener('click', (e) => {
    e.preventDefault();
    signupModal.style.display = 'none';
    loginModal.style.display = 'block';
});

window.addEventListener('click', (e) => {
    if (e.target === loginModal) {
        loginModal.style.display = 'none';
    }
    if (e.target === signupModal) {
        signupModal.style.display = 'none';
    }
});

// Open signup with user type pre-selected
function openSignup(userType) {
    signupModal.style.display = 'block';
    document.getElementById('userType').value = userType;
}

// Login form submission
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userType', data.user.user_type);
            localStorage.setItem('userId', data.user.id);
            localStorage.setItem('userName', data.user.full_name);

            showToast('Login successful!', 'success');

            // Redirect based on user type
            setTimeout(() => {
                if (data.user.user_type === 'employer') {
                    window.location.href = '/employer-dashboard';
                } else if (data.user.user_type === 'helper') {
                    window.location.href = '/seeker-dashboard';
                }
            }, 1000);
        } else {
            showToast(data.message || 'Login failed', 'error');
        }
    } catch (error) {
        showToast('An error occurred. Please try again.', 'error');
        console.error('Login error:', error);
    }
});

// Signup form submission
document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        userType: document.getElementById('userType').value,
        fullName: document.getElementById('fullName').value,
        email: document.getElementById('signupEmail').value,
        phone: document.getElementById('phone').value,
        city: document.getElementById('city').value,
        password: document.getElementById('signupPassword').value
    };

    if (!formData.userType) {
        showToast('Please select user type', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.success) {
            showToast('Registration successful! Please login.', 'success');
            signupModal.style.display = 'none';
            setTimeout(() => {
                loginModal.style.display = 'block';
            }, 1000);
            
            // Reset form
            document.getElementById('signupForm').reset();
        } else {
            showToast(data.message || 'Registration failed', 'error');
        }
    } catch (error) {
        showToast('An error occurred. Please try again.', 'error');
        console.error('Signup error:', error);
    }
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
