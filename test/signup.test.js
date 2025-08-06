// Import the functions from auth.js that interact with the DOM and Firebase
// We assume auth.js is located at '../js/auth.js' relative to this test file.
import '../js/auth.js'; // Import auth.js to attach event listeners

// Mock Firebase modules
// We need to mock the entire firebase/app, firebase/auth, and firebase/firestore modules
// because auth.js imports directly from their CDN URLs.
// This setup ensures that when auth.js tries to call Firebase functions, it calls our mocks instead.
jest.mock('https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js', () => ({
    initializeApp: jest.fn(() => ({
        name: 'mockApp' // Return a mock app object
    })),
}));

jest.mock('https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js', () => {
    const mockAuth = {
        currentUser: null, // Mock current user state
        onAuthStateChanged: jest.fn((auth, callback) => {
            // Simulate initial auth state immediately
            callback(mockAuth.currentUser);
            // Return an unsubscribe function (optional for simple tests)
            return jest.fn();
        }),
        createUserWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: { uid: 'mock-uid-new', displayName: null } })),
        signInWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: { uid: 'mock-uid-existing', displayName: 'Existing User' } })),
        signOut: jest.fn(() => Promise.resolve()),
        updateProfile: jest.fn(() => Promise.resolve()),
        signInWithCustomToken: jest.fn(() => Promise.resolve()),
        signInAnonymously: jest.fn(() => Promise.resolve()),
    };
    return {
        getAuth: jest.fn(() => mockAuth),
        createUserWithEmailAndPassword: mockAuth.createUserWithEmailAndPassword,
        signInWithEmailAndPassword: mockAuth.signInWithEmailAndPassword,
        signOut: mockAuth.signOut,
        onAuthStateChanged: mockAuth.onAuthStateChanged,
        updateProfile: mockAuth.updateProfile,
        signInWithCustomToken: mockAuth.signInWithCustomToken,
        signInAnonymously: mockAuth.signInAnonymously,
    };
});

jest.mock('https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js', () => ({
    getFirestore: jest.fn(() => ({
        name: 'mockFirestore'
    })),
    doc: jest.fn((db, path, docId) => ({
        _path: `${path}/${docId}` // Mock a simple path representation
    })),
    setDoc: jest.fn(() => Promise.resolve()),
    getDoc: jest.fn(() => Promise.resolve({
        exists: jest.fn(() => false), // Default: doc does not exist
        data: jest.fn(() => ({})),
    })),
}));

// Mock global variables expected by auth.js in the Canvas environment
global.__app_id = 'test-app-id';
global.__firebase_config = JSON.stringify({
    apiKey: "mock-api-key",
    authDomain: "mock-auth-domain",
    projectId: "mock-project-id",
    storageBucket: "mock-storage-bucket",
    messagingSenderId: "mock-messaging-sender-id",
    appId: "mock-app-id"
});
global.__initial_auth_token = 'mock-auth-token';


