import { useState } from "react";

export default function CoordRange() {
  const [coordinates, setCoordinates] = useState({ x: 0, y: 0 });

  function handleMouseMove(event) {
    const x = Math.min(Math.max(event.clientX, 0), 512);
    const y = Math.min(Math.max(event.clientY, 0), 512);
    setCoordinates({ x, y });
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      style={{ width: "100%", height: "100vh" }}
    >
      <p>X: {coordinates.x}</p>
      <p>Y: {coordinates.y}</p>
    </div>
  );
}
