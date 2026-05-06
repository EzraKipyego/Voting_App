import { useState } from "react";

function PollForm({ addOption }) {
  const [text, setText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!text.trim()) return;

    addOption(text);
    setText("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-6">

      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter poll option..."
        className="flex-1 border border-gray-300 rounded px-3 py-2"
      />

      <button
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 rounded"
      >
        Add
      </button>

    </form>
  );
}

export default PollForm;
