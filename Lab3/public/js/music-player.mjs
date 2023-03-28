import {initializeApp} from "https://www.gstatic.com/firebasejs/9.18.0/firebase-app.js";
import {getFirestore, collection, updateDoc, doc, increment, getDocs} from "https://www.gstatic.com/firebasejs/9.18.0/firebase-firestore.js"
import {getStorage, ref, getDownloadURL} from "https://www.gstatic.com/firebasejs/9.18.0/firebase-storage.js";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAxKLYLXniNLRJY7_A0tgQDNquiGRTu79M",
    authDomain: "jukebox-655c8.firebaseapp.com",
    projectId: "jukebox-655c8",
    storageBucket: "jukebox-655c8.appspot.com",
    messagingSenderId: "463939212069",
    appId: "1:463939212069:web:937b136c280fcff49600cc",
    measurementId: "G-8DR0Y11E4K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const musicRef = collection(db, "music");
const storage = getStorage(app);

const playlist = document.getElementById("playlist");

// Get the data from Firebase Firestore and populate the playlist
export default {
    fillPlaylist: () => {
        getDocs(musicRef).then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                // Extract the data from the Firestore document
                const {Title, Artist, FileName, Owner, PlayCount} = doc.data();

                let newSong = document.createElement("li");
                newSong.classList.add("queue__song");

                let newSongButton = document.createElement("button");
                newSongButton.classList.add("song__info");
                newSongButton.setAttribute("audio-id", doc.id);
                newSongButton.innerHTML = `<b class="paragraph">${Artist} - ${Title}</b>`;

                const storageRef = ref(storage, `music/${FileName}`);

                // Get the download URL of the audio file
                getDownloadURL(storageRef).then((url) => {
                    newSongButton.setAttribute("audio-src", url);
                    newSong.appendChild(newSongButton);

                    // Add the song element to the playlist
                    playlist.appendChild(newSong);
                });
            });
        });
    },

    updateTrackCount: (id) => {
        // Access the Firestore document for the song with the given ID
        const songRef = doc(db, "music", id);

        // Update the PlayCount in the Firestore document
        updateDoc(songRef, {
            PlayCount: increment(1),
        }).catch((error) => {
            console.error("Error updating track count:", error);
        });
    }
}