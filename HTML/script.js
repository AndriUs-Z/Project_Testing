const API_URL = "http://localhost:3000";

// Form switching functions
function showRegister() {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
    registerForm.classList.add("slide-up");
    
    // Reset forms
    document.getElementById("loginFormElement").reset();
    clearAllErrors();
    
    // Hide any success messages
    document.getElementById("loginSuccess").classList.remove("show");
    document.getElementById("loginFormElement").style.display = "block";
}

function showLogin() {
    const registerForm = document.getElementById("registerForm");
    const loginForm = document.getElementById("loginForm");
    
    registerForm.classList.add("hidden");
    loginForm.classList.remove("hidden");
    loginForm.classList.add("slide-up");
    
    // Reset forms
    document.getElementById("registerFormElement").reset();
    clearAllErrors();
    
    // Hide any success messages
    document.getElementById("registerSuccess").classList.remove("show");
    document.getElementById("registerFormElement").style.display = "block";
}

function showForgot() {
    document.getElementById("loginForm").classList.add("hidden");
    document.getElementById("forgotForm").classList.remove("hidden");
    document.getElementById("forgotForm").classList.add("slide-up");
    clearAllErrors();
}

// Utility functions
function showNotification(message, type = 'success') {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => {
        notification.remove();
    });
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

function showError(fieldId, message) {
    const errorElement = document.getElementById(fieldId + 'Error');
    const formGroup = errorElement.closest('.form-group');
    
    errorElement.textContent = message;
    errorElement.classList.add('show');
    formGroup.classList.add('error');
}

function clearError(fieldId) {
    const errorElement = document.getElementById(fieldId + 'Error');
    const formGroup = errorElement.closest('.form-group');
    
    errorElement.classList.remove('show');
    formGroup.classList.remove('error');
}

function clearAllErrors() {
    const errors = document.querySelectorAll('.error-message');
    const formGroups = document.querySelectorAll('.form-group');
    
    errors.forEach(error => error.classList.remove('show'));
    formGroups.forEach(group => group.classList.remove('error'));
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validateUsername(username) {
    // Username: 3-20 characters, letters, numbers, underscores only
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
}

function validatePassword(password) {
    // Password: at least 6 characters
    return password.length >= 6;
}

function validateField(fieldId, value, skipRequired = false) {
    clearError(fieldId);
    
    // Skip validation if field is empty and skipRequired is true
    if (!value.trim() && skipRequired) {
        return true;
    }
    
    if (!value.trim()) {
        showError(fieldId, 'This field is required');
        return false;
    }
    
    // Email validation
    if (fieldId.includes('Email') && !validateEmail(value)) {
        showError(fieldId, 'Please enter a valid email address');
        return false;
    }
    
    // Username validation
    if (fieldId.includes('User') && !validateUsername(value)) {
        showError(fieldId, 'Username must be 3-20 characters (letters, numbers, underscores only)');
        return false;
    }
    
    // Password validation
    if (fieldId.includes('Pass') && !validatePassword(value)) {
        showError(fieldId, 'Password must be at least 6 characters');
        return false;
    }
    
    return true;
}

// Password toggle functionality
function setupPasswordToggle(inputId, toggleId) {
    const input = document.getElementById(inputId);
    const toggle = document.getElementById(toggleId);
    const eyeIcon = toggle.querySelector('.eye-icon');
    
    toggle.addEventListener('click', (e) => {
        e.preventDefault();
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        eyeIcon.classList.toggle('show-password', isPassword);
    });
}

// Floating labels functionality
function setupFloatingLabels() {
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        const checkValue = () => {
            input.classList.toggle('has-value', input.value.length > 0);
        };
        
        input.addEventListener('input', checkValue);
        input.addEventListener('focus', checkValue);
        input.addEventListener('blur', checkValue);
        checkValue(); // Initial check
    });
}

// Login function
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Validate fields
    const emailValid = validateField('email', email);
    const passwordValid = validateField('password', password);
    
    if (!emailValid || !passwordValid) {
        showNotification('Please fix the errors below', 'error');
        return;
    }
    
    submitBtn.classList.add('loading');
    
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('loginFormElement').style.display = 'none';
            document.getElementById('loginSuccess').classList.add('show');
            
            setTimeout(() => {
                showNotification(`Welcome back, ${data.user?.username || email}!`, 'success');
            }, 1500);
        } else {
            showNotification(data.message || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Connection error. Please check if the server is running.', 'error');
    } finally {
        submitBtn.classList.remove('loading');
    }
}

