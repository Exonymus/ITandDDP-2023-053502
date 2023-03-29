import {initializeApp} from "https://www.gstatic.com/firebasejs/9.18.0/firebase-app.js";
import {getStorage} from "https://www.gstatic.com/firebasejs/9.18.0/firebase-storage.js";
import {getAuth} from "https://www.gstatic.com/firebasejs/9.18.0/firebase-auth.js";
import {getFirestore} from "https://www.gstatic.com/firebasejs/9.18.0/firebase-firestore.js";

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
const storage = getStorage(app);
const auth = getAuth(app);
const db = getFirestore(app);

export default {
    app, storage, auth, db
}