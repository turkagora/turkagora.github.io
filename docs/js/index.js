document.addEventListener('DOMContentLoaded', function() {
  const themeToggle = document.getElementById('themeToggle');
  const body = document.body;
  const icon = themeToggle.querySelector('i');

  // Theme setup
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (localStorage.getItem('darkMode') === 'enabled' || (prefersDark && localStorage.getItem('darkMode') === null)) {
    enableDarkMode();
  }

  // Theme toggle
  themeToggle.addEventListener('click', function() {
    if (body.classList.contains('dark-mode')) {
      disableDarkMode();
    } else {
      enableDarkMode();
    }
  });

  // Theme utilities
  function enableDarkMode() {
    body.classList.add('dark-mode');
    icon.classList.replace('fa-moon', 'fa-sun');
    localStorage.setItem('darkMode', 'enabled');
    themeToggle.setAttribute('aria-label', 'Passer en mode clair');
  }

  function disableDarkMode() {
    body.classList.remove('dark-mode');
    icon.classList.replace('fa-sun', 'fa-moon');
    localStorage.setItem('darkMode', 'disabled');
    themeToggle.setAttribute('aria-label', 'Passer en mode sombre');
  }
});
