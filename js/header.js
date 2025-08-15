// js/header.js
// This script loads the header content into the page.

async function loadHeader() {
    const headerPlaceholder = document.getElementById('header-placeholder');
    const headerContentPath = './header.html'; // Use a root-relative path

    if (!headerPlaceholder) {
        console.error('Element with ID "header-placeholder" not found.');
        return;
    }

    try {
        const response = await fetch(headerContentPath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const content = await response.text();
        headerPlaceholder.innerHTML = content;
    } catch (error) {
        console.error('Error fetching header content:', error);
        headerPlaceholder.innerHTML = `<p class="text-red-500">Error loading header.</p>`;
    }
}

// Call the function when the DOM is loaded
document.addEventListener('DOMContentLoaded', loadHeader);
