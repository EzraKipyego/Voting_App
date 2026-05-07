import { useEffect, useState } from "react";
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
  { id: 1, text: "Class Rep A (Kelvin Omondi)", votes: 0 },
  { id: 2, text: "Class Rep B (Precious Njeru)", votes: 0 },
  { id: 3, text: "Class Rep C (George Mwangi)", votes: 0 },
  { id: 4, text: "Class Rep D (Marian Adisa)", votes: 0 },
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
  const [hasVoted, setHasVoted] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [pollError, setPollError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthChecked(true);

      if (!currentUser) {
        window.location.href = `${import.meta.env.BASE_URL}login.html`;
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    ensurePollExists().catch((err) => {
      console.info("Could not create Firestore poll:", err.message);
      setPollError("Live voting is not connected yet. Check Firestore rules.");
    });

    const unsubscribe = onSnapshot(
      pollRef,
      (snapshot) => {
        if (!snapshot.exists()) return;

        const data = snapshot.data();
        const normalized = normalizeOptions(data.options);
        const voters = data.voters || {};
        const voted = Boolean(voters[user.uid]);

        setOptions(normalized);
        setHasVoted(voted);
        saveOptions(normalized);
        localStorage.setItem("hasVoted", JSON.stringify(voted));
        setPollError("");
      },
      (err) => {
        console.info("Using local poll data:", err.message);
        setPollError("Live voting is not connected yet. Check Firestore rules.");
      }
    );

    return () => unsubscribe();
  }, [user]);

  const addOption = async (text) => {
    if (!text.trim()) return;
    if (!user) {
      setPollError("You must be logged in before adding poll options.");
      return;
    }

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
        const data = snapshot.data() || {};
        const currentOptions = normalizeOptions(data.options);
        const alreadyExists = currentOptions.some(
          (opt) => opt.text.toLowerCase() === text.trim().toLowerCase()
        );

        if (alreadyExists) {
          throw new Error("duplicate-option");
        }

        transaction.set(
          pollRef,
          {
            question: data.question || "Who is your class representative?",
            options: [...currentOptions, newOption],
            voters: data.voters || {},
            updatedAt: Date.now(),
          },
          { merge: true }
        );
      });
    } catch (err) {
      if (err.message === "duplicate-option") {
        alert("This poll option already exists!");
      } else {
        setPollError("Could not save this option online. Check Firestore rules.");
      }
    }
  };

  const vote = async (id) => {
    if (hasVoted) return;
    if (!user) {
      setPollError("You must be logged in before voting.");
      return;
    }

    const previousOptions = options;
    const updated = options.map((opt) =>
      opt.id === id ? { ...opt, votes: opt.votes + 1 } : opt
    );

    setOptions(updated);
    setHasVoted(true);
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
              [user.uid]: {
                optionId: id,
                email: user.email || "",
                name: user.displayName || user.email || "Voter",
                votedAt: Date.now(),
              },
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

      setOptions(previousOptions);
      setHasVoted(false);
      localStorage.setItem("hasVoted", JSON.stringify(false));
      setPollError("Could not record your vote online. Check Firestore rules.");
    }
  };

  const resetVotes = async () => {
    if (!user) {
      setPollError("You must be logged in before resetting votes.");
      return;
    }

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
      setPollError("Could not reset online votes. Check Firestore rules.");
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem("hasVoted");
    localStorage.removeItem("voterCode");
    localStorage.removeItem("voterName");
    await signOut(auth);
    window.location.href = `${import.meta.env.BASE_URL}login.html`;
  };

  const totalVotes = options.reduce((sum, opt) => sum + opt.votes, 0);

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
          <div>
            <h1 className="text-3xl font-bold text-blue-600">
              Class Representative Voting App
            </h1>
            {user && (
              <p className="mt-1 text-sm text-gray-500">
                Signed in as {user.email || user.displayName}
              </p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Logout
          </button>
        </div>

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
