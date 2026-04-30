import PollOption from "./PollOption";

function PollList({ options, vote, hasVoted }) {
  const totalVotes = options.reduce((sum, opt) => sum + opt.votes, 0);

  if (options.length === 0) {
  return <p>No poll options available</p>;
}

  return (
    <div>
      {options.map((opt) => (
        <PollOption
          key={opt.id}
          option={opt}
          vote={vote}
          hasVoted={hasVoted}
          totalVotes={totalVotes}
        />
      ))}
    </div>
  );
}

export default PollList;