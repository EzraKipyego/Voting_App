import { useState, useEffect, lazy, Suspense } from "react";
const PollForm = lazy(() => import ("./components/PollForm"))
const PollList = lazy(() => import ("./components/PollList"))

function App() {
  const [options, setOptions] = useState([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [voteHistory, setVoteHistory] = useState(0);

  


  useEffect(() => {
    fetch("http://localhost:3000/polls/1")
      .then((res) => res.json())
      .then((data) => 
        setOptions(data.options));
      }, []);

  }
  

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
  };

  fetch("http://localhost:3000/polls/1", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ options:updated }),
  });

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
  }

  fetch("http://localhost:3000/polls/1", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ options:updated }),
  });

  fetch("http://localhost:3000/votes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ pollId: 1, choiceId: id }),
  });


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
      body: JSON.stringify({ options:reset }),
    });
  };

  const totalVotes = options.reduce((sum, opt) => sum + opt.votes, 0);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
      <h1 className="text-2xl font-bold mb-4">Group 6</h1>

      <div className="w-full max-w-xl bg-white shadow-lg rounded-xl p-6">
        <h1 className="text-3xl font-bold text-center text-blue-600 mb-2">
          Class Representative Voting App
        </h1>

        {/* Track votes */}
        <p className="text-center text-gray-600 mb-6">
          Total Votes Ever Cast: {voteHistory}
        </p>
        <PollForm addOption={addOption} />
        <Suspense fallback={<p>Loading..</p>}> {/*Added Suspense for Lazy Loading*/}
        

        <PollList
          options={options}
          vote={vote}
          hasVoted={hasVoted}
          totalVotes={totalVotes}
        />
        </Suspense>
        <button
          onClick={resetVotes}
          className="w-full mt-6 bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        >
          Reset Votes
        </button>
      </div>
    </div>
  );

export default App;