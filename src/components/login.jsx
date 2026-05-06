import { useState } from "react";
import { auth, provider } from "./firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup 
} from "firebase/auth";
import { useNavigate } from "react-router-dom";

function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      return setError("Fill all fields");
    }

    if (password.length < 6) {
      return setError("Password must be at least 6 characters");
    }

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }

      navigate("/poll"); //  redirect after success

    } catch (err) {
      setError(formatError(err.code));
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithPopup(auth, provider);
      navigate("/poll");
    } catch (err) {
      setError("Google login failed");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded shadow">
      <h2 className="text-2xl mb-4 text-center">
        {isLogin ? "Login" : "Sign Up"}
      </h2>

      {error && <p className="text-red-500 mb-3">{error}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border px-3 py-2 rounded"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border px-3 py-2 rounded"
        />

        <button className="bg-blue-500 text-white py-2 rounded">
          {isLogin ? "Login" : "Sign Up"}
        </button>
      </form>

      <button
        onClick={handleGoogle}
        className="mt-3 w-full bg-red-500 text-white py-2 rounded"
      >
        Continue with Google
      </button>

      <p className="mt-4 text-center">
        {isLogin ? "No account?" : "Already have an account?"}
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-blue-500 ml-2"
        >
          {isLogin ? "Sign Up" : "Login"}
        </button>
      </p>
    </div>
  );
}

function formatError(code) {
  if (code.includes("auth/user-not-found")) return "User not found";
  if (code.includes("auth/wrong-password")) return "Wrong password";
  if (code.includes("auth/email-already-in-use")) return "Email already exists";
  return "Something went wrong";
}

export default Login;