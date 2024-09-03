// Define the Block component
const Block = ({ letter, state, isFilled, isRevealed }) => {
  const filled = isFilled ? " filled" : "";
  const revealed = isRevealed ? " revealed" : "";
  return (
    <div className={`block${filled}${revealed}`}>
      <div className="front">{letter}</div>
      <div className={`back ${state}`}>{letter}</div>
    </div>
  );
};

export default Block;
