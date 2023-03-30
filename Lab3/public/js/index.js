import module from "./music-player.mjs"

function getCookie(name) {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith(name + '=')) {
            return cookie.substring(name.length + 1);
        }
    }
    return null;
}

const searchForm = document.querySelector('.navbar__search__content');
const audio_player = document.getElementById("audio-player");

let changed = false;

window.addEventListener('load', function () {
    // Check the auth
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');
    const action = urlParams.get('action');

    if (action) {
        document.getElementById("nav-btn-" + action).click();
    } else {
        // Fill default queue
        module.fillQueue(getCookie("user-id"));
    }


    // Fill user playlists
    module.fillPlaylists(getCookie("user-id"));

    // Perform search if requested
    if (searchQuery) {
        const searchInput = document.getElementById("searchInput");
        searchInput.value = searchQuery;
        searchForm.dispatchEvent(new Event("submit"));
    }

    // Show elements based on the value
    if (getCookie("user-id")) {
        document.getElementById('page-recent').classList.toggle('hidden');
        document.getElementById('page-playlists').classList.toggle('hidden');
        document.getElementById('page-creator').classList.toggle('hidden');
        document.getElementById('page-signOut').classList.toggle('hidden');
        document.getElementById('avatar').classList.toggle('hidden');
        document.getElementById('username').classList.toggle('hidden');
        document.getElementById('page-signIn').classList.toggle('hidden');
        document.getElementById('page-signUp').classList.toggle('hidden');

        // Change profile data [API functionality]
        if (getCookie("avatar")) {
            document.getElementById("avatar").setAttribute("src", getCookie("avatar"))
        }
        if (getCookie("username")) {
            document.getElementById("username").innerHTML = getCookie("username");
        }
    }
});

// Create a queue mutation-observer
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
            // Child nodes have been added or removed from the queue element
            const queueButtons = document.querySelectorAll("#queue button");
            queueButtons.forEach((button) => {
                if (button.getAttribute("audio-id")) {
                    button.addEventListener("click", switchSongByClick);
                    [btnPrev, btnPlay, btnNext, btnRepeat, btnRandomize].forEach((btn) => {
                        btn.removeAttribute("disabled");
                    })
                } else {
                    [btnPrev, btnPlay, btnNext, btnRepeat, btnRandomize].forEach((btn) => {
                        btn.setAttribute("disabled", "");
                    })
                }
            });
        }
    });
});

// Set up the observer to watch for changes to the queue element
const observerConfig = { childList: true };
observer.observe(document.querySelector("#queue"), observerConfig);

// Nav handlers
const navLinks = document.querySelectorAll('.nav__link');
const queueName = document.querySelector('.queue__name');

navLinks.forEach(link => {
    const linkButton = link.querySelector('.link');

    if (linkButton) { // Check if linkButton exists
        linkButton.addEventListener('click', () => {
            clearSelectedSong();
            // Add 'link--current' class to clicked button
            const currentLinkButton = document.querySelector('.link--current');
            currentLinkButton.classList.remove('link--current');
            linkButton.classList.add('link--current');
            if (linkButton.textContent.toLowerCase() !== "home") {
                window.history.pushState({}, null, `index.html?action=${linkButton.textContent.toLowerCase()}`);
            } else {
                window.history.pushState({}, null, `index.html`);
            }

            if (linkButton.tagName === "BUTTON") {
                // Change queue name based on clicked button
                queueName.textContent = linkButton.textContent;
                module.clearQueue();
            }
        });
    }
});

const btnPopular = document.getElementById("nav-btn-popular");
btnPopular.addEventListener('click', () => {
    module.getPopularSongs(getCookie("user-id"));
});

const btnRecent = document.getElementById("nav-btn-recent");
btnRecent.addEventListener('click', () => {
    module.getRecentSongs(getCookie("user-id"));
});

