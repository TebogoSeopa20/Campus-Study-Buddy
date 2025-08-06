// Import the necessary Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    signInWithCustomToken,
    signInAnonymously,
    updateProfile // Added to update user profile (e.g., display name)
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js"; // Import Firestore modules

console.log("auth.js: Script started loading.");

// --- Firebase Initialization ---
// These global variables are provided by the Canvas environment.
// We check for their existence to ensure the app works in and out of Canvas.
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

let app;
let auth;
let db; // Firestore instance

try {
    console.log("auth.js: Attempting to initialize Firebase app.");
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app); // Initialize Firestore
    console.log("auth.js: Firebase app, Auth, and Firestore initialized successfully.");

    // Sign in with custom token if available, otherwise sign in anonymously
    if (initialAuthToken) {
        signInWithCustomToken(auth, initialAuthToken)
            .then(() => console.log("auth.js: Signed in with custom token."))
            .catch(error => console.error("auth.js: Error signing in with custom token:", error));
    } else {
        signInAnonymously(auth)
            .then(() => console.log("auth.js: Signed in anonymously."))
            .catch(error => console.error("auth.js: Error signing in anonymously:", error));
    }

} catch (error) {
    console.error("auth.js: Firebase initialization error:", error);
    if (!app) {
        console.warn("auth.js: Firebase app not initialized. Auth functions may not work.");
    }
}


// --- Utility Functions ---

/**
 * Displays a message on the page (error or success).
 * @param {string} messageId - The ID of the HTML element to display the message in.
 * @param {string} message - The message to display.
 * @param {boolean} isError - True if it's an error message, false for success.
 */
function displayMessage(messageId, message, isError = true) {
    const messageElement = document.getElementById(messageId);
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.style.color = isError ? 'var(--form-error)' : 'var(--form-success)';
        messageElement.style.opacity = '1'; // Make sure it's visible
        console.log(`auth.js: Displaying message for ${messageId}: ${message} (Error: ${isError})`);
    } else {
        console.warn(`auth.js: Message element with ID '${messageId}' not found.`);
    }
}

/**
 * Clears a displayed message.
 * @param {string} messageId - The ID of the HTML element holding the message.
 */
function clearMessage(messageId) {
    const messageElement = document.getElementById(messageId);
    if (messageElement) {
        messageElement.textContent = '';
        messageElement.style.opacity = '0'; // Hide it
        console.log(`auth.js: Cleared message for ${messageId}.`);
    }
}

/**
 * Handles exponential backoff for API calls.
 * Retries a function multiple times with increasing delays.
 * @param {function} fn - The function to retry.
 * @param {number} retries - The number of retries left.
 * @param {number} delay - The current delay in milliseconds.
 */
async function exponentialBackoff(fn, retries = 5, delay = 1000) {
    try {
        return await fn();
    } catch (error) {
        if (retries > 0) {
            console.warn(`auth.js: Retrying function due to error: ${error.message}. Retries left: ${retries}`);
            await new Promise(res => setTimeout(res, delay));
            return exponentialBackoff(fn, retries - 1, delay * 2);
        } else {
            console.error(`auth.js: Max retries reached for function. Last error: ${error.message}`);
            throw error;
        }
    }
}

/**
 * Validates an email address format using a regular expression.
 * @param {string} email - The email string to validate.
 * @returns {boolean} True if the email is valid, false otherwise.
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validates a password against specific criteria.
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * @param {string} password - The password string to validate.
 * @returns {string|null} An error message if invalid, or null if valid.
 */
function validatePassword(password) {
    const passwordRequirements = document.querySelectorAll('.password-requirements li');
    const requirements = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^A-Za-z0-9]/.test(password)
    };

    let isValid = true;
    if (passwordRequirements.length > 0) { // Only update UI if elements exist
        passwordRequirements.forEach(req => {
            const id = req.id;
            if (requirements[id]) {
                req.classList.add('valid');
                req.classList.remove('invalid'); // Ensure invalid is removed
            } else {
                req.classList.remove('valid');
                req.classList.add('invalid'); // Add invalid class
                isValid = false; // If any requirement is not met, password is not valid
            }
        });
    } else {
        // If password requirements list elements are not found, rely purely on function logic
        if (!requirements.length || !requirements.uppercase || !requirements.lowercase || !requirements.number || !requirements.special) {
            isValid = false;
        }
    }

    if (!isValid) {
        if (!requirements.length) return 'Password must be at least 8 characters long.';
        if (!requirements.uppercase) return 'Password must contain at least one uppercase letter.';
        if (!requirements.lowercase) return 'Password must contain at least one lowercase letter.';
        if (!requirements.number) return 'Password must contain at least one number.';
        if (!requirements.special) return 'Password must contain at least one special character.';
    }
    return null; // Password is valid
}

