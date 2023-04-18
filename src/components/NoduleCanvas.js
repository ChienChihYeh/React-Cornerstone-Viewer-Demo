import React, { useEffect, useRef } from 'react';

const CircleCanvas = ({ x, y, radius, imageSize, scale, viewX, viewY}) => {
  const noduleRef = useRef(null);

  useEffect(() => {
    const canvas = noduleRef.current;
    const ctx = canvas.getContext('2d');
 
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.arc(imageSize / 2 + (viewX + x) * scale, imageSize / 2 + (viewY + y) * scale, radius * scale, 0, 2 * Math.PI, false);
    ctx.strokeStyle = 'rgb(0,255,0)'; // Set the stroke color to red
    ctx.lineWidth = 2; // Set the stroke width to 1px
    ctx.stroke(); // Draw the circle stroke
    ctx.closePath();
  }, [x, y, radius, imageSize, scale, viewX, viewY]);

  return (
    <canvas
      style={{position: 'absolute'}}
      ref={noduleRef}
      width={imageSize}
      height={imageSize}
    ></canvas>
  );
};

export default CircleCanvas;
