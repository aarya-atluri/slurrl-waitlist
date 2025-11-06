// IMPORTANT: Replace this with the new Google Apps Script URL you deployed.
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyJDC3Q5QJSC4_NrxdY7TCyXnFYUdP7URiwMtWMZ9w_3jj1aIcs6qpNffJfYbnVQqI2Iw/exec';

// --- DOM Elements ---
const form = document.getElementById('waitlist-form');
const emailInput = document.getElementById('email-input');
const submitButton = document.getElementById('submit-button');
const messageElement = document.getElementById('message-element');

// --- State Management ---
let statusTimeout;

// --- Functions ---
const validateEmail = (email) => {
  // Simple regex for email validation
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const showMessage = (text, type) => {
  clearTimeout(statusTimeout); // Clear any existing message timers
  messageElement.textContent = text;
  // Reset classes and apply new color based on type
  messageElement.className = 'text-md mt-4 h-6 transition-opacity duration-300';
  if (type === 'success') {
    messageElement.classList.add('text-green-400');
  } else if (type === 'error') {
    messageElement.classList.add('text-red-400');
  }
  
  // Message disappears after 5 seconds
  statusTimeout = setTimeout(() => {
    messageElement.textContent = '';
  }, 5000);
};

const setSubmittingState = (isSubmitting) => {
  submitButton.disabled = isSubmitting;
  emailInput.disabled = isSubmitting;
  submitButton.textContent = isSubmitting ? 'Submitting...' : 'Join Waitlist';
};

const handleSubmit = async (e) => {
  e.preventDefault(); // Prevent default form submission
  const email = emailInput.value.trim();

  if (!validateEmail(email)) {
    showMessage('Please enter a valid email address.', 'error');
    return;
  }
  
  setSubmittingState(true);
  messageElement.textContent = ''; // Clear previous messages

  const payload = JSON.stringify({ email: email });
  
  // Use AbortController for a timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15-second timeout

  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: payload,
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // Required for this CORS workaround
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId); // Clear the timeout if the request completes in time

    const result = await response.json();

    if (result.result === 'success') {
      showMessage('Thank you! You have been added to the waitlist.', 'success');
      form.reset();
    } else {
      // Show the actual error message from the script, if available
      throw new Error(result.message || 'An unknown error occurred on the server.');
    }

  } catch (error) {
    if (error.name === 'AbortError') {
      showMessage('The request timed out. Please try again.', 'error');
    } else {
      console.error('Submission Error:', error);
      showMessage('An unexpected error occurred. Please try again.', 'error');
    }
  } finally {
    setSubmittingState(false);
  }
};

// --- Event Listener ---
form.addEventListener('submit', handleSubmit);