import module from "./firebase.mjs"
import {
    collection,
    doc,
    increment,
    getDocs,
    getDoc,
    setDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/9.18.0/firebase-firestore.js"
import {ref, getDownloadURL} from "https://www.gstatic.com/firebasejs/9.18.0/firebase-storage.js";

// Initialize Firebase
const db = module.db;
const storage = module.storage;
const musicRef = collection(db, "music");
const queue = document.getElementById("queue");
const playlists = document.getElementById("playlists-dropdown");


function addToQueue(doc, id) {
    const Title = doc.Title;
    const Artist = doc.Artist;
    const FileName = doc.FileName;

    let newSong = document.createElement("li");
    newSong.classList.add("queue__song");

    let newSongButton = document.createElement("button");
    newSongButton.classList.add("song__info");
    newSongButton.innerHTML = `<b class="paragraph">${Artist} - ${Title}</b>`;
    newSongButton.setAttribute("audio-id", id);

    const storageRef = ref(storage, `music/${FileName}`);

    newSong.appendChild(newSongButton);

    // Add the song element to the queue
    queue.appendChild(newSong);

    // Get the download URL of the audio file
    getDownloadURL(storageRef).then((url) => {
        newSongButton.setAttribute("audio-src", url);
    });
}

function updatePlaylist(userId, playlistId, playlistType, songId) {
    if (playlistType === "custom") {
        const playlistRef = doc(collection(db, "users", userId, "playlists"), playlistId);
        getDoc(playlistRef).then((doc) => {
            const trackList = doc.data().TrackList || [];
            if (!trackList.includes(songId)) {
                trackList.push(songId);
                setDoc(playlistRef, {TrackList: trackList}, {merge: true}).then(() => {
                    alert("Song was successfully added to the playlist!")
                });
            }
        }).catch((error) => {
            console.error('Error getting playlist:', error);
        });
    } else {
        const playlistsRef = collection(db, "users", userId, "playlists");
        getDocs(playlistsRef).then((playlistsSnapshot) => {
            playlistsSnapshot.forEach((doc) => {
                const playlist = doc.data();
                if (playlist && playlist.Name === playlistId) {
                    const trackList = doc.data().TrackList || [];
                    const existingSongIds = trackList.map((track) => track.songId);

                    if (!existingSongIds.includes(songId)) {
                        trackList.push({songId: songId});
                        updateDoc(doc, {TrackList: trackList});
                    }
                }
            });
        }).catch((error) => {
            console.error("Error getting playlists:", error);
        });
    }
}

export default {
    // Get the data from Firebase Firestore and populate the queue
    fillQueue: () => {
        getDocs(musicRef).then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                // Extract the data from the Firestore document
                addToQueue(doc.data(), doc.id);
            });
        });
    },

    clearQueue: () => {
        document.getElementById("queue").scrollIntoView({behavior: "smooth", block: "start"});
        document.querySelector(".current-song__image").src = `img/discs/song-disk--01.png`;

        // Reset audio-player state
        document.getElementById("audio-player").pause();
        document.getElementById("audio-player").setAttribute("src", "");
        document.getElementById("audio-player").removeAttribute("loop");

        // Reset buttons accessibility
        document.getElementById("btn-repeat").setAttribute("disabled", "");
        document.getElementById("btn-add").setAttribute("disabled", "");
        document.getElementById("btn-like").setAttribute("disabled", "");

        // Reset buttons images
        document.getElementById("btn-like").children[0].setAttribute("src", "img/buttons/button-like.svg");
        document.getElementById("btn-repeat").children[0].setAttribute("src", "img/buttons/button-repeat.svg");
        document.getElementById("btn-play").children[0].setAttribute("src", "img/buttons/button-play.svg");

        // Reset displayed song data
        document.getElementById("queue").innerHTML = "";
        document.getElementById("artist-name").innerHTML = "&#x1F3B5;";
        document.getElementById("song-name").innerHTML = "&#x1F3B5;";
    },

    search: (encodedSearchQuery) => {
        getDocs(musicRef).then((songsSnapshot) => {
            songsSnapshot.forEach((doc) => {
                if (doc.data().Title.toLowerCase().indexOf(encodedSearchQuery.toLowerCase()) !== -1 ||
                    doc.data().Artist.toLowerCase().indexOf(encodedSearchQuery.toLowerCase()) !== -1) {
                    addToQueue(doc.data(), doc.id);
                }
            });
        }).catch((error) => {
            console.error('Error getting music:', error);
        });
    },

    getPopularSongs: async () => {
        try {
            const songsSnapshot = await getDocs(musicRef);
            const topSongs = [];

            songsSnapshot.forEach((doc) => {
                topSongs.push(doc); // push doc instead of doc.data()
            });

            // Sort the songs by play count in descending order
            topSongs.sort((a, b) => b.data().PlayCount - a.data().PlayCount);

            // Get an array of promises to add the songs to the queue
            const promises = topSongs.slice(0, 5).map((doc) => addToQueue(doc.data(), doc.id));

            // Wait for all the promises to resolve
            await Promise.all(promises);
        } catch (error) {
            console.error('Error getting music:', error);
        }
    },

    // Update track playcount & user? history
    updateTrackCount: (id, userId = null) => {
        // Access the Firestore document for the song with the given ID
        const songRef = doc(db, "music", id);

        // Update the PlayCount in the Firestore document
        updateDoc(songRef, {
            PlayCount: increment(1),
        }).catch((error) => {
            console.error("Error updating track count:", error);
        });

        if (userId) {
            const userHistoryRef = doc(collection(db, "users", userId, "history"));
            getDoc(userHistoryRef).then((historySnapshot) => {
                let history = historySnapshot.data() || [];
                const index = history.indexOf(id);
                if (index !== -1) {
                    // If the track has been played, remove it from its current position
                    history.splice(index, 1);
                }

                // Add the track to the beginning of the array
                history.unshift(id);

                // Limit the history to 10 tracks
                if (history.length > 6) {
                    history = history.slice(0, 6);
                }

                // Update the user's history in Firestore
                setDoc(userHistoryRef, {history}).catch((error) => {
                    console.error("Error setting history:", error);
                });
            }).catch((error) => {
                console.error("Error updating history:", error);
            });
        }
    },

    fillPlaylists(userId) {
        const playlistsRef = collection(db, "users", userId, "playlists");
        getDocs(playlistsRef).then((playlistsSnapshot) => {
            playlistsSnapshot.forEach((doc) => {
                const playlist = doc.data();
                if (playlist && playlist.Type === "custom") {
                    const Name = playlist.Name;
                    const Id = doc.id;

                    // Create playlist element
                    let newPlaylist = document.createElement("li");
                    let newPlaylistButton = document.createElement("button");
                    newPlaylistButton.classList.add("controls__playlists-dropdown__playlist");
                    newPlaylistButton.innerHTML = Name;
                    newPlaylistButton.setAttribute("playlist-id", Id);

                    newPlaylist.appendChild(newPlaylistButton);

                    // Add the playlist element to the playlists dropdown
                    playlists.appendChild(newPlaylist);

                    // Add click listener
                    newPlaylistButton.addEventListener("click", () => {
                        document.getElementById("dropdown").classList.toggle("controls__playlists-dropdown--shown");
                        const songId = document.querySelector(".song__info--selected").getAttribute("audio-id");

                        // Add to proper playlist [API functionality]
                        updatePlaylist(userId, Id, "custom", songId)
                    });
                }
            });
        }).catch((error) => {
            console.error("Error getting playlists:", error);
        });
    },

    addPlaylist(userId, playlistName, songId) {
        const playlistsRef = doc(collection(db, "users", userId, "playlists"));

        // Use set to create the playlist doc or overwrite if it already exists
        setDoc(playlistsRef, {
            Name: playlistName,
            Type: "custom",
            TrackList: [songId],
        }).catch((error) => {
            console.error("Error creating playlist:", error);
        });

        console.log(`Playlist ${playlistName} with track ${songId} added successfully.`);
    },

}