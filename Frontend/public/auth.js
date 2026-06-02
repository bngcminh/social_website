let isLoginMode = true; // Track current mode

// Toggle between Login and Signup
function toggleForm() {
    isLoginMode = !isLoginMode;
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const authTitle = document.getElementById('auth-title');
    const toggleText = document.getElementById('toggle-text');

    if (isLoginMode) {
        // Switch to Login
        loginForm.classList.add('active');
        signupForm.classList.remove('active');
        authTitle.textContent = 'Đăng Nhập';
        toggleText.innerHTML = 'Chưa có tài khoản? <span id="toggle-btn" onclick="toggleForm()">Đăng ký ngay</span>';
    } else {
        // Switch to Signup
        loginForm.classList.remove('active');
        signupForm.classList.add('active');
        authTitle.textContent = 'Đăng Ký';
        toggleText.innerHTML = 'Đã có tài khoản? <span id="toggle-btn" onclick="toggleForm()">Đăng nhập</span>';
    }

    // Clear error messages
    clearErrors();
}

// Handle Login
async function handleLogin(event) {
    event.preventDefault();
    clearErrors();

    const identifier = document.getElementById('login-identifier').value.trim();
    const password = document.getElementById('login-password').value.trim();
    const loginBtn = document.getElementById('login-btn');
    const errorDiv = document.getElementById('login-error');

    // Validation
    if (!identifier || !password) {
        showError(errorDiv, 'Vui lòng nhập đầy đủ thông tin');
        return;
    }

    // Show loading state
    loginBtn.disabled = true;
    loginBtn.classList.add('loading');

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                identifier: identifier,
                password: password
            })
        });

        const data = await response.text();

        if (response.ok) {
            // Show success message
            showSuccess('Đăng nhập thành công!', 'Chào mừng bạn quay trở lại!');
            
            // Redirect to home after 2 seconds
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        } else {
            showError(errorDiv, data);
        }
    } catch (error) {
        console.error('Login error:', error);
        showError(errorDiv, 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
        loginBtn.disabled = false;
        loginBtn.classList.remove('loading');
    }
}

// Handle Signup
async function handleRegister(event) {
    event.preventDefault();
    clearErrors();

    const username = document.getElementById('signup-username').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value.trim();
    const confirmPassword = document.getElementById('signup-confirm-password').value.trim();
    const signupBtn = document.getElementById('signup-btn');
    const errorDiv = document.getElementById('signup-error');

    // Validation
    if (!username || !email || !password || !confirmPassword) {
        showError(errorDiv, 'Vui lòng nhập đầy đủ thông tin');
        return;
    }

    if (username.length < 6) {
        showError(errorDiv, 'Tên người dùng phải ít nhất 6 ký tự');
        return;
    }

    if (password.length < 6) {
        showError(errorDiv, 'Mật khẩu phải ít nhất 6 ký tự');
        return;
    }

    if (password !== confirmPassword) {
        showError(errorDiv, 'Mật khẩu xác nhận không khớp');
        return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError(errorDiv, 'Email không hợp lệ');
        return;
    }

    // Show loading state
    signupBtn.disabled = true;
    signupBtn.classList.add('loading');

    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                email: email,
                password: password
            })
        });

        const data = await response.text();

        if (response.ok) {
            // Show success message
            showSuccess('Đăng ký thành công!', 'Tài khoản của bạn đã được tạo. Chuyển sang đăng nhập...');
            
            // Clear form
            document.getElementById('signup-form').reset();

            // Switch to login after 2 seconds
            setTimeout(() => {
                toggleForm();
                closeSuccessModal();
            }, 2000);
        } else {
            showError(errorDiv, data);
        }
    } catch (error) {
        console.error('Register error:', error);
        showError(errorDiv, 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
        signupBtn.disabled = false;
        signupBtn.classList.remove('loading');
    }
}

// Show error message
function showError(errorDiv, message) {
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
}

// Clear all error messages
function clearErrors() {
    const errorDivs = document.querySelectorAll('.error-message');
    errorDivs.forEach(div => {
        div.textContent = '';
        div.classList.remove('show');
    });
}

// Show success modal
function showSuccess(title, message) {
    const modal = document.getElementById('success-modal');
    document.getElementById('success-title').textContent = title;
    document.getElementById('success-message').textContent = message;
    modal.classList.add('show');
}

// Close success modal
function closeSuccessModal() {
    const modal = document.getElementById('success-modal');
    modal.classList.remove('show');
}

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    const modal = document.getElementById('success-modal');
    if (event.target === modal) {
        closeSuccessModal();
    }
});

// Allow Enter key to submit form
document.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        if (isLoginMode) {
            const loginForm = document.getElementById('login-form');
            if (loginForm.classList.contains('active')) {
                handleLogin(event);
            }
        } else {
            const signupForm = document.getElementById('signup-form');
            if (signupForm.classList.contains('active')) {
                handleRegister(event);
            }
        }
    }
});
