// DOM Elements
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('login-email');
const passwordInput = document.getElementById('login-password');
const loginButton = document.getElementById('login-button');
const googleButton = document.getElementById('google-signin-button');
const togglePassword = document.querySelector('.toggle-password');
const rememberMe = document.getElementById('remember-me');

// Create status message element
const statusMessage = document.createElement('div');
statusMessage.className = 'status-message';
loginForm.insertBefore(statusMessage, loginForm.firstChild);

// Check for remembered user
window.addEventListener('DOMContentLoaded', () => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
        emailInput.value = rememberedEmail;
        rememberMe.checked = true;
    }
});

// Display status message
export function showStatus(message, isError = true) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${isError ? 'error' : 'success'}`;
    
    setTimeout(() => {
        statusMessage.className = 'status-message';
        statusMessage.style.opacity = '0';
    }, 5000);
}

// Field error handling
export function setFieldError(fieldId, message) {
    const field = document.getElementById(fieldId).closest('.form-fieldset');
    field.classList.add('error');
    const errorElement = field.querySelector('.error-message');
    errorElement.textContent = message;
}

export function clearFieldErrors() {
    document.querySelectorAll('.form-fieldset').forEach(field => {
        field.classList.remove('error');
    });
}

// Validate email format
export function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Toggle Password Visibility
export function togglePasswordVisibility() {
    const icon = togglePassword.querySelector('i');
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

// Handle form submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFieldErrors();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    // Validate inputs
    let isValid = true;
    
    if (!email) {
        setFieldError('login-email', 'Email is required');
        isValid = false;
    } else if (!isValidEmail(email)) {
        setFieldError('login-email', 'Please enter a valid email');
        isValid = false;
    }
    
    if (!password) {
        setFieldError('login-password', 'Password is required');
        isValid = false;
    } else if (password.length < 6) {
        setFieldError('login-password', 'Password must be at least 6 characters');
        isValid = false;
    }
    
    if (!isValid) return;
    
    try {
        // Show loading state
        loginButton.disabled = true;
        loginButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // For demo purposes, accept any email that looks valid and password >= 6 chars
        if (rememberMe.checked) {
            localStorage.setItem('rememberedEmail', email);
        } else {
            localStorage.removeItem('rememberedEmail');
        }
        
        showStatus('Login successful! Redirecting...', false);
        
        // Redirect after a delay (simulating successful login)
        setTimeout(() => {
            window.location.href = '../html/landing.html'; // Change to your actual success page
        }, 2000);
    } catch (error) {
        console.error("Login error:", error);
        showStatus("Login failed. Please try again.", true);
    } finally {
        loginButton.disabled = false;
        loginButton.textContent = 'Sign In';
    }
});

// Google Sign-In (simulated)
googleButton.addEventListener('click', async () => {
    try {
        // Show loading state
        googleButton.disabled = true;
        googleButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        showStatus('Google sign-in successful! Redirecting...', false);
        
        // Redirect after a delay (simulating successful login)
        setTimeout(() => {
            window.location.href = '../html/landing.html'; // Change to your actual success page
        }, 2000);
    } catch (error) {
        console.error("Google sign-in error:", error);
        showStatus("Google sign-in failed. Please try again.", true);
    } finally {
        googleButton.disabled = false;
        googleButton.innerHTML = `
            <svg class="google-icon" viewBox="0 0 24 24" width="18" height="18">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
        `;
    }
});

// Toggle password visibility
togglePassword.addEventListener('click', togglePasswordVisibility);

// Default export for convenience
export default {
    showStatus,
    setFieldError,
    clearFieldErrors,
    isValidEmail,
    togglePasswordVisibility
};