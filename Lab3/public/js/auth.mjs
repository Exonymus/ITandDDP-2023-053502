import {initializeApp} from "https://www.gstatic.com/firebasejs/9.18.0/firebase-app.js";
import {getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword} from "https://www.gstatic.com/firebasejs/9.18.0/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL, listAll } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-storage.js";

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
const auth = getAuth(app)
const storage = getStorage(app);

function authenticate(auth, emailValue, passValue, formName) {
    if (formName === "signup") {
        return createUserWithEmailAndPassword(auth, emailValue, passValue);
    } else if (formName === "signin") {
        return signInWithEmailAndPassword(auth, emailValue, passValue);
    }
}

const authForm = document.getElementById('authForm');
authForm.addEventListener('submit', (e) => {
    e.preventDefault(); // prevent default form submission

    const formName = authForm.getAttribute("name");
    const email = document.getElementById('email');
    const pass = document.getElementById('pass');
    const passRepeat = document.getElementById('pass--repeat');
    const avatar = document.getElementById('avatar');

    // Pass Check
    if (formName === "signup") {
        if (pass.value !== passRepeat.value) {
            alert("Passwords don't match");
            pass.value = "";
            passRepeat.value = "";
            return;
        }
    }

    authenticate(auth, email.value, pass.value, formName)
        .then((userCredential) => {
            const user = userCredential.user;

            let date, expires;
            date = new Date();
            date.setTime(date.getTime() + 24 * 60 * 60 * 1000);
            expires = "; expires=" + date.toUTCString();

            document.cookie = "user-id" + "=" + (user.uid || "") + expires + "; path=/";
            document.cookie = "username" + "=" + (email.value.split("@")[0] || "") + expires + "; path=/";

            if (formName === "signup") {
                console.log('User account created: ', user.uid);
                if (avatar.files[0] !== undefined) {
                    // Upload avatar value to cloudstore
                    const avatarFile = avatar.files[0];
                    const avatarRef = ref(storage,'avatars/' + user.uid + '/' + avatarFile.name);

                    uploadBytes(avatarRef, avatarFile).then(() => {
                        console.log('File uploaded successfully!');

                        // Get the download URL of the file
                        getDownloadURL(avatarRef).then((url) => {
                            document.cookie = "avatar" + "=" + (url || "") + expires + "; path=/";

                            // Redirect to home page
                            window.location.href = `index.html`;
                        }).catch((error) => {
                            console.error('Error getting download URL:', error);
                        });
                    }).catch((error) => {
                        console.error('Error uploading file:', error);
                    });
                } else {
                    // Redirect to home page
                    window.location.href = `index.html`;
                }
            } else {
                console.log('User logged-in: ', user.uid);
                // Get avatar link from cloudstore
                const avatarRef = ref(storage,'avatars/' + user.uid);
                listAll(avatarRef)
                    .then((res) => {
                        // Get the first file in the list
                        const fileRef = res.items[0];

                        // Get the download URL of the file
                        getDownloadURL(fileRef)
                            .then((url) => {
                                // Use the download URL to display the image
                                document.cookie = "avatar" + "=" + (url || "") + expires + "; path=/";

                                // Redirect to home page
                                window.location.href = `index.html`;
                            })
                            .catch((error) => {
                                console.error("Error getting download URL:", error);
                            });
                    })
                    .catch((error) => {
                        // Redirect to home page
                        window.location.href = `index.html`;
                    });
            }
        })
        .catch((error) => {
            if (formName === "signup") {
                console.error('Error creating user account: ', error);
                alert('Error creating user account: ' + error);
            } else {
                alert("Invalid credentials")
            }
        });
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