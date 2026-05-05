import { useState, useEffect } from "react";
import PollForm from "./components/PollForm";
import PollList from "./components/PollList";

function App() {
  const [options, setOptions] = useState(() => {
    const saved = localStorage.getItem("pollOptions");
    return saved
      ? JSON.parse(saved)
      : [
          { id: 1, text: "Class Representative A (Kelvin Omondi)", votes: 0 },
          { id: 2, text: "Class Representative B (Precious Njeru)", votes: 0 },
          { id: 3, text: "Class Representative C(George Mwangi)", votes: 0 },
        ];
  });

  const [hasVoted, setHasVoted] = useState(() => {
    return JSON.parse(localStorage.getItem("hasVoted")) || false;
  });

  // Tracks all the  votes 
  const [voteHistory, setVoteHistory] = useState(() => {
    return JSON.parse(localStorage.getItem("voteHistory")) || 0;
  });

  useEffect(() => {
    localStorage.setItem("pollOptions", JSON.stringify(options));
    localStorage.setItem("hasVoted", JSON.stringify(hasVoted));
    localStorage.setItem("voteHistory", JSON.stringify(voteHistory));
  }, [options, hasVoted, voteHistory]);

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

    setOptions([...options, newOption]);
  };

  const vote = (id) => {
    if (hasVoted) return;

    const updated = options.map((opt) =>
      opt.id === id ? { ...opt, votes: opt.votes + 1 } : opt
    );

    setOptions(updated);
    setHasVoted(true);

  
    setVoteHistory(voteHistory + 1);
  };

  const resetVotes = () => {
    const reset = options.map((opt) => ({
      ...opt,
      votes: 0,
    }));

    setOptions(reset);
    setHasVoted(false);
    localStorage.removeItem("hasVoted");
  };

  const totalVotes = options.reduce((sum, opt) => sum + opt.votes, 0);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
      <h1 className="text-2xl font-bold mb-4">Group 6</h1>

      <div className="w-full max-w-xl bg-white shadow-lg rounded-xl p-6">
        <h1 className="text-3xl font-bold text-center text-blue-600 mb-2">
          Class Representative Voting App
        </h1>

        {/* Historical Vote Tracking */}
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