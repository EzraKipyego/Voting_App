import { useState, useEffect } from "react";
import PollForm from "./components/PollForm";
import PollList from "./components/PollList";
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { firebaseConfig } from "./firebaseConfig";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

function App() {
  const [options, setOptions] = useState(() => {
    const saved = localStorage.getItem("pollOptions");
    return saved
      ? JSON.parse(saved)
      : [
          { id: 1, text: "Class Representative A", votes: 0 },
          { id: 2, text: "Class Representative B", votes: 0 },
          { id: 3, text: "Class Representative C", votes: 0 },
        ];
  });

  const [hasVoted, setHasVoted] = useState(() => {
    return JSON.parse(localStorage.getItem("hasVoted")) || false;
  });

  const [voteHistory, setVoteHistory] = useState(0);
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);

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
    fetch("http://localhost:3000/polls/1")
      .then((res) => res.json())
      .then((data) => setOptions(data.options))
      .catch((err) => console.error("Error fetching polls:", err));
  }, [user]);
  

  const addOption = (text) => {
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

    // Update JSON server
    fetch("http://localhost:3000/polls/1", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ options: updated }),
    }).catch((err) => console.error("Error updating polls:", err));
  };

  const vote = (id) => {
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

    // Update JSON server with new votes
    fetch("http://localhost:3000/polls/1", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ options: updated }),
    }).catch((err) => console.error("Error updating votes:", err));

    // Record vote in votes table
    fetch("http://localhost:3000/votes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pollId: 1, choiceId: id }),
    }).catch((err) => console.error("Error recording vote:", err));
  };

  const resetVotes = () => {
    const reset = options.map((opt) => ({
      ...opt,
      votes: 0,
    }));

    setOptions(reset);
    setHasVoted(false);

    fetch("http://localhost:3000/polls/1", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ options: reset }),
    }).catch((err) => console.error("Error resetting votes:", err));
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