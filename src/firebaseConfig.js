import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB0gSeO4_6bJQRsPcJZ7VN5an0HPt-yZLQ",
  authDomain: "vote-app-33046.firebaseapp.com",
  projectId: "vote-app-33046",
  storageBucket: "vote-app-33046.firebasestorage.app",
  messagingSenderId: "1013925105423",
  appId: "1:1013925105423:web:64925a13d297186e89787a",
  measurementId: "G-7311HM8ZP5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize specific services
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth, firebaseConfig };
