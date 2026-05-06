import { useState, useEffect } from "react";
import PollForm from "./components/PollForm";
import PollList from "./components/PollList";
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import {
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  runTransaction,
  setDoc,
} from "firebase/firestore";
import { firebaseConfig } from "./firebaseConfig";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const pollRef = doc(db, "polls", "class-representative");
const defaultOptions = [
  { id: 1, text: "Class Representative A", votes: 0 },
  { id: 2, text: "Class Representative B", votes: 0 },
  { id: 3, text: "Class Representative C", votes: 0 },
];

function normalizeOptions(options) {
  if (!Array.isArray(options)) return defaultOptions;

  return options.map((opt, index) => ({
    id: opt.id ?? index + 1,
    text: opt.text ?? opt.option ?? `Option ${index + 1}`,
    votes: Number(opt.votes) || 0,
  }));
}

function saveOptions(options) {
  localStorage.setItem("pollOptions", JSON.stringify(options));
}

async function ensurePollExists() {
  const snapshot = await getDoc(pollRef);

  if (!snapshot.exists()) {
    await setDoc(pollRef, {
      question: "Who is your class representative?",
      options: defaultOptions,
      voters: {},
      updatedAt: Date.now(),
    });
  }
}

function App() {
  const [options, setOptions] = useState(() => {
    const saved = localStorage.getItem("pollOptions");
    return saved ? normalizeOptions(JSON.parse(saved)) : defaultOptions;
  });

  const [hasVoted, setHasVoted] = useState(() => {
    return JSON.parse(localStorage.getItem("hasVoted")) || false;
  });

  const [voteHistory, setVoteHistory] = useState(0);
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [pollError, setPollError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthChecked(true);
      if (!currentUser) {
        window.location.href = import.meta.env.BASE_URL;
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    ensurePollExists().catch((err) => {
      console.info("Could not create Firestore poll:", err.message);
      setPollError("Live voting is not connected yet. Enable Firestore for shared votes.");
    });

    const unsubscribe = onSnapshot(
      pollRef,
      (snapshot) => {
        if (!snapshot.exists()) return;

        const data = snapshot.data();
        const normalized = normalizeOptions(data.options);
        const voters = data.voters || {};

        setOptions(normalized);
        setHasVoted(Boolean(voters[user.uid]));
        saveOptions(normalized);
        localStorage.setItem("hasVoted", JSON.stringify(Boolean(voters[user.uid])));
        setPollError("");
      },
      (err) => {
        console.info("Using local poll data:", err.message);
        setPollError("Live voting is not connected yet. Enable Firestore for shared votes.");
      }
    );

    return () => unsubscribe();
  }, [user]);
  

  const addOption = async (text) => {
    if (!text.trim()) return;

    // Prevent duplicate poll options (case-insensitive)
    const exists = options.some(
      (opt) => opt.text.toLowerCase() === text.trim().toLowerCase()
    );

    if (exists) {
      alert("This poll option already exists!");
      return;
    }

    const newOption = {
      id: Date.now(),
      text: text.trim(),
      votes: 0,
    };

    
    const updated = [...options, newOption];
    setOptions(updated);
    saveOptions(updated);

    try {
      await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(pollRef);
        const currentOptions = normalizeOptions(snapshot.data()?.options);
        const alreadyExists = currentOptions.some(
          (opt) => opt.text.toLowerCase() === text.trim().toLowerCase()
        );

        if (alreadyExists) {
          throw new Error("duplicate-option");
        }

        transaction.set(
          pollRef,
          {
            question: snapshot.data()?.question || "Who is your class representative?",
            options: [...currentOptions, newOption],
            voters: snapshot.data()?.voters || {},
            updatedAt: Date.now(),
          },
          { merge: true }
        );
      });
    } catch (err) {
      if (err.message === "duplicate-option") {
        alert("This poll option already exists!");
      } else {
        setPollError("Could not save this option online. Check Firestore setup.");
      }
    }
  };

  const vote = async (id) => {
    if (hasVoted) return;

    const updated = options.map((opt) => {
      if (opt.id === id) {
        return { ...opt, votes: opt.votes + 1 };
      }
      return opt;
    });

    setOptions(updated);
    setHasVoted(true);
    setVoteHistory(voteHistory + 1);
    saveOptions(updated);
    localStorage.setItem("hasVoted", JSON.stringify(true));

    try {
      await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(pollRef);
        const data = snapshot.data() || {};
        const voters = data.voters || {};

        if (voters[user.uid]) {
          throw new Error("already-voted");
        }

        const nextOptions = normalizeOptions(data.options).map((opt) =>
          opt.id === id ? { ...opt, votes: opt.votes + 1 } : opt
        );

        transaction.set(
          pollRef,
          {
            question: data.question || "Who is your class representative?",
            options: nextOptions,
            voters: {
              ...voters,
              [user.uid]: id,
            },
            updatedAt: Date.now(),
          },
          { merge: true }
        );
      });
    } catch (err) {
      if (err.message === "already-voted") {
        setHasVoted(true);
        return;
      }

      setOptions(options);
      setHasVoted(false);
      localStorage.setItem("hasVoted", JSON.stringify(false));
      setPollError("Could not record your vote online. Check Firestore setup.");
    }
  };

  const resetVotes = async () => {
    const reset = options.map((opt) => ({
      ...opt,
      votes: 0,
    }));

    setOptions(reset);
    setHasVoted(false);
    saveOptions(reset);
    localStorage.setItem("hasVoted", JSON.stringify(false));

    try {
      await setDoc(
        pollRef,
        {
          question: "Who is your class representative?",
          options: reset,
          voters: {},
          updatedAt: Date.now(),
        },
        { merge: true }
      );
    } catch {
      setPollError("Could not reset online votes. Check Firestore setup.");
    }
  };

  const totalVotes = options.reduce((sum, opt) => sum + opt.votes, 0);

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = import.meta.env.BASE_URL;
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-gray-700">Checking login status...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center items-center p-4">
      <div className="w-full max-w-xl bg-white shadow-lg rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-blue-600">Class Representative Voting App</h1>
          <button
            onClick={handleLogout}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Logout
          </button>
        </div>

        {/* Track votes */}
        <p className="text-center text-gray-600 mb-6">
          Total Votes Ever Cast: {voteHistory}
        </p>
        {pollError && (
          <p className="mb-4 rounded bg-amber-100 px-3 py-2 text-sm text-amber-800">
            {pollError}
          </p>
        )}
        <PollForm addOption={addOption} />
        <PollList
          options={options}
          vote={vote}
          hasVoted={hasVoted}
          totalVotes={totalVotes}
        />
        <button
          onClick={resetVotes}
          className="w-full mt-6 bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        >
          Reset Votes
        </button>
      </div>
    </div>
  );
}

export default App;