const btnPlaylists = document.getElementById("nav-btn-playlists");
btnPlaylists.addEventListener('click', () => {
    module.getPlaylists(getCookie("user-id"));
});

searchForm.addEventListener('submit', (event) => {
    module.clearQueue();

    event.preventDefault();
    const encodedSearchQuery = document.getElementById('searchInput').value;

    // Change the URL without refreshing the page
    window.history.pushState({}, null, `index.html?search=${encodedSearchQuery}`);
    document.querySelector('.queue__name').textContent = "Search Results";

    // Search for songs in Firebase Firestore
    module.search(encodedSearchQuery, getCookie("user-id"));
});

let homeLink = document.querySelector('#page-home a');
homeLink.addEventListener('click', (event) => {
    event.preventDefault();

    location.reload();
});

let signOutLink = document.querySelector('#page-signOut a');
signOutLink.addEventListener('click', (event) => {
    event.preventDefault();

    document.cookie = "user-id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "avatar=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

    location.reload();
});


// Music Player functions
let songOrder = 1;

let btnNext = document.getElementById("btn-next");
if (btnNext) {
    btnNext.addEventListener("click", function () {
        switchSongByButton("next");
    });

    // Play next song [API functionality]
}

let btnPrev = document.getElementById("btn-prev");
if (btnPrev) {
    btnPrev.addEventListener("click", function () {
        switchSongByButton("prev");
    });

    // Play previous song [API functionality]
}

audio_player.addEventListener("ended", () => {
    btnNext.click();
});
audio_player.addEventListener("canplaythrough", () => {
    audio_player.play();
});

function switchSong(current, next = null) {
    if (current && next) {
        changed = current.getAttribute("audio-id") !== next.getAttribute("audio-id")
    } else if (!current) {
        changed = true
    }

    if (current) {
        current.classList.remove("song__info--selected");
        current.classList.add("song__info");
        current.removeAttribute("disabled");
        current.querySelector("b").classList.remove("info--selected__paragraph");
        current.classList.remove("current-selected-song");
    }

    if (next) {
        next.classList.remove("song__info");
        next.classList.add("song__info--selected");
        next.setAttribute("disabled", "");
        next.querySelector("b").classList.add("info--selected__paragraph");
        next.classList.add("current-selected-song");

        // Scroll to the newly selected song button
        next.scrollIntoView({behavior: "smooth", block: "nearest"});

        // Update the current song image
        document.querySelector(".current-song__image").src = `img/discs/song-disk--0${(songOrder - 1) % 9 + 1}.png`;

        // Update favourite-icon state
        const likeIcon = document.getElementById("btn-like").children[0];
        if (next.getAttribute("favourite") === "true")
        {
            likeIcon.setAttribute("src", "img/buttons/button-like--active.svg");
        } else {
            likeIcon.setAttribute("src", "img/buttons/button-like.svg");
        }
    }
}

function clearSelectedSong() {
    let currentSelectedSong = document.querySelector(".song__info--selected");
    switchSong(currentSelectedSong);
}

function switchSongByClick(event) {
    // Enable repeat & like & add buttons
    document.querySelector("#btn-repeat").removeAttribute("disabled");
    document.querySelector("#btn-like").removeAttribute("disabled");
    document.querySelector("#btn-add").removeAttribute("disabled");

    // Check if song already 'liked' [API functionality]

    // Switch like button
    document.getElementById("btn-like").children[0].setAttribute("src", "img/buttons/button-like.svg");

    // Get the current selected song button and switch its classes
    let currentSelectedSong = document.querySelector(".song__info--selected");

    // Get the newly selected song button and switch its classes
    let newSelectedSong = event.target.closest("button");

    songOrder = Array.from(event.target.closest("ul").children).indexOf(event.target.closest("li")) + 1;

    // Switch songs
    switchSong(currentSelectedSong, newSelectedSong);
    switchAudioData();

    // Play selected song [API functionality]
    if (btnPlay.children[0].getAttribute("src") === "img/buttons/button-pause.svg") {
        audio_player.setAttribute("src", newSelectedSong.getAttribute("audio-src"))
        audio_player.play();
        const songId = newSelectedSong.getAttribute("audio-id");
        module.updateTrackCount(songId);
        if (getCookie("user-id")) {
            module.updateUserHistory(getCookie("user-id"), songId);
        }
        console.log("Song has been changed.");
    }
}

