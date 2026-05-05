import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signInWithPopup, 
    GoogleAuthProvider,
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { 
    getDatabase, 
    ref, 
    set, 
    update 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

//  REPLACE WITH YOUR CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyB0gSeO4_6bJQRsPcJZ7VN5an0HPt-yZLQ",
  authDomain: "voting-app-71285.firebaseapp.com",
  projectId: "voting-app-71285",
  storageBucket: "voting-app-71285.firebasestorage.app",
  messagingSenderId: "1013925105423",
  appId: "1:1013925105423:web:64925a13d297186e89787a",
  measurementId: "G-7311HM8ZP5"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const provider = new GoogleAuthProvider();

// DOM
const emailInput = document.getElementById('email');
const passInput = document.getElementById('password');
const mainBtn = document.getElementById('mainBtn');
const googleBtn = document.getElementById('googleBtn');
const switchLink = document.getElementById('switchLink');
const title = document.getElementById('title');
const errorMsg = document.getElementById('error');
const switchMsg = document.getElementById('switchMsg');

let isLogin = true;

// Toggle UI
switchLink.addEventListener('click', (e) => {
    e.preventDefault();
    isLogin = !isLogin;

    title.innerText = isLogin ? "Login" : "Sign Up";
    mainBtn.innerText = isLogin ? "Log In" : "Sign Up";
    switchMsg.innerText = isLogin 
        ? "Don't have an account?" 
        : "Already have an account?";
    switchLink.innerText = isLogin ? "Sign Up" : "Log In";

    errorMsg.innerText = "";
});

// Validate email
function isValidEmail(email) {
    return /\S+@\S+\.\S+/.test(email);
}

// Main auth
mainBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const password = passInput.value.trim();

    errorMsg.innerText = "";

    if (!email || !password) {
        errorMsg.innerText = "Fill all fields";
        return;
    }

    if (!isValidEmail(email)) {
        errorMsg.innerText = "Invalid email format";
        return;
    }

    mainBtn.disabled = true;

    try {
        let userCredential;

        if (isLogin) {
            userCredential = await signInWithEmailAndPassword(auth, email, password);
        } else {
            userCredential = await createUserWithEmailAndPassword(auth, email, password);

            const user = userCredential.user;

            await set(ref(db, 'users/' + user.uid), {
                username: email.split('@')[0],
                email: email,
                createdAt: Date.now(),
                lastLogin: Date.now()
            });
        }

        // Update last login safely
        await update(ref(db, 'users/' + userCredential.user.uid), {
            lastLogin: Date.now()
        });

        alert("Welcome " + userCredential.user.email);

        // Redirect example
        // window.location.href = "vote.html";

    } catch (error) {
        errorMsg.innerText = simplifyError(error.code);
    }

    mainBtn.disabled = false;
});

// Google login
googleBtn.addEventListener('click', async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        await update(ref(db, 'users/' + user.uid), {
            username: user.displayName,
            email: user.email,
            photo: user.photoURL,
            lastLogin: Date.now()
        });

        alert("Google login success");

    } catch (error) {
        errorMsg.innerText = simplifyError(error.code);
    }
});

// Error messages
function simplifyError(code) {
    if (code.includes('wrong-password')) return "Wrong password";
    if (code.includes('user-not-found')) return "User not found";
    if (code.includes('email-already-in-use')) return "Email already exists";
    if (code.includes('weak-password')) return "Password must be 6+ chars";
    return "Something went wrong";
}

// Auth state
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Logged in:", user.email);
    }
});