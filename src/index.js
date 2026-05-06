{
  "rules";{ 
    "users"; {
      "$uid"; {
        ".read"; "$uid === auth.uid",
        ".write"; "$uid === auth.uid"
      }
    };
    "public_data"; {
      ".read"; true,
      ".write"; false
    }
  }
}

async function saveUserToDB(user, extraData = {}) {
    try {
        await set(ref(db, 'users/' + user.uid), {
            username: user.displayName || user.email.split('@')[0],
            email: user.email,
            photo: user.photoURL || null,
            lastLogin: Date.now(),
            ...extraData
        });
    } catch (error) {
        console.error("DB Error:", error);
        throw error;
    }
}

if (isLogin) {
    userCredential = await signInWithEmailAndPassword(auth, email, password);
} else {
    userCredential = await createUserWithEmailAndPassword(auth, email, password);

    const user = userCredential.user;

    await set(ref(db, 'users/' + user.uid), {
        username: email.split('@')[0],
        email: email,
        lastLogin: Date.now()
    });
}

//  Redirect here
window.location.href = "pollform.html";
export default index.js;

onAuthStateChanged(auth, (user) => {
    if (user) {
        window.location.href = "pollform.html";
    }
});

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Login successful");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <form
        onSubmit={handleLogin}
        className="bg-gray-800 p-8 rounded-2xl shadow-lg w-96"
      >
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Login
        </h2>

        {error && (
          <p className="text-red-400 text-sm mb-4">{error}</p>
        )}

        <input
          type="email"
          placeholder="Email"
          className="w-full mb-4 p-3 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-6 p-3 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 transition p-3 rounded-lg text-white font-semibold"
        >
          Login
        </button>
      </form>
    </div>
  );
}