describe('Signup Page Functionality', () => {
    // Store original window.location for restoration
    const originalLocation = window.location;

    beforeEach(() => {
        // Reset the DOM before each test
        document.body.innerHTML = `
            <main class="auth-main">
                <section class="auth-container">
                    <article class="auth-card">
                        <h2>Create Your Account</h2>
                        <p class="signup-intro">Join Wits and connect with peers</p>

                        <form id="signup-form" class="auth-form" novalidate>
                            <!-- Step 1: Role Selection -->
                            <div class="form-step active" id="step1">
                                <h3 class="step-title">Select Your Role</h3>
                                <div class="form-group">
                                    <div class="role-selection">
                                        <div class="role-option">
                                            <input type="radio" id="student" name="role" value="student" checked>
                                            <label for="student">
                                                <i class="fas fa-user-graduate"></i>
                                                <span>Student</span>
                                            </label>
                                        </div>
                                        <div class="role-option">
                                            <input type="radio" id="tutor" name="role" value="tutor">
                                            <label for="tutor">
                                                <i class="fas fa-chalkboard-teacher"></i>
                                                <span>Tutor</span>
                                            </label>
                                        </div>
                                    </div>
                                    <output class="error-message" for="role"></output>
                                </div>
                                
                                <div class="step-separator">
                                    <span>Step 1 of 2</span>
                                </div>
                                
                                <div class="form-navigation">
                                    <button type="button" class="btn btn-primary next-btn">Continue</button>
                                </div>
                            </div>

                            <!-- Step 2: Personal Information -->
                            <div class="form-step" id="step2">
                                <h3 class="step-title">Personal Information</h3>
                                
                                <div class="form-group">
                                    <label for="signup-name">Full Name*</label>
                                    <input type="text" id="signup-name" placeholder="John Doe" class="styled-input" required>
                                    <output class="error-message" for="signup-name"></output>
                                </div>
                                
                                <div class="form-group">
                                    <label for="signup-email">Email Address*</label>
                                    <input type="email" id="signup-email" placeholder="your.email@example.com" class="styled-input" required>
                                    <output class="error-message" for="signup-email"></output>
                                </div>
                                
                                <div class="form-group">
                                    <label for="signup-phone">Contact Number</label>
                                    <input type="tel" id="signup-phone" placeholder="(+27) 63 123 0144" class="styled-input">
                                    <output class="error-message" for="signup-phone"></output>
                                </div>
                                
                                <div class="form-group">
                                    <label for="signup-password">Password*</label>
                                    <div class="password-input-wrapper">
                                        <input type="password" id="signup-password" placeholder="Create a strong password" class="styled-input" required>
                                        <button type="button" class="toggle-password-visibility">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                    <output class="error-message" for="signup-password"></output>
                                    <div class="password-requirements">
                                        <p>Password must:</p>
                                        <ul>
                                            <li id="length">Be at least 8 characters long</li>
                                            <li id="uppercase">Contain at least 1 uppercase letter</li>
                                            <li id="lowercase">Contain at least 1 lowercase letter</li>
                                            <li id="number">Contain at least 1 number</li>
                                            <li id="special">Contain at least 1 special character</li>
                                        </ul>
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="signup-confirm-password">Confirm Password*</label>
                                    <div class="password-input-wrapper">
                                        <input type="password" id="signup-confirm-password" placeholder="Confirm your password" class="styled-input" required>
                                        <button type="button" class="toggle-password-visibility">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                    <output class="error-message" for="signup-confirm-password"></output>
                                </div>
                                
                                <div class="form-group terms-container">
                                    <div class="checkbox-group">
                                        <input type="checkbox" id="termsAgree" name="termsAgree" class="styled-checkbox" required>
                                        <label for="termsAgree">I agree to the <a href="#" class="terms-link">Terms of Service</a> and <a href="#" class="privacy-link">Privacy Policy</a></label>
                                    </div>
                                    <output class="error-message" for="termsAgree"></output>
                                </div>
                                
                                <div class="step-separator">
                                    <span>Step 2 of 2</span>
                                </div>

                                <div class="form-navigation">
                                    <button type="button" class="btn btn-outline prev-btn">Back</button>
                                    <button type="submit" class="btn btn-primary submit-btn" id="signup-button">Create Account</button>
                                </div>
                            </div>
                            
                            <div id="signup-error-message" class="error-message form-status-message"></div>
                        </form>
                        
                        <footer class="signup-footer">
                            <p>Already have an account? <a href="login.html">Sign in here</a></p>
                        </footer>
                    </article>
                </section>
            </main>
        `;

        // Mock window.location.assign for redirection
        delete window.location;
        window.location = {
            assign: jest.fn(),
            href: '', // Mock href for pathname checks
            pathname: '/signup.html' // Simulate being on the signup page
        };

        // Clear all Jest mocks before each test
        jest.clearAllMocks();

        // Re-trigger DOMContentLoaded to ensure auth.js listeners are re-attached
        // This is important because JSDOM resets the document.
        document.dispatchEvent(new Event('DOMContentLoaded', { bubbles: true }));
    });

    afterAll(() => {
        // Restore original window.location
        window.location = originalLocation;
    });

    // Helper functions for tests
    const getElement = (id) => document.getElementById(id);
    const getErrorMessage = (forId) => document.querySelector(`.error-message[for="${forId}"]`);
    const isElementVisible = (element) => element && (element.offsetWidth > 0 || element.offsetHeight > 0);
    const clickElement = (id) => getElement(id)?.click();
    const setInputValue = (id, value) => {
        const input = getElement(id);
        if (input) {
            input.value = value;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('blur', { bubbles: true }));
        }
    };
    const submitForm = (formId) => getElement(formId)?.dispatchEvent(new Event('submit', { bubbles: true }));

    // Test 1: Initial State and Step Navigation
    test('should display step 1 initially and transition to step 2 on continue', async () => {
        expect(isElementVisible(getElement('step1'))).toBe(true);
        expect(isElementVisible(getElement('step2'))).toBe(false);

        // Click continue button on step 1
        clickElement('step1 .next-btn');
        await Promise.resolve(); // Allow promises to resolve (for async event listeners)

        expect(isElementVisible(getElement('step1'))).toBe(false);
        expect(isElementVisible(getElement('step2'))).toBe(true);
    });

    // Test 2: Step 2 Validation - Empty Fields
    test('should show validation errors for empty fields on step 2 submission', async () => {
        // First, navigate to step 2
        clickElement('step1 .next-btn');
        await Promise.resolve();

        submitForm('signup-form');
        await Promise.resolve(); // Allow validation to run

        expect(getErrorMessage('signup-name').textContent).toContain('Full Name is required');
        expect(getErrorMessage('signup-email').textContent).toContain('Please enter a valid email address');
        expect(getErrorMessage('signup-password').textContent).toContain('Password must be at least 8 characters long');
        expect(getErrorMessage('signup-confirm-password').textContent).toContain('Passwords do not match');
        expect(getErrorMessage('termsAgree').textContent).toContain('You must agree to the terms and conditions');
    });

    // Test 3: Step 2 Validation - Invalid Email
    test('should show error for invalid email format', async () => {
        clickElement('step1 .next-btn');
        await Promise.resolve();

        setInputValue('signup-name', 'Test User');
        setInputValue('signup-email', 'invalid-email'); // Invalid format
        setInputValue('signup-password', 'StrongPass123!');
        setInputValue('signup-confirm-password', 'StrongPass123!');
        getElement('termsAgree').checked = true;
        getElement('termsAgree').dispatchEvent(new Event('change', { bubbles: true }));

        submitForm('signup-form');
        await Promise.resolve();

        expect(getErrorMessage('signup-email').textContent).toContain('Please enter a valid email address.');
        expect(getErrorMessage('signup-name').textContent).toBe(''); // Should be clear
        expect(getErrorMessage('signup-password').textContent).toBe('');
        expect(getErrorMessage('signup-confirm-password').textContent).toBe('');
        expect(getErrorMessage('termsAgree').textContent).toBe('');
    });

    // Test 4: Step 2 Validation - Weak Password
    test('should show error for weak password', async () => {
        clickElement('step1 .next-btn');
        await Promise.resolve();

        setInputValue('signup-name', 'Test User');
        setInputValue('signup-email', 'test@example.com');
        setInputValue('signup-password', 'short'); // Weak password
        setInputValue('signup-confirm-password', 'short');
        getElement('termsAgree').checked = true;
        getElement('termsAgree').dispatchEvent(new Event('change', { bubbles: true }));

        submitForm('signup-form');
        await Promise.resolve();

        expect(getErrorMessage('signup-password').textContent).toContain('Password must be at least 8 characters long.');
        // Check password requirement list items for invalid class
        expect(getElement('length').classList.contains('invalid')).toBe(true);
        expect(getElement('uppercase').classList.contains('invalid')).toBe(true);
    });

    // Test 5: Step 2 Validation - Mismatched Passwords
    test('should show error for mismatched passwords', async () => {
        clickElement('step1 .next-btn');
        await Promise.resolve();

        setInputValue('signup-name', 'Test User');
        setInputValue('signup-email', 'test@example.com');
        setInputValue('signup-password', 'StrongPass123!');
        setInputValue('signup-confirm-password', 'Mismatched123!'); // Mismatched
        getElement('termsAgree').checked = true;
        getElement('termsAgree').dispatchEvent(new Event('change', { bubbles: true }));

        submitForm('signup-form');
        await Promise.resolve();

        expect(getErrorMessage('signup-confirm-password').textContent).toContain('Passwords do not match.');
    });

    // Test 6: Step 2 Validation - Terms Not Agreed
    test('should show error if terms are not agreed', async () => {
        clickElement('step1 .next-btn');
        await Promise.resolve();

        setInputValue('signup-name', 'Test User');
        setInputValue('signup-email', 'test@example.com');
        setInputValue('signup-password', 'StrongPass123!');
        setInputValue('signup-confirm-password', 'StrongPass123!');
        getElement('termsAgree').checked = false; // Ensure unchecked
        getElement('termsAgree').dispatchEvent(new Event('change', { bubbles: true }));

        submitForm('signup-form');
        await Promise.resolve();

        expect(getErrorMessage('termsAgree').textContent).toContain('You must agree to the terms and conditions.');
    });

    // Test 7: Back Button
    test('should navigate back to step 1 when back button is clicked', async () => {
        // First, navigate to step 2
        clickElement('step1 .next-btn');
        await Promise.resolve();
        expect(isElementVisible(getElement('step2'))).toBe(true);

        // Click back button on step 2
        clickElement('step2 .prev-btn');
        await Promise.resolve();

        expect(isElementVisible(getElement('step1'))).toBe(true);
        expect(isElementVisible(getElement('step2'))).toBe(false);
    });

    // Test 8: Successful Signup
    test('should call Firebase auth and firestore functions on successful signup and redirect', async () => {
        // Navigate to step 2
        clickElement('step1 .next-btn');
        await Promise.resolve();

        // Fill all fields correctly
        setInputValue('signup-name', 'Successful Test User');
        setInputValue('signup-email', 'success@example.com');
        setInputValue('signup-phone', '0987654321');
        setInputValue('signup-password', 'VeryStrongPass123!');
        setInputValue('signup-confirm-password', 'VeryStrongPass123!');
        getElement('termsAgree').checked = true;
        getElement('termsAgree').dispatchEvent(new Event('change', { bubbles: true }));

        submitForm('signup-form');
        // Wait for all async operations (Firebase calls, timeouts)
        await new Promise(resolve => setTimeout(resolve, 2500)); // Increased wait time for Firebase mocks + redirection timeout

        // Assert Firebase functions were called
        const { getAuth, createUserWithEmailAndPassword, updateProfile } = require('https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js');
        const { getFirestore, doc, setDoc } = require('https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js');

        expect(createUserWithEmailAndPassword).toHaveBeenCalledTimes(1);
        expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
            expect.any(Object), // auth object
            'success@example.com',
            'VeryStrongPass123!'
        );

        expect(updateProfile).toHaveBeenCalledTimes(1);
        expect(updateProfile).toHaveBeenCalledWith(
            expect.objectContaining({ uid: 'mock-uid-new' }),
            { displayName: 'Successful Test User' }
        );

        expect(setDoc).toHaveBeenCalledTimes(1);
        expect(setDoc).toHaveBeenCalledWith(
            expect.objectContaining({ _path: `artifacts/test-app-id/users/mock-uid-new/profile/public` }),
            expect.objectContaining({
                name: 'Successful Test User',
                email: 'success@example.com',
                phone: '0987654321',
                role: 'student' // Default selected role
            })
        );

        // Assert redirection
        expect(window.location.href).toBe('login.html');
        expect(window.location.assign).toHaveBeenCalledWith('login.html');

        // Assert success message is displayed
        const globalErrorMessage = getElement('signup-error-message');
        expect(globalErrorMessage.textContent).toContain('Account created successfully! Redirecting to login...');
        expect(globalErrorMessage.style.opacity).toBe('1');
    });

    // Test 9: Password Visibility Toggle
    test('should toggle password visibility', () => {
        // Navigate to step 2 to make password fields visible
        clickElement('step1 .next-btn');
        
        const passwordInput = getElement('signup-password');
        const toggleButton = document.querySelector('#signup-password + .toggle-password-visibility');
        const toggleIcon = toggleButton.querySelector('i');

        expect(passwordInput.type).toBe('password');
        expect(toggleIcon.classList.contains('fa-eye')).toBe(true);

        clickElement(toggleButton.id); // Click the toggle button
        expect(passwordInput.type).toBe('text');
        expect(toggleIcon.classList.contains('fa-eye-slash')).toBe(true);

        clickElement(toggleButton.id); // Click again to revert
        expect(passwordInput.type).toBe('password');
        expect(toggleIcon.classList.contains('fa-eye')).toBe(true);
    });
});
