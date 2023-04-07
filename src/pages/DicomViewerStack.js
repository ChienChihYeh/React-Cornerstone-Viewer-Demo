import React, { useEffect, useRef, useState } from "react";
import dicomParser from "dicom-parser";
import cornerstone from "cornerstone-core";
import cornerstoneWADOImageLoader from "cornerstone-wado-image-loader";
import cornerstoneMath from "cornerstone-math";
import cornerstoneTools from "cornerstone-tools";
import Hammer from "hammerjs";
import "./../styles/styles.scss";
import { ZoomTool, LengthTool } from "cornerstone-tools";

export default function DicomViewerStack(props) {
  const [loadTool, setLoadTool] = useState(null);

  const canvasRef = useRef(null);
  const element = canvasRef.current;
  const imageIds = [
    "wadouri:/dicom/0a9acd27-56abc647-fdf52ffc-05af8061-00b19e5a.dcm",
    "wadouri:/dicom/0af4de12-34c9d74e-5ea89ac4-ff484958-02b344c5.dcm",
    "wadouri:/dicom/0afe7c0e-0f5f320d-a8a33a94-9de97e9d-c2444968.dcm",
  ];

  useEffect(() => {
    cornerstoneTools.external.cornerstone = cornerstone; // set up Cornerstone Tools
    cornerstoneTools.external.cornerstoneMath = cornerstoneMath;
    cornerstoneTools.external.Hammer = Hammer;
    // Image Loader
    cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
    cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

    const element = canvasRef.current;

    // Load and cache all the images in the stack
    const imagePromises = imageIds.map((imageId) =>
      cornerstone.loadAndCacheImage(imageId)
    );

    Promise.all(imagePromises).then((images) => {
      cornerstone.enable(element); // enable the canvas with Cornerstone
      cornerstone.displayImage(element, images[0]); // display the first image in the stack on the canvas

      setLoadTool(true); // enable
    });
  }, []);

  useEffect(() => {
    cornerstoneTools.init();
    cornerstoneTools.addToolForElement(element, ZoomTool);
    cornerstoneTools.addToolForElement(element, LengthTool);
    cornerstoneTools.setToolActive("Zoom", {
      mouseButtonMask: 2,
      minScale: 1,
      maxScale: 20.0,
      preventZoomOutsideImage: true,
    }); // activate ZoomTool with left mouse button

    cornerstoneTools.setToolActive("Length", {
      mouseButtonMask: 1,
    });
  }, [loadTool]);

  return (
    <>
      <h1>Cornerstone Dicom Viewer</h1>
      <div className="viewer" ref={canvasRef}></div>
    </>
  );
}
