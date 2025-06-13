import { saveAuthToken, removeAuthToken, isAuthenticated, getUsername } from './auth-utils.js';
import config from './config.js';
import { hideTopPicksSection, initializeTopPicks } from './top-picks.js';
import { clearSearchResults } from './main.js';

// Register modal functionality
const registerButton = document.getElementById('registerButton');
const registerModal = document.getElementById('registerModal');
const closeRegisterModal = document.getElementById('closeRegisterModal');
const registerForm = document.getElementById('registerForm');
const modalContent = registerModal.querySelector('div');

const logoutButton = document.createElement('button');
logoutButton.id = 'logoutButton';
logoutButton.className = 'bg-red-600 hover:bg-red-500 text-white font-semibold hover:text-white py-2 px-4 rounded';
logoutButton.innerHTML = '<div class="flex items-center">Log out</div>';

const userDisplay = document.createElement('span');
userDisplay.id = 'userDisplay';
userDisplay.className = 'mr-4 font-bold pt-2 text-gray-900 dark:text-gray-100';

const profilePicture = document.createElement('div');
profilePicture.id = 'profilePicture';
profilePicture.className = 'w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center cursor-pointer overflow-hidden border-2 border-white dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-400 transition-colors';
profilePicture.innerHTML = '<span id="profileFallback" class="text-xl font-bold text-gray-700 dark:text-gray-300">?</span>';
profilePicture.title = "My profile";

// Add click event to redirect to profile page
profilePicture.addEventListener('click', () => {
    window.location.href = '/profile.html';
});

registerButton.addEventListener('click', () => {
    registerModal.classList.remove('hidden');
    // Animate in
    setTimeout(() => {
        modalContent.classList.remove('opacity-0', 'scale-95');
        modalContent.classList.add('opacity-100', 'scale-100');
    }, 10);
});

closeRegisterModal.addEventListener('click', closeRegisterModalFunction);

// Close when clicking outside the modal content
registerModal.addEventListener('click', (e) => {
    if (e.target === registerModal) {
        closeRegisterModalFunction();
    }
});

function closeRegisterModalFunction() {
    // Animate out  
    modalContent.classList.remove('opacity-100', 'scale-100');
    modalContent.classList.add('opacity-0', 'scale-95');
    // Hide after animation completes
    setTimeout(() => {
        registerModal.classList.add('hidden');
    }, 300);
}

// Alert handling functions
function showSuccessAlert(message) {
    const successAlert = document.getElementById('successAlert');
    const successAlertMessage = document.getElementById('successAlertMessage');
    successAlertMessage.textContent = message || 'Registration successful';
    successAlert.classList.remove('hidden');
    // Auto-hide after 5 seconds
    setTimeout(() => {
        successAlert.classList.add('hidden');
    }, 5000);
}

function showErrorAlert(message) {
    const errorAlert = document.getElementById('errorAlert');
    const errorAlertMessage = document.getElementById('errorAlertMessage');
    // Use innerHTML instead of textContent to allow HTML formatting
    errorAlertMessage.innerHTML = message || 'An error occurred during registration';
    // Make the alert wider for multi-line messages
    if (message && message.includes('<br>')) {
        errorAlert.classList.add('max-w-md', 'w-auto');
    } else {
        errorAlert.classList.remove('max-w-md', 'w-auto');
    }
    errorAlert.classList.remove('hidden');
    // Auto-hide after longer time for more complex messages
    setTimeout(() => {
        errorAlert.classList.add('hidden');
        // Reset width classes after hiding
        errorAlert.classList.remove('max-w-md', 'w-auto');
    }, 8000); // 8 seconds for password errors to give users time to read
}

function showModalError(modalId, message) {
    const modalError = document.getElementById(`${modalId}ModalError`);
    const modalErrorMessage = document.getElementById(`${modalId}ModalErrorMessage`);
    // Use innerHTML instead of textContent to allow HTML formatting
    modalErrorMessage.innerHTML = message || 'An error occurred. Please try again';
    // Make the alert wider for multi-line messages
    if (message && message.includes('<br>')) {
        modalError.classList.add('text-sm');
    } else {
        modalError.classList.remove('text-sm');
    }
    modalError.classList.remove('hidden');
}