function switchSongByButton(button) {
    // Enable repeat & like & add buttons
    document.querySelector("#btn-repeat").removeAttribute("disabled");
    document.querySelector("#btn-like").removeAttribute("disabled");
    document.querySelector("#btn-add").removeAttribute("disabled");

    // Check if song already 'liked' [API functionality]

    // Switch like button
    document.getElementById("btn-like").children[0].setAttribute("src", "img/buttons/button-like.svg");

    if (button === "next") {
        // Play next song of the queue
        songOrder++;
        if (songOrder > document.querySelectorAll("#queue button").length) {
            songOrder = 1;
        }
    } else if (button === "prev") {
        // Play previous song of the queue
        songOrder--;
        if (songOrder < 1) {
            songOrder = document.querySelectorAll("#queue button").length;
        }
    }

    // Get the current selected song button
    let currentSelectedSong = document.querySelector(".song__info--selected");
    if (!currentSelectedSong) {
        songOrder = 1;
    }

    // Get the newly selected song button
    let newSelectedSong = document.querySelector(`#queue li:nth-child(${songOrder}) button`);

    // Switch songs
    switchSong(currentSelectedSong, newSelectedSong);

    // Play switched song [API functionality]
    // audio_player.setAttribute("src", "img/test-song.mp3");
    btnPlay.children[0].setAttribute("src", "img/buttons/button-pause.svg");
    audio_player.setAttribute("src", newSelectedSong.getAttribute("audio-src"))
    switchAudioData();
    audio_player.play();

    const songId = newSelectedSong.getAttribute("audio-id");
    // Update track PlayCount
    module.updateTrackCount(songId);
    console.log("Song has been changed.");
    // Update user history
    if (getCookie("user-id")) {
        module.updateUserHistory(getCookie("user-id"), songId);
    }
}

// Controls Functions
let btnRandomize = document.getElementById("btn-randomize");
if (btnRandomize) {
    btnRandomize.addEventListener("click", function () {
        // Shuffle queue
        let queue = document.getElementById("queue");
        for (let i = queue.children.length; i >= 0; i--) {
            queue.appendChild(queue.children[Math.random() * i | 0]);
        }

        // Update the current song image and index
        let newSelectedButton = document.querySelector(".song__info--selected");
        if (newSelectedButton) {

            // Scroll to the newly selected song button
            newSelectedButton.scrollIntoView({behavior: "smooth", block: "nearest"});

            // Update the current song image and index
            songOrder = Array.from(queue.children).indexOf(newSelectedButton.parentNode) + 1;
            document.querySelector(".current-song__image").src = `img/discs/song-disk--0${(songOrder - 1) % 9 + 1}.png`;
        }
    });
}

let btnRepeat = document.getElementById("btn-repeat");
if (btnRepeat) {
    btnRepeat.addEventListener("click", function () {
        // Repeat song one more time <=> update queue
        let currentSelectedSong = document.querySelector(".song__info--selected");

        // If no song is selected, disable repeat button and return
        if (!currentSelectedSong) {
            document.querySelector("#btn-repeat").setAttribute("disabled", "");
            return;
        }

        // Repeat the same song
        let btnRepeatImg = btnRepeat.children[0];
        if (btnRepeatImg.getAttribute("src") === "img/buttons/button-repeat--active.svg")
        {
            btnRepeat.children[0].setAttribute("src", "img/buttons/button-repeat.svg");
            audio_player.removeAttribute("loop");
        } else {
            btnRepeat.children[0].setAttribute("src", "img/buttons/button-repeat--active.svg");
            audio_player.setAttribute("loop", "");
        }
    });
}