/**
 * Helper function to show error state for an input.
 * @param {HTMLElement} inputElement - The input field.
 * @param {string} message - The error message.
 */
function showError(inputElement, message) {
    inputElement.classList.add('error');
    const errorElement = document.querySelector(`.error-message[for="${inputElement.id}"]`);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.opacity = '1';
    }
}

/**
 * Helper function to clear error state for an input.
 * @param {HTMLElement} inputElement - The input field.
 */
function clearError(inputElement) {
    inputElement.classList.remove('error');
    const errorElement = document.querySelector(`.error-message[for="${inputElement.id}"]`);
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.opacity = '0';
    }
}

/**
 * Gets a generic validation message for an input based on its validity state.
 * @param {HTMLInputElement} input - The input element.
 * @returns {string} The validation message.
 */
function getValidationMessage(input) {
    if (input.validity.valueMissing) {
        return 'This field is required';
    } else if (input.validity.typeMismatch) {
        return 'Please enter a valid ' + (input.type === 'email' ? 'email address' : 'value');
    } else if (input.validity.patternMismatch) {
        return 'Please match the requested format';
    } else if (input.validity.tooShort) {
        return `Should be at least ${input.minLength} characters`;
    } else {
        return 'Invalid value';
    }
}


// --- Multi-step form logic for Signup ---
let currentStep = 0;
let signupSteps = [];
let signupForm = null;
let signupErrorMessageGlobal = null; // Global error message for the whole form

/**
 * Shows a specific step of the signup form.
 * @param {number} stepIndex - The index of the step to show.
 */
function showStep(stepIndex) {
    signupSteps.forEach((step, index) => {
        step.classList.toggle('active', index === stepIndex);
    });
    // Update button visibility for the submit button
    const submitBtn = signupForm ? signupForm.querySelector('.submit-btn') : null;
    if (submitBtn) {
        submitBtn.style.display = stepIndex === signupSteps.length - 1 ? 'block' : 'none';
    }
    clearMessage('signup-error-message'); // Clear global error message on step change
}

/**
 * Validates the current step of the signup form.
 * @param {number} stepIndex - The index of the step to validate.
 * @returns {boolean} True if the step is valid, false otherwise.
 */
function validateStep(stepIndex) {
    let isValid = true;
    const currentStepElement = signupSteps[stepIndex];
    if (!currentStepElement) {
        console.error(`auth.js: Step element for index ${stepIndex} not found.`);
        return false;
    }

    const inputs = currentStepElement.querySelectorAll('input[required], select[required], input[type="radio"][name="role"]'); // Include radio buttons for validation

    inputs.forEach(input => {
        // Handle radio button validation separately for 'role'
        if (input.name === 'role') {
            const roleSelected = document.querySelector('input[name="role"]:checked');
            if (!roleSelected) {
                showError(input, 'Please select a role.');
                isValid = false;
            } else {
                clearError(input);
            }
        } else if (!input.checkValidity()) {
            showError(input, getValidationMessage(input));
            isValid = false;
        } else {
            clearError(input);
        }

        // Special validation for password fields in step2
        if (input.id === 'signup-password' && input.value !== '') {
            const passwordError = validatePassword(input.value);
            if (passwordError) {
                showError(input, passwordError);
                isValid = false;
            } else {
                clearError(input);
            }
        }
        
        const confirmPasswordInput = document.getElementById('signup-confirm-password');
        if (input.id === 'signup-confirm-password' && confirmPasswordInput && document.getElementById('signup-password')) {
            const passwordInput = document.getElementById('signup-password');
            if (input.value !== passwordInput.value) {
                showError(input, 'Passwords do not match.');
                isValid = false;
            } else {
                clearError(input);
            }
        }
    });

    // Validate terms agreement only on the last step (step2)
    if (stepIndex === signupSteps.length - 1) {
        const termsCheckbox = document.getElementById('termsAgree');
        if (termsCheckbox && !termsCheckbox.checked) {
            showError(termsCheckbox, 'You must agree to the terms and conditions.');
            isValid = false;
        } else if (termsCheckbox) {
            clearError(termsCheckbox);
        }
    }

    return isValid;
}


