let isLoginMode = true;

function toggleForm() {
    isLoginMode = !isLoginMode;
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const toggleText = document.getElementById('toggle-text');

    if (isLoginMode) {
        loginForm.classList.add('active');
        signupForm.classList.remove('active');
        toggleText.innerHTML = 'Chưa có tài khoản? <span id="toggle-btn" onclick="toggleForm()">Đăng ký ngay</span>';
    } else {
        loginForm.classList.remove('active');
        signupForm.classList.add('active');
        toggleText.innerHTML = 'Đã có tài khoản? <span id="toggle-btn" onclick="toggleForm()">Đăng nhập</span>';
    }

    clearErrors();
}

async function handleLogin(event) {
    event.preventDefault();
    clearErrors();

    const identifier = document.getElementById('login-identifier').value.trim();
    const password = document.getElementById('login-password').value.trim();
    const loginBtn = document.getElementById('login-btn');
    const errorDiv = document.getElementById('login-error');

    if (!identifier || !password) {
        showError(errorDiv, 'Vui lòng nhập đầy đủ thông tin');
        return;
    }

    loginBtn.disabled = true;
    loginBtn.classList.add('loading');

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier, password })
        });

        const data = await response.text();

        if (response.ok) {
            showSuccess('Đăng nhập thành công!', 'Chào mừng bạn quay trở lại!');
            setTimeout(() => { window.location.href = '/'; }, 2000);
        } else {
            showError(errorDiv, data);
        }
    } catch (error) {
        showError(errorDiv, 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
        loginBtn.disabled = false;
        loginBtn.classList.remove('loading');
    }
}

async function handleRegister(event) {
    event.preventDefault();
    clearErrors();

    const username = document.getElementById('signup-username').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value.trim();
    const confirmPassword = document.getElementById('signup-confirm-password').value.trim();
    const signupBtn = document.getElementById('signup-btn');
    const errorDiv = document.getElementById('signup-error');

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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError(errorDiv, 'Email không hợp lệ');
        return;
    }

    signupBtn.disabled = true;
    signupBtn.classList.add('loading');

    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.text();

        if (response.ok) {
            showSuccess('Đăng ký thành công!', 'Tài khoản của bạn đã được tạo. Chuyển sang đăng nhập...');
            document.getElementById('signup-form').reset();
            setTimeout(() => {
                toggleForm();
                closeSuccessModal();
            }, 2000);
        } else {
            showError(errorDiv, data);
        }
    } catch (error) {
        showError(errorDiv, 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
        signupBtn.disabled = false;
        signupBtn.classList.remove('loading');
    }
}

function showError(errorDiv, message) {
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
}

function clearErrors() {
    document.querySelectorAll('.error-message').forEach(div => {
        div.textContent = '';
        div.classList.remove('show');
    });
}

function showSuccess(title, message) {
    document.getElementById('success-title').textContent = title;
    document.getElementById('success-message').textContent = message;
    document.getElementById('success-modal').classList.add('show');
}

function closeSuccessModal() {
    document.getElementById('success-modal').classList.remove('show');
}

window.addEventListener('click', (event) => {
    const modal = document.getElementById('success-modal');
    if (event.target === modal) closeSuccessModal();
});