// Register function
async function handleRegister(e) {
    e.preventDefault();
    
    const email = document.getElementById("regEmail").value.trim();
    const username = document.getElementById("regUser").value.trim();
    const password = document.getElementById("regPass").value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Validate fields
    const emailValid = validateField('regEmail', email);
    const usernameValid = validateField('regUser', username);
    const passwordValid = validateField('regPass', password);
    
    if (!emailValid || !usernameValid || !passwordValid) {
        showNotification('Please fix the errors below', 'error');
        return;
    }
    
    // Show loading
    submitBtn.classList.add('loading');
    
    try {
        const response = await fetch(`${API_URL}/register`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({ username, password, email })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('registerFormElement').style.display = 'none';
            document.getElementById('registerSuccess').classList.add('show');

            setTimeout(() => {
                showOTPModal(email, "registration");
                showLogin();
                showNotification('Account created! Please verify with OTP.', 'success');
            }, 1500);
        } else {
            showNotification(data.message || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('Connection error. Please check if the server is running.', 'error');
    } finally {
        submitBtn.classList.remove('loading');
    }
}

// Real-time validation setup
function setupRealTimeValidation() {
    const validationFields = [
        { id: 'username', skipRequired: false },
        { id: 'password', skipRequired: false },
        { id: 'regEmail', skipRequired: false },
        { id: 'regUser', skipRequired: false },
        { id: 'regPass', skipRequired: false }
    ];
    
    validationFields.forEach(({ id, skipRequired }) => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', (e) => {
                const value = e.target.value;
                if (value.length > 0) {
                    validateField(id, value, skipRequired);
                } else {
                    clearError(id);
                }
            });
            
            input.addEventListener('blur', (e) => {
                const value = e.target.value;
                if (value.length > 0) {
                    validateField(id, value, false);
                }
            });
        }
    });
}

// Check server connection
async function checkServerConnection() {
    try {
        const response = await fetch(`${API_URL}/health`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });
        
        if (!response.ok) {
            throw new Error('Server not responding');
        }
        
        console.log('Server connection established');
    } catch (error) {
        console.warn('Server connection failed:', error.message);
        showNotification('Server is not running. Please start the server first.', 'error');
    }
}

// Initialize when DOM loads
const forgotForm = document.getElementById("forgotFormElement");

if (forgotForm) forgotForm.addEventListener("submit", handleForgot);

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing login system...');
    
    // Check server connection
    checkServerConnection();
    
    // Setup password toggles
    setupPasswordToggle('password', 'passwordToggle');
    setupPasswordToggle('regPass', 'regPasswordToggle');
    
    // Setup floating labels
    setupFloatingLabels();
    
    // Setup form handlers
    const loginForm = document.getElementById('loginFormElement');
    const registerForm = document.getElementById('registerFormElement');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Setup real-time validation
    setupRealTimeValidation();
    
    console.log('Login system initialized');
});

class OTPModal {
    constructor() {
        this.modal = document.getElementById('otpModal');
        this.closeBtn = document.getElementById('closeOtpModal');
        this.form = document.getElementById('otpForm');
        this.inputs = document.querySelectorAll('.otp-input');
        this.resendBtn = document.getElementById('resendOtpBtn');
        this.timerElement = document.getElementById('otpTimer');
        this.emailElement = document.getElementById('otpEmail');
        
        this.currentEmail = '';
        this.currentPurpose = '';
        this.timer = null;
        this.timeLeft = 600; // 10 minutes in seconds
        
        this.init();
    }
    