// --- Authentication Functions ---

/**
 * Handles user signup.
 * Performs validation checks for name, email, and password.
 */
async function handleSignup(event) {
    event.preventDefault(); // Prevent default form submission
    console.log("auth.js: handleSignup function called (final submission).");

    // This function is now only called when the 'Create Account' button on the last step is clicked.
    // All validations for the current step should have passed already.
    // We'll do a final check for all required fields.

    const nameInput = document.getElementById('signup-name');
    const emailInput = document.getElementById('signup-email');
    const phoneInput = document.getElementById('signup-phone');
    const passwordInput = document.getElementById('signup-password');
    const confirmPasswordInput = document.getElementById('signup-confirm-password');
    const termsCheckbox = document.getElementById('termsAgree');
    const signupButton = document.getElementById('signup-button');

    // Ensure all elements are present before attempting to read values
    if (!nameInput || !emailInput || !passwordInput || !confirmPasswordInput || !termsCheckbox || !signupButton) {
        console.error("auth.js: Critical signup form elements missing during final submission.");
        displayMessage('signup-error-message', "A form error occurred. Please refresh and try again.", true);
        signupButton.disabled = false;
        return;
    }

    clearMessage('signup-error-message');
    signupButton.disabled = true; // Disable button during submission

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    const role = document.querySelector('input[name="role"]:checked')?.value || 'student';

    // Re-run full validation for the final step to be safe
    let finalValidationPassed = true;
    if (!validateStep(currentStep)) { // Validate the current (last) step
        finalValidationPassed = false;
    }
    // Also, ensure role is selected (from step 1)
    if (!document.querySelector('input[name="role"]:checked')) {
        displayMessage('signup-error-message', 'Please select a role.', true);
        finalValidationPassed = false;
    }


    if (!finalValidationPassed) {
        displayMessage('signup-error-message', 'Please correct all errors before creating your account.', true);
        signupButton.disabled = false;
        return;
    }

    try {
        console.log("auth.js: Final validation passed. Attempting to create user with Firebase.");
        const userCredential = await exponentialBackoff(() => createUserWithEmailAndPassword(auth, email, password));
        const user = userCredential.user;
        console.log("auth.js: User created:", user.uid);

        await updateProfile(user, {
            displayName: name
        });
        console.log("auth.js: User profile updated.");

        if (db) {
            const userId = user.uid;
            const userDocRef = doc(db, `artifacts/${appId}/users/${userId}/profile`, 'public'); 
            console.log("auth.js: Attempting to save user data to Firestore at path:", userDocRef.path);
            await setDoc(userDocRef, {
                name: name,
                email: email,
                phone: phone,
                role: role,
                createdAt: new Date().toISOString()
            });
            console.log("auth.js: User data saved to Firestore.");
        } else {
            console.warn("auth.js: Firestore not initialized, skipping user data save.");
        }
        
        displayMessage('signup-error-message', 'Account created successfully! Redirecting to login...', false);
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    } catch (error) {
        let message = 'An unknown error occurred during signup.';
        switch (error.code) {
            case 'auth/email-already-in-use':
                message = 'This email is already in use.';
                break;
            case 'auth/invalid-email':
                message = 'Please enter a valid email address.';
                break;
            case 'auth/weak-password':
                message = 'Password is too weak. It must be at least 8 characters and include uppercase, lowercase, numbers, and special characters.';
                break;
            case 'auth/network-request-failed':
                message = 'Network error. Please check your internet connection.';
                break;
            default:
                message = `Signup failed: ${error.message}`;
        }
        displayMessage('signup-error-message', message, true);
        console.error("auth.js: Signup error:", error);
    } finally {
        signupButton.disabled = false;
    }
}

/**
 * Handles user login.
 */
