export default function Button({ name, action }) {
  return (
    <button
      onClick={() => {
        action();
      }}
    >
      {name}
    </button>
  );
}
