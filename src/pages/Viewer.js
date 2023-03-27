import React, { useEffect, useRef } from "react";
import cornerstone from "cornerstone-core";
import cornerstoneMath from "cornerstone-math";
import cornerstoneWebImageLoader from "cornerstone-web-image-loader";
import cornerstoneTools from "cornerstone-tools";
import Hammer from "hammerjs/hammer.js";
import "./../styles/styles.scss";
import { ZoomTool, LengthTool } from "cornerstone-tools";

export default function Viewer(props) {
  const canvasRef = useRef(null);
  const imageId =
    "https://rawgit.com/cornerstonejs/cornerstoneWebImageLoader/master/examples/Renal_Cell_Carcinoma.jpg";

  useEffect(() => {
    cornerstoneTools.external.cornerstone = cornerstone; // set up Cornerstone Tools
    cornerstoneTools.external.cornerstoneMath = cornerstoneMath;
    cornerstoneWebImageLoader.external.cornerstone = cornerstone; // set up Cornerstone Web Image Loader
    cornerstoneTools.external.Hammer = Hammer;

    const element = canvasRef.current;

    cornerstone.loadImage(imageId).then((image) => {
      cornerstone.enable(element); // enable the canvas with Cornerstone

      cornerstone.displayImage(element, image); // display the image on the canvas

      cornerstoneTools.init();
      cornerstoneTools.addTool(ZoomTool);
      cornerstoneTools.addTool(LengthTool);
      cornerstoneTools.setToolActive("Zoom", {
        mouseButtonMask: 2,
        minScale: 0.25,
        maxScale: 20.0,
        preventZoomOutsideImage: true,
      }); // activate ZoomTool with left mouse button

      cornerstoneTools.setToolActive("Length", {
        mouseButtonMask: 1,
      });
    });
  }, []);

  return (
    <>
      <h1>Cornerstone Viewer Test</h1>
      <div className="viewer" ref={canvasRef}></div>
    </>
  );
}