    init() {
        // Close modal events
        this.closeBtn.addEventListener('click', () => this.close());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal.querySelector('.modal-overlay')) {
                this.close();
            }
        });
        
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleVerify(e));
        
        // Resend OTP
        this.resendBtn.addEventListener('click', () => this.resendOTP());
        
        // OTP input handling
        this.setupOTPInputs();
    }
    
    setupOTPInputs() {
        this.inputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                const value = e.target.value;
                
                // Only allow numbers
                if (!/^\d*$/.test(value)) {
                    e.target.value = '';
                    return;
                }
                
                // Move to next input
                if (value && index < this.inputs.length - 1) {
                    this.inputs[index + 1].focus();
                }
                
                // Update visual state
                input.classList.toggle('filled', !!value);
                this.clearError();
            });
            
            input.addEventListener('keydown', (e) => {
                // Handle backspace
                if (e.key === 'Backspace' && !input.value && index > 0) {
                    this.inputs[index - 1].focus();
                }
                
                // Handle paste
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.form.dispatchEvent(new Event('submit'));
                }
            });
            
            // Handle paste
            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
                
                if (pastedData.length === 6) {
                    this.inputs.forEach((inp, idx) => {
                        inp.value = pastedData[idx] || '';
                        inp.classList.toggle('filled', !!inp.value);
                    });
                    this.inputs[5].focus();
                }
            });
        });
    }
    
    show(email, purpose = 'registration') {
        this.currentEmail = email;
        this.currentPurpose = purpose;
        this.emailElement.textContent = email;
        
        this.modal.classList.remove('hidden');
        this.inputs[0].focus();
        this.startTimer();
        
        // Clear previous values
        this.clearForm();
    }
    
    close() {
        this.modal.classList.add('hidden');
        this.clearForm();
        this.stopTimer();
    }
    
    clearForm() {
        this.inputs.forEach(input => {
            input.value = '';
            input.classList.remove('filled', 'error');
        });
        this.clearError();
    }
    
    clearError() {
        const errorElement = document.getElementById('otpError');
        errorElement.classList.remove('show');
        this.inputs.forEach(input => input.classList.remove('error'));
    }
    
    showError(message) {
        const errorElement = document.getElementById('otpError');
        errorElement.textContent = message;
        errorElement.classList.add('show');
        this.inputs.forEach(input => input.classList.add('error'));
    }
    
    getOTPValue() {
        return Array.from(this.inputs).map(input => input.value).join('');
    }
    
    startTimer() {
        this.timeLeft = 600; // 10 minutes
        this.updateTimerDisplay();
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            
            if (this.timeLeft <= 0) {
                this.stopTimer();
                this.showError('รหัส OTP หมดอายุแล้ว กรุณาขอรหัสใหม่');
            }
        }, 1000);
    }
    
    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    
    updateTimerDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    async handleVerify(e) {
        e.preventDefault();
        
        const otpValue = this.getOTPValue();
        
        if (otpValue.length !== 6) {
            this.showError('กรุณากรอกรหัส OTP ให้ครบ 6 หลัก');
            return;
        }
        
        const submitBtn = this.form.querySelector('.otp-verify-btn');
        submitBtn.classList.add('loading');
        
        try {
            const response = await fetch(`${API_URL}/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: this.currentEmail,
                    otp: otpValue,
                    purpose: this.currentPurpose
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showNotification('ยืนยัน OTP สำเร็จ!', 'success');
                this.close();
                
                // Handle different purposes
                if (this.currentPurpose === 'registration') {
                    // Verify email in database
                    await this.verifyEmail();
                }
                
                // Dispatch custom event for other components to handle
                document.dispatchEvent(new CustomEvent('otpVerified', {
                    detail: { email: this.currentEmail, purpose: this.currentPurpose }
                }));
                
            } else {
                this.showError(data.message || 'รหัส OTP ไม่ถูกต้อง');
            }
        } catch (error) {
            console.error('OTP verification error:', error);
            this.showError('เกิดข้อผิดพลาดในการตรวจสอบ OTP');
        } finally {
            submitBtn.classList.remove('loading');
        }
    }
    
    async verifyEmail() {
        try {
            await fetch(`${API_URL}/verify-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: this.currentEmail })
            });
        } catch (error) {
            console.error('Email verification error:', error);
        }
    }
    
    async resendOTP() {
        this.resendBtn.disabled = true;
        this.resendBtn.textContent = 'กำลังส่ง...';
        
        try {
            const response = await fetch(`${API_URL}/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: this.currentEmail,
                    purpose: this.currentPurpose
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showNotification('ส่ง OTP ใหม่เรียบร้อยแล้ว', 'success');
                this.startTimer();
                this.clearForm();
                this.inputs[0].focus();
            } else {
                showNotification(data.message || 'ไม่สามารถส่ง OTP ได้', 'error');
            }
        } catch (error) {
            console.error('Resend OTP error:', error);
            showNotification('เกิดข้อผิดพลาดในการส่ง OTP', 'error');
        } finally {
            this.resendBtn.disabled = false;
            this.resendBtn.textContent = 'ส่ง OTP ใหม่';
        }
    }
}

// Initialize OTP Modal
let otpModal;
document.addEventListener('DOMContentLoaded', () => {
    otpModal = new OTPModal();
});

// Helper function to show OTP modal
function showOTPModal(email, purpose = 'registration') {
    if (otpModal) {
        otpModal.show(email, purpose);
    }
}

// Helper function to send OTP
async function sendOTP(email, purpose = 'registration') {
    try {
        const response = await fetch(`${API_URL}/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, purpose })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('ส่ง OTP ไปยัง email เรียบร้อยแล้ว', 'success');
            showOTPModal(email, purpose);
            return true;
        } else {
            showNotification(data.message || 'ไม่สามารถส่ง OTP ได้', 'error');
            return false;
        }
    } catch (error) {
        console.error('Send OTP error:', error);
        showNotification('เกิดข้อผิดพลาดในการส่ง OTP', 'error');
        return false;
    }
}