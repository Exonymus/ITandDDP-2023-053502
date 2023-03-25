// Nav handlers
const navLinks = document.querySelectorAll('.nav__link');
const playlistName = document.querySelector('.playlist__name');

navLinks.forEach(link => {
    const linkButton = link.querySelector('.link');

    if (linkButton) { // Check if linkButton exists
        linkButton.addEventListener('click', () => {
            // Add 'link--current' class to clicked button
            const currentLinkButton = document.querySelector('.link--current');
            currentLinkButton.classList.remove('link--current');
            linkButton.classList.add('link--current');

            if (linkButton.tagName === "BUTTON") {
                // Change playlist name based on clicked button
                playlistName.textContent = linkButton.textContent;
            }
        });
    }
});

const searchForm = document.querySelector('.navbar__search__content');
searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    playlistName.textContent = "Search Results";
});


// Music Player functions
let songOrder = 1;
let playlistButtons = document.querySelectorAll("#playlist button");

playlistButtons.forEach((button) => {
    button.addEventListener("click", switchSongByClick);
});

let btnNext = document.getElementById("btn-next");
if (btnNext) {
    btnNext.addEventListener("click", function (e) {
        switchSongByButton("next");
    });
}

let btnPrev = document.getElementById("btn-prev");
if (btnPrev) {
    btnPrev.addEventListener("click", function (e) {
        switchSongByButton("prev");
    });
}

function switchSongByClick(event) {
    // Enable repeat button
    document.querySelector("#btn-repeat").removeAttribute("disabled");

    // Get the current selected song button and switch its classes
    let currentSelectedButton = document.querySelector(".song__info--selected");
    if (currentSelectedButton) {
        currentSelectedButton.classList.remove("song__info--selected");
        currentSelectedButton.classList.add("song__info");
        currentSelectedButton.removeAttribute("disabled");
        currentSelectedButton.querySelector("b").classList.remove("info--selected__paragraph");
        currentSelectedButton.querySelector("b").classList.add("paragraph");
        currentSelectedButton.classList.remove("current-selected-song");
    }

    // Get the newly selected song button and switch its classes
    let newSelectedButton = event.target.closest("button");
    if (newSelectedButton) {
        newSelectedButton.classList.remove("song__info");
        newSelectedButton.classList.add("song__info--selected");
        newSelectedButton.setAttribute("disabled", "");
        newSelectedButton.querySelector("b").classList.remove("paragraph");
        newSelectedButton.querySelector("b").classList.add("info--selected__paragraph");
        newSelectedButton.classList.add("current-selected-song");

        // Scroll to the newly selected song button
        newSelectedButton.scrollIntoView({behavior: "smooth", block: "nearest"});

        // Update the current song image
        songOrder = Array.from(event.target.closest("ul").children).indexOf(event.target.closest("li")) + 1;
        document.querySelector(".current-song__image").src = `public/discs/song-disk--0${(songOrder - 1) % 9 + 1}.png`;
    }
}


function switchSongByButton(button) {
    // Enable repeat button
    document.querySelector("#btn-repeat").removeAttribute("disabled");

    // Get the current selected song button and switch its classes
    let currentSelectedButton = document.querySelector(".song__info--selected");
    if (currentSelectedButton) {
        currentSelectedButton.classList.remove("song__info--selected");
        currentSelectedButton.classList.add("song__info");
        currentSelectedButton.removeAttribute("disabled");
        currentSelectedButton.querySelector("b").classList.remove("info--selected__paragraph");
        currentSelectedButton.querySelector("b").classList.add("paragraph");
        currentSelectedButton.classList.remove("current-selected-song");
    } else {
        songOrder = 0;
    }

    if (button === "next") {
        // Play next song of the queue
        songOrder++;
        if (songOrder > playlistButtons.length) {
            songOrder = 1;
        }
    } else if (button === "prev") {
        // Play previous song of the queue
        songOrder--;
        if (songOrder < 1) {
            songOrder = playlistButtons.length;
        }
    }

    // Get the newly selected song button and switch its classes
    let newSelectedButton = document.querySelector(`#playlist li:nth-child(${songOrder}) button`);
    if (newSelectedButton) {
        newSelectedButton.classList.remove("song__info");
        newSelectedButton.classList.add("song__info--selected");
        newSelectedButton.setAttribute("disabled", "");
        newSelectedButton.querySelector("b").classList.remove("paragraph");
        newSelectedButton.querySelector("b").classList.add("info--selected__paragraph");
        newSelectedButton.classList.add("current-selected-song");

        // Scroll to the newly selected song button
        newSelectedButton.scrollIntoView({behavior: "smooth", block: "nearest"});

        // Update the current song image
        document.querySelector(".current-song__image").src = `public/discs/song-disk--0${(songOrder - 1) % 9 + 1}.png`;
    }
}

// Controls Functions
let btnRandomize = document.getElementById("btn-randomize");
if (btnRandomize) {
    btnRandomize.addEventListener("click", function (e) {
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
            document.querySelector(".current-song__image").src = `public/discs/song-disk--0${(songOrder - 1) % 9 + 1}.png`;
        }
    });
}

let btnRepeat = document.getElementById("btn-repeat");
if (btnRepeat) {
    btnRepeat.addEventListener("click", function (e) {
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

let btnAdd = document.getElementById("btn-add");
if (btnAdd) {
    btnAdd.addEventListener("click", function (e) {
        // Add to playlist
    });
}

let btnLike = document.getElementById("btn-like");
if (btnLike) {
    btnLike.addEventListener("click", function (e) {
        // Add song to Favourites playlist
    });
}

let btnPlay = document.getElementById("btn-play");
if (btnPlay) {
    btnPlay.addEventListener("click", function (e) {
        const playerIcon = document.getElementById("btn-play").children[0];
        if (playerIcon.getAttribute("src") === "public/button-play.svg") {
            playerIcon.setAttribute("src", "public/button-pause.svg");

            if (!document.querySelector(".song__info--selected")) {
                btnNext.click();
            }
        } else {
            playerIcon.setAttribute("src", "public/button-play.svg");
        }
    });
}