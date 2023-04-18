import React, { useEffect, useRef } from "react";

const NoduleCanvasArr = ({
  displayArray,
  imageSize,
  scale,
  viewX,
  viewY,
  currentId,
}) => {
  const noduleRef = useRef(null);

  useEffect(() => {
    const canvas = noduleRef.current;
    const ctx = canvas.getContext("2d");

    // console.log(displayArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    displayArray.forEach((v, i) => {
      //   console.log("drawing cirle", i);
      console.log("x:" + v.x, "y:" + v.y, "radius:" + v.radius);
      let drawX = imageSize / 2 + (viewX + v.x - imageSize / 2) * scale;
      let drawY = imageSize / 2 + (viewY + v.y - imageSize / 2) * scale;
      let drawRadius = (v.radius * 3 + 10) * scale;

      //   console.log(drawX, drawY, drawRadius);
      ctx.beginPath();
      ctx.arc(drawX, drawY, drawRadius, 0, 2 * Math.PI, false);
      ctx.strokeStyle = "rgb(0,255,0)"; // Set the stroke color to red
      ctx.lineWidth = 2; // Set the stroke width to 1px
      ctx.stroke(); // Draw the circle stroke
      ctx.closePath();
    });

    return () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [displayArray, imageSize, scale, viewX, viewY]);

  return (
    <canvas
      style={{ position: "absolute" }}
      ref={noduleRef}
      width={imageSize}
      height={imageSize}
    ></canvas>
  );
};

export default NoduleCanvasArr;
