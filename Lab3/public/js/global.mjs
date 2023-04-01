const navLinks = document.querySelectorAll('.nav__link');
navLinks.forEach(link => {
    // Get the nav button reference
    const linkButton = link.querySelector('.link');

    // Get the destination which user is being redirected to
    const destination = linkButton.textContent.toLowerCase();

    if (linkButton || destination !== "home") {
        linkButton.addEventListener('click', () => {
            window.location.href = `index.html?action=${destination}`;
        });
    }
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