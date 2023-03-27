const authForm = document.getElementById('authForm');

authForm.addEventListener('submit', (e) => {
    e.preventDefault(); // prevent default form submission

    const login = document.getElementById('login');
    const pass = document.getElementById('pass');
    const passRepeat = document.getElementById('pass--repeat');
    const avatar = document.getElementById('avatar');

    // Pass Check
    if (pass.value !== passRepeat.value) {
        alert("Passwords don't match");
        return;
    }

    localStorage.setItem('isAuthorised', "true");

    // Redirect to home page
    window.location.href = `index.html`;
});

const popularBtn = document.getElementById("nav-btn-popular");
popularBtn.addEventListener('click', (event) => {
    event.preventDefault();

    window.location.href = 'index.html?action=popular';
});

const searchForm = document.querySelector('.navbar__search__content');
searchForm.addEventListener('submit', (event) => {
    event.preventDefault();

    // Get the search query from the input field
    const searchQuery = document.getElementById('searchInput').value;

    // Encode the search query
    const encodedSearchQuery = encodeURIComponent(searchQuery);

    // Redirect to the index.html page with the search query as a parameter
    window.location.href = `index.html?search=${encodedSearchQuery}`;
});