function clearModalError(modalId) {
    const modalError = document.getElementById(`${modalId}ModalError`);
    if (modalError) {
        modalError.classList.add('hidden');
    }
}

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Clear previous error messages
    clearModalError('register');
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    console.log('Registration submitted:', { username, email, password });
    try {
        const response = await fetch(`${config.apiBaseUrl}/api/Auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log('Success:', data);
            showSuccessAlert('Your account has been created! You can now log in');
            closeRegisterModalFunction();
            registerForm.reset();
        } else {
            console.error('Error:', data);
            // Handle specific error messages from the API
            let errorMessage = 'An error occurred during registration';
            
            // Check if data.errors is an array (password validation errors)
            if (data.errors && Array.isArray(data.errors)) {
                errorMessage = 'The password must meet the following requirements:<br>';
                errorMessage += data.errors.map(err => `• ${err}`).join('<br>');
            }
            // Handle array directly
            else if (Array.isArray(data)) {
                errorMessage = 'The password must meet the following requirements:<br>';
                errorMessage += data.map(err => `• ${err}`).join('<br>');
            }
            // Handle structured errors object
            else if (data.errors) {
                // Check for .NET serialization format with $values
                if (data.errors.$values && Array.isArray(data.errors.$values)) {
                    errorMessage = 'Password requirements:<br>';
                    errorMessage += data.errors.$values.map(err => `• ${err}`).join('<br>');
                }
                // Check for specific error types
                else if (data.errors.Email) {
                    errorMessage = `Email: ${data.errors.Email[0]}`;
                } else if (data.errors.Password) {
                    if (Array.isArray(data.errors.Password)) {
                        errorMessage = 'Password error:<br>';
                        errorMessage += data.errors.Password.map(err => `• ${err}`).join('<br>');
                    } else {
                        errorMessage = `Password: ${data.errors.Password[0]}`;
                    }
                } else if (data.errors.Username) {
                    errorMessage = `Username: ${data.errors.Username[0]}`;
                }
            } else if (data.message) {
                errorMessage = data.message;
            }
            
            // Show error in the modal instead of the global alert
            showModalError('register', errorMessage);
        }
    } catch (error) {
        console.error('Error:', error);
        showModalError('register', 'Could not connect to the server. Please try again later');
    }
});

// Login modal functionality
const loginButton = document.getElementById('loginButton');
const loginModal = document.getElementById('loginModal');
const closeLoginModal = document.getElementById('closeLoginModal');
const loginForm = document.getElementById('loginForm');
const loginModalContent = loginModal.querySelector('div');

loginButton.addEventListener('click', () => {
    loginModal.classList.remove('hidden');
    // Animate in
    setTimeout(() => {
        loginModalContent.classList.remove('opacity-0', 'scale-95');
        loginModalContent.classList.add('opacity-100', 'scale-100');
    }, 10);
});

closeLoginModal.addEventListener('click', closeLoginModalFunction);

// Close when clicking outside the modal content
loginModal.addEventListener('click', (e) => {
    if (e.target === loginModal) {
        closeLoginModalFunction();
    }
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Clear previous error messages
    clearModalError('login');
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    console.log('Login submitted:', { email, password, rememberMe });
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/Auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log('Login Success:', data);
        
        // Store the JWT token
        if (data.token) {
          saveAuthToken(data.token);
          updateAuthUI();
          // Initialize Top Picks after successful login
          initializeTopPicks();
          showSuccessAlert('Log in successful');
        }
        
        closeLoginModalFunction();
        loginForm.reset();
      } else {
        console.error('Login Error:', data);
        // Show error in the modal instead of the global alert
        showModalError('login', data.message || 'Wrong email or password');
      }
    } catch (error) {
        console.error('Login Error:', error);
        showModalError('login', 'Could not connect to the server. Please try again later');
    }
});

function closeLoginModalFunction() {
    // Animate out  
    loginModalContent.classList.remove('opacity-100', 'scale-100');
    loginModalContent.classList.add('opacity-0', 'scale-95');
    // Hide after animation completes
    setTimeout(() => {
        loginModal.classList.add('hidden');
        clearModalError('login'); // Clear any error messages
        loginForm.reset(); // Reset the form
    }, 300);
}

// Function to fetch the profile picture URL
async function fetchProfilePicture() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.log('No auth token found');
        return null;
    }

    try {
        const response = await fetch(`${config.apiBaseUrl}/api/Movies/profile-picture`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Profile picture API response status:', response.status);
        if (!response.ok) {
            console.error(`HTTP error! Status: ${response.status}, StatusText: ${response.statusText}`);
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.text();
        console.log('Profile picture URL:', data);
        return data || null;
    } catch (error) {
        console.error('Error fetching profile picture:', error.message);
        return null;
    }
}

function updateAuthUI() {
    const authContainer = document.querySelector('.flex.gap-3.absolute.top-4.right-6.z-10 .flex.flex-wrap.gap-3');

    if (isAuthenticated()) {
        // User is logged in
        loginButton.classList.add('hidden');
        registerButton.classList.add('hidden');

        // Set username in display
        const username = getUsername();
        if (username) {
            userDisplay.textContent = `Inloggad som: ${username}`;
        }

        // Add user display and profile elements if not already there
        if (!document.getElementById('userDisplay')) {
            authContainer.prepend(userDisplay);
        }

        if (!document.getElementById('profilePicture')) {
            // Ensure profilePicture has the fallback span
            profilePicture.innerHTML = '<span id="profileFallback" class="text-xl font-bold text-gray-700 dark:text-gray-300">?</span>';
            authContainer.appendChild(profilePicture);
        }

        if (!document.getElementById('logoutButton')) {
            authContainer.appendChild(logoutButton);
        }

        // Fetch and set the profile picture
        fetchProfilePicture().then(profilePictureUrl => {
            const profileFallback = profilePicture.querySelector('#profileFallback');
            if (profilePictureUrl) {
                // Replace the span with an img element
                profilePicture.innerHTML = '<img id="profileImage" src="' + profilePictureUrl + '" class="w-full h-full object-cover">';
                const profileImage = profilePicture.querySelector('#profileImage');
                if (profileImage) {
                    profileImage.onerror = function() {
                        console.log('Profile image failed to load, showing fallback');
                        this.parentNode.innerHTML = '<span id="profileFallback" class="text-xl font-bold text-gray-700 dark:text-gray-300">?</span>';
                    };
                }
            } else {
                console.log('No profile picture URL, using fallback');
                // Ensure fallback is set
                if (!profileFallback) {
                    profilePicture.innerHTML = '<span id="profileFallback" class="text-xl font-bold text-gray-700 dark:text-gray-300">?</span>';
                }
            }
        }).catch(error => {
            console.error('Error in profile picture fetch:', error);
            // Ensure fallback is set
            const profileFallback = profilePicture.querySelector('#profileFallback');
            if (!profileFallback) {
                profilePicture.innerHTML = '<span id="profileFallback" class="text-xl font-bold text-gray-700 dark:text-gray-300">?</span>';
            }
        });

        // Clear the "Log in to continue" message if it exists
        const movieRecommendations = document.getElementById('movieRecommendations');
        if (movieRecommendations && movieRecommendations.innerHTML.includes('Log in to continue')) {
            movieRecommendations.innerHTML = '';
            movieRecommendations.classList.remove('flex', 'items-center', 'justify-center');
            movieRecommendations.classList.add('grid', 'grid-cols-1', 'sm:grid-cols-2', 'md:grid-cols-3');
        }

        // Initialize Top Picks when user is authenticated
        initializeTopPicks();
    } else {
        // User is not logged in
        loginButton.classList.remove('hidden');
        registerButton.classList.remove('hidden');

        // Hide top picks section and clear search results when not authenticated
        hideTopPicksSection();
        clearSearchResults();

        // Remove user display, profile picture and logout button if they exist
        if (document.getElementById('userDisplay')) {
            userDisplay.remove();
        }

        if (document.getElementById('profilePicture')) {
            profilePicture.remove();
        }

        if (document.getElementById('logoutButton')) {
            logoutButton.remove();
        }
    }
}

// Add logout functionality
logoutButton.addEventListener('click', () => {
    // Hide top picks and clear search results with fade effects
    hideTopPicksSection();
    clearSearchResults();
    
    // Clear any saved search data
    sessionStorage.removeItem('movieRecommendations');
    sessionStorage.removeItem('lastSearchQuery');
    
    removeAuthToken();
    updateAuthUI();
    showSuccessAlert('You have been logged out successfully');
});

// Call this function on page load to set the initial state
document.addEventListener('DOMContentLoaded', updateAuthUI);