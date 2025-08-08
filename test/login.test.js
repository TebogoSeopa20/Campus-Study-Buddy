// login.test.js
import {
    showStatus,
    setFieldError,
    clearFieldErrors,
    isValidEmail,
    togglePasswordVisibility,
} from '../src/frontend/js/login.js';

describe('Login Module', () => {
    let originalDocument;
    let originalWindow;
    let localStorageMock;

    beforeAll(() => {
        originalDocument = global.document;
        originalWindow = global.window;

        // Mock localStorage
        localStorageMock = {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn(),
            clear: jest.fn(),
        };
        Object.defineProperty(global.window, 'localStorage', {
            value: localStorageMock,
        });
    });

    afterAll(() => {
        global.document = originalDocument;
        global.window = originalWindow;
    });

    beforeEach(() => {
        jest.clearAllMocks();

        // Create complete DOM structure
        document.body.innerHTML = `
            <form id="login-form">
                <div class="form-fieldset">
                    <input id="login-email" type="email">
                    <span class="error-message"></span>
                </div>
                <div class="form-fieldset password-field">
                    <input id="login-password" type="password">
                    <span class="error-message"></span>
                </div>
                <div class="form-options">
                    <input type="checkbox" id="remember-me">
                </div>
                <button id="login-button">Sign In</button>
                <button id="google-signin-button">
                    <svg class="google-icon"></svg>
                    Sign in with Google
                </button>
            </form>
            <span class="toggle-password">
                <i class="fa-eye"></i>
            </span>
        `;

        // Mock window.location
        delete window.location;
        window.location = { href: '' };
    });

    describe('showStatus', () => {
        test('displays error message with correct styling', () => {
            showStatus('Test error', true);
            const status = document.querySelector('.status-message');
            expect(status.textContent).toBe('Test error');
            expect(status.classList.contains('error')).toBe(true);
        });

        test('displays success message with correct styling', () => {
            showStatus('Test success', false);
            const status = document.querySelector('.status-message');
            expect(status.textContent).toBe('Test success');
            expect(status.classList.contains('success')).toBe(true);
        });

        test('clears message after timeout', () => {
            jest.useFakeTimers();
            showStatus('Test message', true);
            
            const status = document.querySelector('.status-message');
            expect(status.classList.contains('error')).toBe(true);
            
            jest.advanceTimersByTime(5000);
            expect(status.classList.contains('error')).toBe(false);
            expect(status.style.opacity).toBe('0');
            
            jest.useRealTimers();
        });
    });

    describe('Field Validation', () => {
        describe('setFieldError', () => {
            test('adds error class and message to field', () => {
                setFieldError('login-email', 'Invalid email');
                const fieldset = document.getElementById('login-email').closest('.form-fieldset');
                expect(fieldset.classList.contains('error')).toBe(true);
                expect(fieldset.querySelector('.error-message').textContent).toBe('Invalid email');
            });
        });

        describe('clearFieldErrors', () => {
            test('removes error classes from all fields', () => {
                setFieldError('login-email', 'Test error');
                setFieldError('login-password', 'Test error');
                
                clearFieldErrors();
                
                document.querySelectorAll('.form-fieldset').forEach(fieldset => {
                    expect(fieldset.classList.contains('error')).toBe(false);
                });
            });
        });

        describe('isValidEmail', () => {
            test('validates correct email formats', () => {
                expect(isValidEmail('test@example.com')).toBe(true);
                expect(isValidEmail('user.name@domain.co')).toBe(true);
            });

            test('rejects invalid email formats', () => {
                expect(isValidEmail('plainaddress')).toBe(false);
                expect(isValidEmail('@missingusername.com')).toBe(false);
                expect(isValidEmail('username@.com')).toBe(false);
            });
        });
    });

    describe('Password Visibility Toggle', () => {
        test('toggles password field type', () => {
            const passwordInput = document.getElementById('login-password');
            expect(passwordInput.type).toBe('password');
            
            togglePasswordVisibility();
            expect(passwordInput.type).toBe('text');
            
            togglePasswordVisibility();
            expect(passwordInput.type).toBe('password');
        });

        test('toggles eye icon classes', () => {
            const icon = document.querySelector('.toggle-password i');
            expect(icon.classList.contains('fa-eye')).toBe(true);
            
            togglePasswordVisibility();
            expect(icon.classList.contains('fa-eye-slash')).toBe(true);
            expect(icon.classList.contains('fa-eye')).toBe(false);
            
            togglePasswordVisibility();
            expect(icon.classList.contains('fa-eye')).toBe(true);
            expect(icon.classList.contains('fa-eye-slash')).toBe(false);
        });
    });

    describe('Form Submission', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        test('handles successful login', async () => {
            const emailInput = document.getElementById('login-email');
            const passwordInput = document.getElementById('login-password');
            const rememberMe = document.getElementById('remember-me');
            const loginButton = document.getElementById('login-button');
            const loginForm = document.getElementById('login-form');

            // Set form values
            emailInput.value = 'test@example.com';
            passwordInput.value = 'password123';
            rememberMe.checked = true;

            // Trigger form submission
            loginForm.dispatchEvent(new Event('submit'));

            // Check loading state
            expect(loginButton.disabled).toBe(true);
            expect(loginButton.innerHTML).toContain('fa-spinner');

            // Advance timers
            await jest.advanceTimersByTimeAsync(3500);

            // Check final state
            expect(localStorageMock.setItem).toHaveBeenCalledWith('rememberedEmail', 'test@example.com');
            expect(window.location.href).toBe('../html/landing.html');
        });

        test('handles validation errors', () => {
            const loginForm = document.getElementById('login-form');
            
            // Submit empty form
            loginForm.dispatchEvent(new Event('submit'));
            
            const emailField = document.getElementById('login-email').closest('.form-fieldset');
            const passwordField = document.getElementById('login-password').closest('.form-fieldset');
            
            expect(emailField.classList.contains('error')).toBe(true);
            expect(passwordField.classList.contains('error')).toBe(true);
        });
    });

    describe('Google Sign-In', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        test('handles Google sign-in click', async () => {
            const googleButton = document.getElementById('google-signin-button');
            
            googleButton.dispatchEvent(new Event('click'));
            
            expect(googleButton.disabled).toBe(true);
            expect(googleButton.innerHTML).toContain('fa-spinner');
            
            await jest.advanceTimersByTimeAsync(3500);
            
            expect(window.location.href).toBe('../html/landing.html');
        });
    });

    describe('Remember Me Functionality', () => {
        test('remembers email when checkbox is checked', () => {
            const emailInput = document.getElementById('login-email');
            const rememberMe = document.getElementById('remember-me');
            
            emailInput.value = 'remember@me.com';
            rememberMe.checked = true;
            
            // Trigger form submission
            document.getElementById('login-form').dispatchEvent(new Event('submit'));
            
            expect(localStorageMock.setItem).toHaveBeenCalledWith('rememberedEmail', 'remember@me.com');
        });

        test('loads remembered email on page load', () => {
            localStorageMock.getItem.mockReturnValue('remembered@user.com');
            
            // Simulate DOMContentLoaded
            window.dispatchEvent(new Event('DOMContentLoaded'));
            
            expect(document.getElementById('login-email').value).toBe('remembered@user.com');
            expect(document.getElementById('remember-me').checked).toBe(true);
        });
    });
});