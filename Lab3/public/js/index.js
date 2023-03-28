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
    }

    module.fillPlaylist();

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

// Create a playlist mutation-observer
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
            // Child nodes have been added or removed from the playlist element
            const playlistButtons = document.querySelectorAll("#playlist button");
            playlistButtons.forEach((button) => {
                button.addEventListener("click", switchSongByClick);
            });
            if (document.querySelectorAll("#playlist button").length === 0)
            {
                playlistName.textContent = "Nothing to play"
            }
        }
    });
});

// Set up the observer to watch for changes to the playlist element
const observerConfig = { childList: true };
observer.observe(document.querySelector("#playlist"), observerConfig);

// Nav handlers
const navLinks = document.querySelectorAll('.nav__link');
const playlistName = document.querySelector('.playlist__name');

navLinks.forEach(link => {
    const linkButton = link.querySelector('.link');

    if (linkButton) { // Check if linkButton exists
        linkButton.addEventListener('click', () => {
            clearSelectedSong();
            // Add 'link--current' class to clicked button
            const currentLinkButton = document.querySelector('.link--current');
            currentLinkButton.classList.remove('link--current');
            linkButton.classList.add('link--current');

            window.history.pushState({}, null, `index.html?${linkButton.textContent.toLowerCase()}`);

            if (linkButton.tagName === "BUTTON") {
                // Change playlist name based on clicked button
                playlistName.textContent = linkButton.textContent;
                clearQueue();
            }
        });
    }
});

searchForm.addEventListener('submit', (event) => {
    clearSelectedSong();
    clearQueue();

    event.preventDefault();
    const encodedSearchQuery = document.getElementById('searchInput').value;

    // Change the URL without refreshing the page
    window.history.pushState({}, null, `index.html?search=${encodedSearchQuery}`);

    playlistName.textContent = "Search Results";

    // Search for the songs [API functionality]
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
let playlistButtons = document.querySelectorAll("#playlist button");


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
    changed = current && current.classList === next.classList || !current;

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
    }
}

function clearSelectedSong() {
    let currentSelectedSong = document.querySelector(".song__info--selected");
    switchSong(currentSelectedSong);
    document.getElementById("playlist").scrollIntoView({behavior: "smooth", block: "start"});
    document.querySelector("#btn-repeat").setAttribute("disabled", "");
    document.querySelector("#btn-add").setAttribute("disabled", "");
    document.querySelector("#btn-like").setAttribute("disabled", "");
    document.getElementById("btn-like").children[0].setAttribute("src", "img/buttons/button-like.svg");
    document.querySelector(".current-song__image").src = `img/discs/song-disk--01.png`;
}

function clearQueue() {
    document.getElementById("playlist").innerHTML = "";
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
        module.updateTrackCount(newSelectedSong.getAttribute("audio-id"));
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
        if (songOrder > document.querySelectorAll("#playlist button").length) {
            songOrder = 1;
        }
    } else if (button === "prev") {
        // Play previous song of the queue
        songOrder--;
        if (songOrder < 1) {
            songOrder = document.querySelectorAll("#playlist button").length;
        }
    }

    // Get the current selected song button
    let currentSelectedSong = document.querySelector(".song__info--selected");
    if (!currentSelectedSong) {
        songOrder = 1;
    }

    // Get the newly selected song button
    let newSelectedSong = document.querySelector(`#playlist li:nth-child(${songOrder}) button`);

    // Switch songs
    switchSong(currentSelectedSong, newSelectedSong);

    // Play switched song [API functionality]
    // audio_player.setAttribute("src", "img/test-song.mp3");
    btnPlay.children[0].setAttribute("src", "img/buttons/button-pause.svg");
    audio_player.setAttribute("src", newSelectedSong.getAttribute("audio-src"))
    switchAudioData();
    audio_player.play();
    module.updateTrackCount(newSelectedSong.getAttribute("audio-id"));
}

// Controls Functions
let btnRandomize = document.getElementById("btn-randomize");
if (btnRandomize) {
    btnRandomize.addEventListener("click", function () {
        // Shuffle queue
        let playlist = document.getElementById("playlist");
        for (let i = playlist.children.length; i >= 0; i--) {
            playlist.appendChild(playlist.children[Math.random() * i | 0]);
        }

        // Update the current song image and index
        let newSelectedButton = document.querySelector(".song__info--selected");
        if (newSelectedButton) {

            // Scroll to the newly selected song button
            newSelectedButton.scrollIntoView({behavior: "smooth", block: "nearest"});

            // Update the current song image and index
            songOrder = Array.from(playlist.children).indexOf(newSelectedButton.parentNode) + 1;
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

        // Create a new li element with the specified classes
        let newSong = document.createElement("li");
        newSong.classList.add("queue__song");

        // Create a new button element with the specified classes and text
        let newSongButton = document.createElement("button");
        newSongButton.classList.add("song__info");
        newSongButton.setAttribute("audio-src", currentSelectedSong.getAttribute("audio-src"));
        newSongButton.setAttribute("audio-id", currentSelectedSong.getAttribute("audio-id"));
        newSongButton.innerHTML = `<b class="paragraph">${currentSelectedSong.querySelector("b").textContent}</b>`;
        newSongButton.addEventListener("click", switchSongByClick);

        // Add the new button element to the new li element
        newSong.appendChild(newSongButton);

        // Update song amount
        playlistButtons = document.querySelectorAll("#playlist button")

        // Insert the new li element after the current selected song button's parent li element
        currentSelectedSong.closest("li").insertAdjacentElement("afterend", newSong);
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
                module.updateTrackCount(curSelected.getAttribute("audio-id"));
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
        if (likeIcon.getAttribute("src") === "img/buttons/button-like.svg") {
            likeIcon.setAttribute("src", "img/buttons/button-like--active.svg");
        } else {
            likeIcon.setAttribute("src", "img/buttons/button-like.svg");
        }

        // Add song to favourites playlist [API functionality]
    });
}

let btnAdd = document.getElementById("btn-add");
let playlistDropdown = document.getElementById("playlist-dropdown");
btnAdd.addEventListener("click", () => {
    if (!getCookie("user-id")) {
        window.location.href = 'signin.html';
        return;
    }

    playlistDropdown.classList.toggle("controls__playlists-dropdown--shown");

    // Fill playlistDropdown with user playlists [API functionality]
});

document.querySelectorAll(".controls__playlists-dropdown__content button").forEach((button) => {
    button.addEventListener("click", () => {
        playlistDropdown.classList.toggle("controls__playlists-dropdown--shown");

        // Add to proper playlist [API functionality]
    });
});

document.addEventListener('click', function (event) {
    // If user clicks outside the dropdown and the button
    if (!playlistDropdown.contains(event.target) && event.target.id !== "btn-add" && event.target.id !== "btn-add__image") {
        // Hide the dropdown
        playlistDropdown.classList.remove('controls__playlists-dropdown--shown');
    }
});