import module from "./firebase.mjs"
import {
    collection, doc, getDoc, getDocs, increment, setDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/9.18.0/firebase-firestore.js"
import {getDownloadURL, ref} from "https://www.gstatic.com/firebasejs/9.18.0/firebase-storage.js";

// Initialize Firebase
const db = module.db;
const storage = module.storage;
const musicRef = collection(db, "music");
const queue = document.getElementById("queue");
const playlists = document.getElementById("playlists-dropdown");


function addToQueue(data, songId, userId = null) {
    const Title = data.Title;
    const Artist = data.Artist;
    const FileName = data.FileName;

    let newSong = document.createElement("li");
    newSong.classList.add("queue__song");

    let newSongButton = document.createElement("button");
    newSongButton.classList.add("song__info");
    newSongButton.innerHTML = `<b class="paragraph">${Artist} - ${Title}</b>`;
    newSongButton.setAttribute("audio-id", songId);

    const storageRef = ref(storage, `music/${FileName}`);

    newSong.appendChild(newSongButton);

    // Add the song element to the queue
    queue.appendChild(newSong);

    // Get the download URL of the audio file
    getDownloadURL(storageRef).then((url) => {
        newSongButton.setAttribute("audio-src", url);
    });

    // Get favourites-belong attribute
    if (userId) {
        const favouritesRef = doc(db, `users/${userId}/playlists/favourites`);
        getDoc(favouritesRef).then((favouritesSnapshot) => {
            let favourites = (favouritesSnapshot && favouritesSnapshot.data()) ? favouritesSnapshot.data().TrackList : [];

            if (!favourites.includes(songId)) {
                newSongButton.setAttribute("favourite", "false");
            } else {
                newSongButton.setAttribute("favourite", "true");
            }
        }).catch((error) => {
            console.error("Error getting favourites:", error);
        });
    }
}

function updatePlaylist(userId, playlistId, playlistType, songId) {
    if (playlistType === "custom") {
        const playlistRef = doc(collection(db, "users", userId, "playlists"), playlistId);
        getDoc(playlistRef).then((doc) => {
            const trackList = doc.data().TrackList || [];
            if (!trackList.includes(songId)) {
                trackList.push(songId);
                setDoc(playlistRef, {
                    TrackList: trackList
                }, {merge: true}).then(() => {
                    console.log(`Song was successfully added to the playlist: ${playlistId}.`);
                });
            } else {
                console.log(`Song is already in playlist: ${playlistId}.`);
            }
        }).catch((error) => {
            console.error('Error getting playlist:', error);
        });
    }
}

export default {
    // Get the data from Firebase Firestore and populate the queue
    fillQueue: (userId = null) => {
        getDocs(musicRef).then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                // Extract the data from the Firestore document
                addToQueue(doc.data(), doc.id, userId);
            });
        });
    },

    fillPlaylists: (userId) => {
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

    search: (encodedSearchQuery, userId = null) => {
        getDocs(musicRef).then((songsSnapshot) => {
            songsSnapshot.forEach((doc) => {
                if (doc.data().Title.toLowerCase().indexOf(encodedSearchQuery.toLowerCase()) !== -1 || doc.data().Artist.toLowerCase().indexOf(encodedSearchQuery.toLowerCase()) !== -1) {
                    addToQueue(doc.data(), doc.id, userId);
                }
            });
        }).catch((error) => {
            console.error('Error getting music:', error);
        });
    },

    getPopularSongs: async (userId = null) => {
        try {
            const songsSnapshot = await getDocs(musicRef);
            const topSongs = [];

            songsSnapshot.forEach((doc) => {
                topSongs.push(doc); // push doc instead of doc.data()
            });

            // Sort the songs by play count in descending order
            topSongs.sort((a, b) => b.data().PlayCount - a.data().PlayCount);

            // Get an array of promises to add the songs to the queue
            const promises = topSongs.slice(0, 5).map((doc) => addToQueue(doc.data(), doc.id, userId));

            // Wait for all the promises to resolve
            await Promise.all(promises);
        } catch (error) {
            console.error('Error getting songs:', error);
        }
    },

    getRecentSongs: async (userId) => {
        try {
            const historyDoc = await getDoc(doc(db, `users/${userId}/playlists/history`));
            const recentSongs = historyDoc && historyDoc.data() && historyDoc.data().TrackList ? historyDoc.data().TrackList : [];

            // Sort the songs by timestamp in descending order
            recentSongs.sort((a, b) => b.timestamp - a.timestamp);

            // Get songs docs from music/{songId} and create promises
            const recentSongsDocs = [];
            for (const song of recentSongs) {
                const docRef = doc(db, 'music', song.songId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    recentSongsDocs.push(docSnap);
                }
            }

            // Get an array of promises to add the songs to the queue
            const promises = recentSongsDocs.map((doc) => addToQueue(doc.data(), doc.id, userId));

            // Wait for all the promises to resolve
            await Promise.all(promises);
        } catch (error) {
            console.error('Error getting recent songs:', error);
        }
    },

    getPlaylists: (userId) => {
        const playlistsRef = collection(db, "users", userId, "playlists");
        getDocs(playlistsRef).then((playlistsSnapshot) => {
            const playlistElements = [];
            playlistsSnapshot.forEach((playlistDoc) => {
                const playlist = playlistDoc.data();
                if (playlist && playlistDoc.id !== "history") {
                    const Name = playlist.Name;
                    const Id = playlistDoc.id;

                    let newPlaylist = document.createElement("li");
                    newPlaylist.classList.add("queue__song");

                    let newPlaylistButton = document.createElement("button");
                    newPlaylistButton.classList.add("song__info");
                    if (Id !== "favourites") {
                        newPlaylistButton.innerHTML = `<b class="paragraph">${Name}</b>`;
                    } else {
                        newPlaylistButton.innerHTML = `<b class="paragraph paragraph--special">✪ Favourites ✪</b>`;
                    }
                    newPlaylistButton.setAttribute("playlist-id", Id);

                    newPlaylist.appendChild(newPlaylistButton);
                    playlistElements.push(newPlaylist);

                    // Add click listener
                    newPlaylistButton.addEventListener("click", () => {
                        // Prepare the queue
                        queue.innerHTML = "";
                        const queueName = document.querySelector('.queue__name');
                        queueName.textContent = Id !== "favourites"? `Playlist: ${Name}` : "✪ Favourites ✪";

                        const trackList = playlist.TrackList || [];
                        if (trackList < 1) {
                            return;
                        }
                        trackList.forEach((track) => {
                            let songRef = doc(db, "music", track);
                            getDoc(songRef).then((doc) => {
                                addToQueue(doc.data(), doc.id, userId);
                            }).catch((error) => {
                                console.error(`Error getting playlist[${Id}] tracks:`, error);
                            });
                        });
                        console.log(`Playlist [${Id}] selected and shown in the queue.`)
                    });
                }
            });

            // Sort the playlist elements with favourites on top
            playlistElements.sort((a, b) => {
                if (a.firstChild.firstChild.textContent.includes("Favourites")) {
                    return -1;
                }
                if (b.firstChild.firstChild.textContent.includes("Favourites")) {
                    return 1;
                }
                return 0;
            });

            // Add the sorted playlist elements to the queue
            playlistElements.forEach((playlistElement) => {
                queue.appendChild(playlistElement);
            });
        }).catch((error) => {
            console.error("Error getting playlists:", error);
        });
    },

    // Update track plays in Firestore
    updateTrackCount: (id) => {
        // Access the Firestore document for the song with the given ID
        const songRef = doc(db, "music", id);

        // Update the PlayCount in the Firestore document
        updateDoc(songRef, {
            PlayCount: increment(1),
        }).catch((error) => {
            console.error("Error updating track count:", error);
        });
    },

    updateFavourites: (userId, songId) => {
        const favouritesRef = doc(db, `users/${userId}/playlists/favourites`);
        getDoc(favouritesRef).then((favouritesSnapshot) => {
            let favourites = (favouritesSnapshot && favouritesSnapshot.data()) ? favouritesSnapshot.data().TrackList : [];

            if (!favourites.includes(songId)) {
                favourites.push(songId);
            } else {
                favourites = favourites.filter((track) => track !== songId);
            }
            setDoc(favouritesRef, {
                TrackList: favourites, Type: "system"
            }, {merge: true}).then(() => {
                console.log(favourites.includes(songId) ? "Song was successfully added to the favourites!" : "Song was successfully removed from the favourites!")
            }).catch((error) => {
                console.error("Error updating favourites:", error);
            });
        }).catch((error) => {
            console.error("Error getting favourites:", error);
        });
    },

    addPlaylist: (userId, playlistName, songId) => {
        const playlistsRef = doc(collection(db, "users", userId, "playlists"));

        // Use set to create the playlist doc or overwrite if it already exists
        setDoc(playlistsRef, {
            Name: playlistName, Type: "custom", TrackList: [songId],
        }).catch((error) => {
            console.error("Error creating playlist:", error);
        });

        console.log(`Playlist ${playlistName} with track ${songId} added successfully.`);
    },

    updateUserHistory: (userId, songId) => {
        const historyRef = doc(db, `users/${userId}/playlists/history`);
        getDoc(historyRef).then((historySnapshot) => {
            let history = (historySnapshot && historySnapshot.data()) && historySnapshot.data().TrackList ? historySnapshot.data().TrackList : [];
            let trackList = history.map((track) => ({...track, timestamp: track.timestamp}));
            let existingTrackIndex = trackList.findIndex((track) => track.songId === songId);
            if (existingTrackIndex !== -1) {
                trackList.splice(existingTrackIndex, 1);
            }
            trackList.unshift({songId, timestamp: new Date().getTime()});
            trackList = trackList.slice(0, 8);
            setDoc(historyRef, {
                Type: "system", TrackList: trackList
            }, {merge: true}).then(() => {
                console.log("History updated successfully.");
            }).catch((error) => {
                console.error("Error updating history:", error);
            });
        }).catch((error) => {
            console.error("Error getting history:", error);
        });
    }

}