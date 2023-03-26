const authForm = document.getElementById('authForm');

authForm.addEventListener('submit', (e) => {
    e.preventDefault(); // prevent default form submission

    const login = document.getElementById('login');
    const pass = document.getElementById('pass');

    // Auth Check
    if (login.value !== "test" && pass.value !== "test") {
        alert('Bad Credentials');
        return;
    }
    // Redirect to home page
    window.location.href = `index.html?login=${encodeURIComponent(login.value)}&pass=${encodeURIComponent(pass.value)}`;
});