async function handleLogin(event) {
    event.preventDefault(); // Prevent default form submission
    console.log("auth.js: handleLogin function called.");

    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const errorMessageElementId = 'login-error-message';
    const loginButton = document.getElementById('login-button');

    if (!emailInput || !passwordInput || !loginButton) {
        console.error("auth.js: Missing one or more login form elements. Cannot proceed with login.");
        displayMessage(errorMessageElementId, "Form elements not found. Please check HTML IDs.");
        return;
    }

    clearMessage(errorMessageElementId);
    loginButton.disabled = true;

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    console.log(`auth.js: Login attempt for Email: ${email}`);

    let isValidForm = true;

    if (!isValidEmail(email)) {
        showError(emailInput, 'Please enter a valid email address.');
        isValidForm = false;
    } else {
        clearError(emailInput);
    }

    if (password === '') {
        showError(passwordInput, 'Password cannot be empty.');
        isValidForm = false;
    } else {
        clearError(passwordInput);
    }

    if (!isValidForm) {
        displayMessage(errorMessageElementId, 'Please correct the errors above.', true);
        loginButton.disabled = false;
        return;
    }

    try {
        console.log("auth.js: All client-side validations passed. Attempting to sign in user.");
        await exponentialBackoff(() => signInWithEmailAndPassword(auth, email, password));
        console.log("auth.js: User signed in successfully.");
        displayMessage(errorMessageElementId, 'Login successful! Redirecting to dashboard...', false);
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
    } catch (error) {
        let message = 'An unknown error occurred during login.';
        switch (error.code) {
            case 'auth/invalid-email':
            case 'auth/user-not-found':
            case 'auth/wrong-password':
                message = 'Invalid email or password.';
                break;
            case 'auth/too-many-requests':
                message = 'Too many failed login attempts. Please try again later.';
                break;
            case 'auth/network-request-failed':
                message = 'Network error. Please check your internet connection.';
                break;
            default:
                message = `Login failed: ${error.message}`;
        }
        displayMessage(errorMessageElementId, message, true);
        console.error("auth.js: Login error:", error);
    } finally {
        loginButton.disabled = false;
    }
}

/**
 * Handles user logout.
 */
async function handleLogout() {
    console.log("auth.js: handleLogout function called.");
    try {
        await exponentialBackoff(() => signOut(auth));
        console.log("auth.js: User logged out successfully.");
        window.location.href = 'login.html';
    } catch (error) {
        console.error("auth.js: Logout error:", error);
    }
}

