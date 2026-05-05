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
import{getRedirectResult}from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// 🔑 REPLACE WITH YOUR CONFIG
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
        const result = await signInWithRedirect(auth, provider);
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
        window.location.href = "/dashboard.html";
        window.location.href = "/dashboard.html";    
    }
});
getRedirectResult(auth).then((result) => {
    if (result) {
    console.log("redirect login success:", result.user.email);
     window.location.href = "/dashboard.html";
    }
});



