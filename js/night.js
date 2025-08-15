// night.js
// This script handles the night mode toggle functionality.

// The class to apply to the body for night mode
const NIGHT_MODE_CLASS = 'dark';
const NIGHT_MODE_STORAGE_KEY = 'theme-preference';

// Function to set the theme based on preference or system settings
const initializeTheme = () => {
    // Check local storage for user's preference
    const storedPreference = localStorage.getItem(NIGHT_MODE_STORAGE_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (storedPreference === 'dark' || (storedPreference === null && prefersDark)) {
        document.body.classList.add(NIGHT_MODE_CLASS);
    }
};

// Function to toggle night mode
const toggleNightMode = () => {
    // Toggle the dark class on the body
    document.body.classList.toggle(NIGHT_MODE_CLASS);

    // Save the new preference to local storage
    if (document.body.classList.contains(NIGHT_MODE_CLASS)) {
        localStorage.setItem(NIGHT_MODE_STORAGE_KEY, 'dark');
    } else {
        localStorage.setItem(NIGHT_MODE_STORAGE_KEY, 'light');
    }
};

// Listen for the DOMContentLoaded event to initialize the theme
document.addEventListener('DOMContentLoaded', initializeTheme);
