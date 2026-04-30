function PollOption({ option, vote, hasVoted, totalVotes }) {
  const percent = totalVotes
    ? Math.round((option.votes / totalVotes) * 100)
    : 0;

  return (
    <div className="mb-4">

      {/* Header */}
      <div className="flex justify-between">
        <span className="font-medium">{option.text}</span>
        <span>{option.votes} votes</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 h-3 rounded my-2 overflow-hidden">
        <div
          className="bg-emerald-500 h-3 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Vote Button */}
      <button
        onClick={() => vote(option.id)}
        disabled={hasVoted}
        className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 rounded disabled:opacity-50"
      >
        Vote ({percent}%)
      </button>

      {/* Feedback */}
      {hasVoted && (
        <p className="text-xs text-gray-500 mt-1">
          You have already voted
        </p>
      )}

    </div>
  );
}

export default PollOption;