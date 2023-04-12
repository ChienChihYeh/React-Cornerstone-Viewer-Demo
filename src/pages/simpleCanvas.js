import React, { useRef, useEffect, useState } from "react";

const Canvas = () => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mousePosition, setMousePosition] = useState({ mouseX: 0, mouseY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    const drawCross = (x, y) => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, canvas.height);
      context.moveTo(0, y);
      context.lineTo(canvas.width, y);
      context.strokeStyle = "red";
      context.stroke();
    };

    const handleMouseDown = (event) => {
      setIsDrawing(true);
    };

    const handleMouseMove = (event) => {
      if (!isDrawing) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      setMousePosition({ mouseX, mouseY });
      drawCross(mouseX, mouseY);
    };

    const handleMouseUp = (event) => {
      setIsDrawing(false);
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDrawing]);

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        style={{ border: "1px solid black" }}
      />
      <p>
        MouseX: {mousePosition.mouseX}, MouseY: {mousePosition.mouseY}
      </p>
    </div>
  );
};

export default Canvas;
