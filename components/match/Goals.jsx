export default ({ match }) => {
  if (!match.goals || match.goals.length === 0) {
    return null;
  }

  return (
    <div className="match__goals">
      <h2>Goals</h2>
      <p>
        {match.goals.map(goal => (
          <span key={`${goal.name}-${goal.code}-${goal.min}`}>
            {goal.name} {goal.min}&apos;&nbsp;
            {goal.code !== "G" && `[${goal.code}] `}(
            <strong>
              {goal.score[0]}:{goal.score[1]}
            </strong>
            )
          </span>
        ))}
      </p>
    </div>
  );
};