function switchAudioData() {
    let curSelected = document.querySelector(".song__info--selected");
    document.getElementById("artist-name").textContent = curSelected.textContent.split(" - ")[0];
    document.getElementById("song-name").textContent = curSelected.textContent.split(" - ")[1];
}

let btnPlay = document.getElementById("btn-play");
if (btnPlay) {
    btnPlay.addEventListener("click", function () {
        const playerIcon = btnPlay.children[0];

        if (playerIcon.getAttribute("src") === "img/buttons/button-play.svg") {
            playerIcon.setAttribute("src", "img/buttons/button-pause.svg");
            let curSelected = document.querySelector(".song__info--selected");
            if (!curSelected) {
                btnNext.click();
            } else if (changed) {
                console.log("Song has been changed.");
                const songId = curSelected.getAttribute("audio-id");
                // Update track PlayCount
                module.updateTrackCount(songId);
                // Update user history
                if (getCookie("user-id")) {
                    module.updateUserHistory(getCookie("user-id"), songId);
                }
                audio_player.setAttribute("src", document.querySelector(".song__info--selected").getAttribute("audio-src"))
            }

            // Play the current selected or, if not, the first song [API functionality]
            switchAudioData();
            audio_player.play();
        } else {
            playerIcon.setAttribute("src", "img/buttons/button-play.svg");
            changed = false;
            audio_player.pause();
        }
    });
}

let btnLike = document.getElementById("btn-like");
if (btnLike) {
    btnLike.addEventListener("click", function () {
        if (!getCookie("user-id")) {
            window.location.href = 'signin.html';
            return;
        }

        const likeIcon = document.getElementById("btn-like").children[0];
        const currentSelectedSong = document.querySelector(".song__info--selected");

        if (likeIcon.getAttribute("src") === "img/buttons/button-like.svg") {
            likeIcon.setAttribute("src", "img/buttons/button-like--active.svg");
            currentSelectedSong.setAttribute("favourite", "true");
        } else {
            likeIcon.setAttribute("src", "img/buttons/button-like.svg");
            currentSelectedSong.setAttribute("favourite", "false");
        }

        // Add song to favourites playlist [API functionality]
        const songId = document.querySelector(".song__info--selected").getAttribute("audio-id");
        module.updateFavourites(getCookie("user-id"), songId);
    });
}
const playlistDropdown = document.getElementById("dropdown");
const addPlaylistForm = document.getElementById("add-playlist");
addPlaylistForm.addEventListener('submit', (event) => {

    event.preventDefault();
    const playlistInput = document.getElementById('newPlaylistName');
    const songId = document.querySelector(".song__info--selected").getAttribute("audio-id");

    // Create new playlist in Firestore
    module.addPlaylist(getCookie("user-id"), playlistInput.value, songId);
    playlistDropdown.classList.toggle("controls__playlists-dropdown--shown");
    alert("Playlist was succesfully created!");

    // Update playlists dropdown
    document.getElementById("playlists-dropdown").innerHTML = "";
    playlistInput.value = "";
    module.fillPlaylists(getCookie("user-id"));
});

let btnAdd = document.getElementById("btn-add");
btnAdd.addEventListener("click", () => {
    if (!getCookie("user-id")) {
        window.location.href = 'signin.html';
        return;
    }

    playlistDropdown.classList.toggle("controls__playlists-dropdown--shown");
    document.getElementById('newPlaylistName').value = "";
});

document.addEventListener('click', function (event) {
    // If user clicks outside the dropdown and the button
    if (!playlistDropdown.contains(event.target) && event.target.id !== "btn-add" && event.target.id !== "btn-add__image") {
        // Hide the dropdown
        playlistDropdown.classList.remove('controls__playlists-dropdown--shown');
    }
});