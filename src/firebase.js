import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  createUserWithEmailAndPassword,
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithRedirect,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { firebaseConfig } from "./firebaseConfig.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const mainBtn = document.getElementById("mainBtn");
const googleBtn = document.getElementById("googleBtn");
const switchLink = document.getElementById("switchLink");
const resetLink = document.getElementById("resetLink");
const title = document.getElementById("title");
const errorMsg = document.getElementById("error");
const switchMsg = document.getElementById("switchMsg");

let isLogin = true;

function redirectToDashboard() {
  window.location.href = `${import.meta.env.BASE_URL}dashboard.html`;
}

function setLoading(isLoading) {
  mainBtn.disabled = isLoading;
  googleBtn.disabled = isLoading;
}

function isValidEmail(email) {
  return /\S+@\S+\.\S+/.test(email);
}

function simplifyError(error) {
  const code = error?.code || "";

  console.error("Firebase auth error:", error);

  if (code.includes("invalid-credential")) return "Wrong email or password";
  if (code.includes("wrong-password")) return "Wrong password";
  if (code.includes("user-not-found")) return "User not found";
  if (code.includes("email-already-in-use")) return "Email already exists";
  if (code.includes("weak-password")) return "Password must be 6+ characters";
  if (code.includes("operation-not-allowed")) return "Enable this sign-in method in Firebase Auth";
  if (code.includes("unauthorized-domain")) return "Add this domain in Firebase Auth authorized domains";
  if (code.includes("network-request-failed")) return "Network error. Try again";
  if (code.includes("too-many-requests")) return "Too many attempts. Try again later";

  return `Auth failed${code ? `: ${code}` : ""}`;
}

switchLink.addEventListener("click", (event) => {
  event.preventDefault();
  isLogin = !isLogin;

  title.innerText = isLogin ? "Login" : "Sign Up";
  mainBtn.innerText = isLogin ? "Log In" : "Sign Up";
  switchMsg.innerText = isLogin
    ? "Don't have an account?"
    : "Already have an account?";
  switchLink.innerText = isLogin ? "Sign Up" : "Log In";
  errorMsg.innerText = "";
});

mainBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  errorMsg.innerText = "";

  if (!email || !password) {
    errorMsg.innerText = "Fill all fields";
    return;
  }

  if (!isValidEmail(email)) {
    errorMsg.innerText = "Invalid email format";
    return;
  }

  setLoading(true);

  try {
    const userCredential = isLogin
      ? await signInWithEmailAndPassword(auth, email, password)
      : await createUserWithEmailAndPassword(auth, email, password);

    localStorage.removeItem("hasVoted");
    localStorage.removeItem("voterCode");
    localStorage.removeItem("voterName");
    localStorage.setItem("voterName", userCredential.user.email);
    redirectToDashboard();
  } catch (error) {
    errorMsg.innerText = simplifyError(error);
  } finally {
    setLoading(false);
  }
});

googleBtn.addEventListener("click", async () => {
  errorMsg.innerText = "";
  setLoading(true);

  try {
    await signInWithRedirect(auth, provider);
  } catch (error) {
    errorMsg.innerText = simplifyError(error);
    setLoading(false);
  }
});

resetLink.addEventListener("click", async (event) => {
  event.preventDefault();
  const email = emailInput.value.trim();

  errorMsg.innerText = "";

  if (!email || !isValidEmail(email)) {
    errorMsg.innerText = "Enter your email first";
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    errorMsg.innerText = "Password reset email sent";
  } catch (error) {
    errorMsg.innerText = simplifyError(error);
  }
});

getRedirectResult(auth)
  .then((result) => {
    if (result?.user) {
      localStorage.removeItem("hasVoted");
      localStorage.removeItem("voterCode");
      localStorage.removeItem("voterName");
      localStorage.setItem("voterName", result.user.email || result.user.displayName || "Voter");
      redirectToDashboard();
    }
  })
  .catch((error) => {
    errorMsg.innerText = simplifyError(error);
  });

onAuthStateChanged(auth, (user) => {
  if (user) {
    localStorage.setItem("voterName", user.email || user.displayName || "Voter");
    redirectToDashboard();
  }
});
