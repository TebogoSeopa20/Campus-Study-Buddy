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

        // Create basic DOM structure for login page
        document.body.innerHTML = `
            <form id="login-form">
                <div class="form-fieldset">
                    <input id="login-email" type="email">
                    <span class="error-message"></span>
                </div>
                <div class="form-fieldset">
                    <input id="login-password" type="password">
                    <span class="error-message"></span>
                </div>
                <div class="form-fieldset">
                    <input type="checkbox" id="remember-me">
                </div>
                <button id="login-button">Sign In</button>
            </form>
            <button id="google-signin-button"></button>
            <span class="toggle-password">
                <i class="fa-eye"></i>
            </span>
        `;
        
        // Ensure the status message div exists before tests run
        const loginForm = document.getElementById('login-form');
        const statusMessage = document.createElement('div');
        statusMessage.className = 'status-message';
        loginForm.insertBefore(statusMessage, loginForm.firstChild);

        // Mock window and document methods
        global.window = {
            ...global.window,
            addEventListener: jest.fn(),
            location: {
                href: '',
            },
        };
        global.document = {
            ...global.document,
            addEventListener: jest.fn((event, callback) => {
                if (event === 'DOMContentLoaded') {
                    callback();
                }
            }),
            createElement: jest.fn((tag) => {
                const element = originalDocument.createElement(tag);
                element.style = {}; // Add mock style object
                return element;
            }),
        };
        
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('showStatus', () => {
        test('should display an error status message', () => {
            showStatus('Error message', true);
            const status = document.querySelector('.status-message');
            expect(status.textContent).toBe('Error message');
            expect(status.classList.contains('error')).toBe(true);
        });

        test('should display a success status message', () => {
            showStatus('Success message', false);
            const status = document.querySelector('.status-message');
            expect(status.textContent).toBe('Success message');
            expect(status.classList.contains('success')).toBe(true);
        });

        test('should clear the status message after 5 seconds', () => {
            showStatus('Test message', true);
            const status = document.querySelector('.status-message');
            expect(status.classList.contains('error')).toBe(true);

            jest.advanceTimersByTime(5000);
            expect(status.classList.contains('error')).toBe(false);
            expect(status.style.opacity).toBe('0');
        });
    });

    describe('setFieldError and clearFieldErrors', () => {
        test('setFieldError should add error class and message', () => {
            setFieldError('login-email', 'Invalid email');
            const fieldset = document.getElementById('login-email').closest('.form-fieldset');
            const errorMessage = fieldset.querySelector('.error-message');
            
            expect(fieldset.classList.contains('error')).toBe(true);
            expect(errorMessage.textContent).toBe('Invalid email');
        });

        test('clearFieldErrors should remove error classes', () => {
            // First, set an error
            setFieldError('login-email', 'Invalid email');
            const fieldset = document.getElementById('login-email').closest('.form-fieldset');
            expect(fieldset.classList.contains('error')).toBe(true);

            // Then, clear errors
            clearFieldErrors();
            expect(fieldset.classList.contains('error')).toBe(false);
        });
    });

    describe('isValidEmail', () => {
        test('should return true for a valid email', () => {
            expect(isValidEmail('test@example.com')).toBe(true);
        });

        test('should return false for an invalid email', () => {
            expect(isValidEmail('invalid-email')).toBe(false);
            expect(isValidEmail('no-at.com')).toBe(false);
            expect(isValidEmail('@domain.com')).toBe(false);
        });
    });

    describe('togglePasswordVisibility', () => {
        test('should change input type to text and icon class on first click', () => {
            const passwordInput = document.getElementById('login-password');
            const icon = document.querySelector('.toggle-password i');
            
            togglePasswordVisibility();
            
            expect(passwordInput.type).toBe('text');
            expect(icon.classList.contains('fa-eye-slash')).toBe(true);
            expect(icon.classList.contains('fa-eye')).toBe(false);
        });

        test('should change input type back to password and icon class on second click', () => {
            const passwordInput = document.getElementById('login-password');
            const icon = document.querySelector('.toggle-password i');

            // First call to toggle to text
            togglePasswordVisibility();
            // Second call to toggle back to password
            togglePasswordVisibility();

            expect(passwordInput.type).toBe('password');
            expect(icon.classList.contains('fa-eye')).toBe(true);
            expect(icon.classList.contains('fa-eye-slash')).toBe(false);
        });
    });

    describe('Event Listeners', () => {
        // Need to test the logic inside the event listeners
        
        test('should handle form submission with valid data', async () => {
            const loginButton = document.getElementById('login-button');
            const loginForm = document.getElementById('login-form');
            const emailInput = document.getElementById('login-email');
            const passwordInput = document.getElementById('login-password');
            const rememberMe = document.getElementById('remember-me');

            emailInput.value = 'test@example.com';
            passwordInput.value = 'password123';
            rememberMe.checked = true;

            // Mock the event
            const event = {
                preventDefault: jest.fn(),
            };

            // Simulate the submit event
            loginForm.dispatchEvent(new Event('submit', event));
            
            // Initial state after submit
            expect(event.preventDefault).toHaveBeenCalled();
            expect(loginButton.disabled).toBe(true);
            expect(loginButton.innerHTML).toContain('fa-spinner');

            // Fast-forward through the simulated API call and redirection
            await jest.advanceTimersByTimeAsync(3500);

            // Final state after successful login
            expect(localStorageMock.setItem).toHaveBeenCalledWith('rememberedEmail', 'test@example.com');
            expect(document.querySelector('.status-message').textContent).toContain('successful');
            expect(window.location.href).toBe('../html/landing.html');
        });

        test('should handle Google sign-in click', async () => {
            const googleButton = document.getElementById('google-signin-button');

            // Mock the event
            const event = { preventDefault: jest.fn() };
            
            // Simulate the click event
            googleButton.dispatchEvent(new Event('click', event));

            expect(googleButton.disabled).toBe(true);
            expect(googleButton.innerHTML).toContain('fa-spinner');
            
            // Fast-forward through the simulated API call and redirection
            await jest.advanceTimersByTimeAsync(3500);

            expect(document.querySelector('.status-message').textContent).toContain('successful');
            expect(window.location.href).toBe('../html/landing.html');
        });

        test('should handle toggle password click', () => {
            const passwordInput = document.getElementById('login-password');
            const togglePasswordSpan = document.querySelector('.toggle-password');
            const icon = togglePasswordSpan.querySelector('i');

            // Simulate click
            togglePasswordSpan.dispatchEvent(new Event('click'));
            
            expect(passwordInput.type).toBe('text');
            expect(icon.classList.contains('fa-eye-slash')).toBe(true);
            
            // Simulate another click
            togglePasswordSpan.dispatchEvent(new Event('click'));

            expect(passwordInput.type).toBe('password');
            expect(icon.classList.contains('fa-eye')).toBe(true);
        });

        test('should check for remembered user on DOMContentLoaded', () => {
            // Set up a remembered email in the mock storage
            localStorageMock.getItem.mockReturnValue('remembered@user.com');
            
            // Simulate DOMContentLoaded event
            window.addEventListener.mock.calls.find(call => call[0] === 'DOMContentLoaded')[1]();

            expect(localStorageMock.getItem).toHaveBeenCalledWith('rememberedEmail');
            expect(document.getElementById('login-email').value).toBe('remembered@user.com');
            expect(document.getElementById('remember-me').checked).toBe(true);
        });
    });
});