// --- Event Listeners and UI Updates ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("auth.js: DOMContentLoaded event fired.");

    // Toggle password visibility
    const togglePasswordButtons = document.querySelectorAll('.toggle-password-visibility');
    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });
    });

    // --- Signup Form Multi-step Logic ---
    signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupSteps = signupForm.querySelectorAll('.form-step');
        const nextButtons = signupForm.querySelectorAll('.next-btn');
        const prevButtons = signupForm.querySelectorAll('.prev-btn');
        signupErrorMessageGlobal = document.getElementById('signup-error-message');

        showStep(currentStep); // Initialize first step

        nextButtons.forEach(button => {
            button.addEventListener('click', function() {
                clearMessage('signup-error-message'); // Clear global message before validation
                if (validateStep(currentStep)) {
                    currentStep++;
                    showStep(currentStep);
                } else {
                    displayMessage('signup-error-message', 'Please correct the errors before continuing.', true);
                }
            });
        });

        prevButtons.forEach(button => {
            button.addEventListener('click', function() {
                clearMessage('signup-error-message'); // Clear global message on back
                currentStep--;
                showStep(currentStep);
            });
        });

        signupForm.addEventListener('submit', handleSignup); // Final submission handled by handleSignup

        // Real-time password validation feedback for signup
        const passwordInput = document.getElementById('signup-password');
        const confirmPasswordInput = document.getElementById('signup-confirm-password');

        if (passwordInput) {
            passwordInput.addEventListener('input', function() {
                validatePassword(this.value);
                if (confirmPasswordInput && this.value !== confirmPasswordInput.value && confirmPasswordInput.value !== '') {
                    showError(confirmPasswordInput, 'Passwords do not match');
                } else if (confirmPasswordInput) {
                    clearError(confirmPasswordInput);
                }
            });
        }

        if (confirmPasswordInput) {
            confirmPasswordInput.addEventListener('input', function() {
                if (passwordInput && this.value !== passwordInput.value) {
                    showError(this, 'Passwords do not match');
                } else {
                    clearError(this);
                }
            });
        }

        // Real-time validation for other fields on blur for signup form
        signupForm.querySelectorAll('input[required]:not([type="password"]), select[required]').forEach(input => {
            input.addEventListener('blur', function() {
                if (!this.checkValidity()) {
                    showError(this, getValidationMessage(this));
                } else {
                    clearError(this);
                }
            });
        });

        // Handle role selection styling
        const roleOptions = document.querySelectorAll('.role-option input[type="radio"]');
        roleOptions.forEach(radio => {
            radio.addEventListener('change', () => {
                // This will trigger the :checked + label CSS, no JS needed for visual
            });
        });

    } else {
        console.warn("auth.js: Signup form (ID 'signup-form') not found on this page.");
    }

    // --- Login Form Logic ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
        console.log("auth.js: Login form listener attached.");

        // Real-time validation for login fields on blur
        loginForm.querySelectorAll('input[required]').forEach(input => {
            input.addEventListener('blur', function() {
                if (!this.checkValidity()) {
                    showError(this, getValidationMessage(this));
                } else {
                    clearError(this);
                }
            });
        });

    } else {
        console.warn("auth.js: Login form (ID 'login-form') not found on this page.");
    }

    // --- Logout Buttons ---
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
        console.log("auth.js: Desktop logout button listener attached.");
    } else {
        console.warn("auth.js: Desktop logout button (ID 'logout-button') not found on this page.");
    }
    const mobileLogoutButton = document.getElementById('mobile-logout-button');
    if (mobileLogoutButton) {
        mobileLogoutButton.addEventListener('click', handleLogout);
        console.log("auth.js: Mobile logout button listener attached.");
    } else {
        console.warn("auth.js: Mobile logout button (ID 'mobile-logout-button') not found on this page.");
    }

    // --- Auth State Change Listener (for redirects and UI updates) ---
    onAuthStateChanged(auth, async (user) => {
        console.log("auth.js: onAuthStateChanged event fired. User:", user ? user.uid : "null");
        const userIdDisplay = document.getElementById('user-id');
        const userNameDisplay = document.getElementById('user-name');

        if (userIdDisplay) { // Check if we are on a page that displays user ID
            if (user) {
                userIdDisplay.textContent = user.uid;
                if (userNameDisplay) {
                    userNameDisplay.textContent = user.displayName || 'N/A';
                }

                // If display name isn't set, try fetching from Firestore
                if (!user.displayName && userNameDisplay && db) {
                    try {
                        const userId = auth.currentUser?.uid;
                        if (userId) {
                            const userDocRef = doc(db, `artifacts/${appId}/users/${userId}/profile`, 'public');
                            const userDocSnap = await getDoc(userDocRef);
                            if (userDocSnap.exists()) {
                                const userData = userDocSnap.data();
                                userNameDisplay.textContent = userData.name || 'N/A';
                                console.log("auth.js: Fetched user name from Firestore:", userData.name);
                            } else {
                                console.log("auth.js: User profile document not found in Firestore.");
                            }
                        }
                    } catch (firestoreError) {
                        console.error("auth.js: Error fetching user name from Firestore:", firestoreError);
                        if (userNameDisplay) userNameDisplay.textContent = 'N/A';
                    }
                }

            } else {
                userIdDisplay.textContent = 'Not logged in.';
                if (userNameDisplay) {
                    userNameDisplay.textContent = 'Guest';
                }
                // If on dashboard and not logged in, redirect to login
                if (window.location.pathname.includes('dashboard.html')) {
                    console.log("auth.js: Not logged in on dashboard, redirecting to login.");
                    window.location.href = 'login.html';
                }
            }
        } else {
            console.log("auth.js: User ID display element not found on this page.");
            // If not on a dashboard-like page, but still need to handle auth state
            // For example, if user is logged in, but tries to access login/signup directly, redirect to dashboard
            const currentPath = window.location.pathname;
            if (user && (currentPath.includes('login.html') || currentPath.includes('signup.html'))) {
                console.log("auth.js: User logged in, redirecting from auth page to dashboard.");
                window.location.href = 'dashboard.html';
            }
        }
    });
});

console.log("auth.js: Script finished execution.");
