import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signInWithPopup, 
    GoogleAuthProvider,
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// 🔑 REPLACE WITH YOUR CONFIG
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "https://ezrakipyego.github.io/Voting_App/.firebaseapp.com",
    databaseURL: "https://https://ezrakipyego.github.io/Voting_App/-default-rtdb.firebaseio.com", // Required for Realtime DB
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app); // Initialize Realtime Database
const provider = new GoogleAuthProvider();

// DOM Elements
const emailInput = document.getElementById('email');
const passInput = document.getElementById('password');
const mainBtn = document.getElementById('mainBtn');
const googleBtn = document.getElementById('googleBtn');
const switchLink = document.getElementById('switchLink');
const title = document.getElementById('title');
const errorMsg = document.getElementById('error');
const switchMsg = document.getElementById('switchMsg');

let isLogin = true; // State toggle

// 1. Toggle between Login and Signup
switchLink.addEventListener('click', (e) => {
    e.preventDefault();
    isLogin = !isLogin;
    title.innerText = isLogin ? "Login" : "Sign Up";
    mainBtn.innerText = isLogin ? "Log In" : "Sign Up";
    switchMsg.innerText = isLogin ? "Don't have an account?" : "Already have an account?";
    switchLink.innerText = isLogin ? "Sign Up" : "Log In";
    errorMsg.innerText = "";
});

// 2. Main Button Handler (Email/Pass)
mainBtn.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passInput.value;
    errorMsg.innerText = "";

    if (!email || !password) {
        errorMsg.innerText = "Please fill in all fields";
        return;
    }

    try {
        let userCredential;
        if (isLogin) {
            // LOGIN
            userCredential = await signInWithEmailAndPassword(auth, email, password);
        } else {
            // SIGN UP
            userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // SAVE TO REALTIME DATABASE
            const user = userCredential.user;
            await set(ref(db, 'users/' + user.uid), {
                username: email.split('@')[0],
                email: email,
                lastLogin: Date.now()
            });
        }
        alert("Success! Welcome " + userCredential.user.email);
        // window.location.href = "/dashboard.html"; 

    } catch (error) {
        errorMsg.innerText = simplifyError(error.code);
    }
});

// 3. Google Sign In
googleBtn.addEventListener('click', async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        //  SAVE/UPDATE USER IN REALTIME DB ON GOOGLE LOGIN
        await set(ref(db, 'users/' + user.uid), {
            username: user.displayName,
            email: user.email,
            photo: user.photoURL,
            lastLogin: Date.now()
        });

        alert("Google Login Success!");
    } catch (error) {
        errorMsg.innerText = simplifyError(error.code);
    }
});

// Helper: Clean Error Messages
function simplifyError(code) {
    if (code.includes('wrong-password')) return "Wrong password.";
    if (code.includes('user-not-found')) return "No user found with this email.";
    if (code.includes('email-already-in-use')) return "Email already registered.";
    if (code.includes('weak-password')) return "Password must be at least 6 chars.";
    return "An error occurred. Try again.";
}

// 4. Check if user is already logged in
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User is logged in:", user.email);
        // Optional: Auto-redirect if already logged in
        // window.location.href = "/dashboard.html";
    }
});


