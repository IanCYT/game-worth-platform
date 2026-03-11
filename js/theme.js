function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const themeBtn = document.querySelector('.theme-toggle');

    if (document.body.classList.contains('light-mode')) {
        themeBtn.innerHTML = '☀️ Light';
        localStorage.setItem('theme', 'light');
    } else {
        themeBtn.innerHTML = '🌙 Dark';
        localStorage.setItem('theme', 'dark');
    }
}

// Load saved theme preference on page load
window.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const themeBtn = document.querySelector('.theme-toggle');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        themeBtn.innerHTML = '☀️ Light';
    } else {
        themeBtn.innerHTML = '🌙 Dark';
    }
});
