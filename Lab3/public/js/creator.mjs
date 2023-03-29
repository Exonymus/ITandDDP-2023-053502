import module from "./firebase.mjs"
import {addDoc, collection} from "https://www.gstatic.com/firebasejs/9.18.0/firebase-firestore.js";
import {uploadBytes, getDownloadURL, ref} from "https://www.gstatic.com/firebasejs/9.18.0/firebase-storage.js";

// Initialize Firebase
const storage = module.storage;
const db = module.db;

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

const creatorForm = document.getElementById('creatorForm');
creatorForm.addEventListener('submit', (e) => {
    e.preventDefault(); // prevent default form submission

    const artistName = document.getElementById('song__Artist').value;
    const songName = document.getElementById('song__Title').value;
    const song = document.getElementById('audio');

    if (!song || song && song.files[0] === undefined) {
        alert("Please select the song to upload!")
        return;
    }

    const songFile = song.files[0];
    const songRef = ref(storage, 'music/' + songFile.name);

    uploadBytes(songRef, songFile).then(() => {
        console.log('Song uploaded successfully!');
        addDoc(collection(db, "music"), {
            Title: songName,
            Artist: artistName,
            FileName: songFile.name,
            Owner: getCookie("user-id"),
            PlayCount: 0
        }).then(() => {
            alert("Song Upload was succesful!")
        }).catch((error) => {
            console.error('Error uploading song-info:', error);
        });
    }).catch((error) => {
        console.error('Error uploading file:', error);
    });

});