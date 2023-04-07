import React, { useEffect, useRef, useState } from "react";
import dicomParser from "dicom-parser";
import cornerstone from "cornerstone-core";
import cornerstoneWADOImageLoader from "cornerstone-wado-image-loader";
import cornerstoneMath from "cornerstone-math";
import cornerstoneTools from "cornerstone-tools";
import Hammer from "hammerjs";
import "./../styles/styles.scss";
import { ZoomTool, LengthTool } from "cornerstone-tools";

export default function DicomViewerScroll(props) {
  const [loadTool, setLoadTool] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageIds, setImageIds] = useState([
    "wadouri:/dicom/0a9acd27-56abc647-fdf52ffc-05af8061-00b19e5a.dcm",
    "wadouri:/dicom/0af4de12-34c9d74e-5ea89ac4-ff484958-02b344c5.dcm",
    "wadouri:/dicom/0afe7c0e-0f5f320d-a8a33a94-9de97e9d-c2444968.dcm",
  ]);

  const canvasRef = useRef(null);
  const element = canvasRef.current;
  const imageId = imageIds[currentImageIndex];

  useEffect(() => {
    cornerstoneTools.external.cornerstone = cornerstone;
    cornerstoneTools.external.cornerstoneMath = cornerstoneMath;
    cornerstoneTools.external.Hammer = Hammer;

    cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
    cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

    const element = canvasRef.current;

    cornerstone.loadAndCacheImage(imageId).then((image) => {
      cornerstone.enable(element);
      cornerstone.displayImage(element, image);

      setLoadTool(true);
    });
  }, [imageId]);

  useEffect(() => {
    cornerstoneTools.init();
    cornerstoneTools.addToolForElement(element, ZoomTool);
    cornerstoneTools.addToolForElement(element, LengthTool);
    cornerstoneTools.setToolActive("Zoom", {
      mouseButtonMask: 2,
      minScale: 1.0,
      maxScale: 20.0,
      preventZoomOutsideImage: true,
    });

    cornerstoneTools.setToolActive("Length", {
      mouseButtonMask: 1,
    });
  }, [imageId, loadTool]);

  const handleScroll = (e) => {
    if (e.deltaY > 0 && currentImageIndex < imageIds.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    } else if (e.deltaY < 0 && currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  // const handleMouseDown = (e) => {
  //   if (e.button === 2) {
  //     const element = canvasRef.current;
  //     element.addEventListener("mousemove", handleMouseMove);
  //   }
  // };

  // const handleMouseMove = (e) => {
  //   const zoomToolState = cornerstoneTools.getToolState(element, "Zoom");
  //   console.log(zoomToolState);
  //   if (zoomToolState && zoomToolState.data.length > 0) {
  //     const zoomScale = zoomToolState.data[0].scale;
  //     console.log("Current Zoom Scale:", zoomScale);
  //   }
  // };

  // useEffect(() => {
  //   const element = canvasRef.current;
  //   element.addEventListener("wheel", handleScroll);
  //   element.addEventListener("mousedown", handleMouseDown);

  //   return () => {
  //     element.removeEventListener("wheel", handleScroll);
  //     element.removeEventListener("mousedown", handleMouseDown);
  //   };
  // }, [currentImageIndex]);

  return (
    <>
      <h1>Cornerstone Dicom Viewer</h1>
      <div ref={canvasRef} className="viewer" />
      <div className="dicom-info">
        <p>Image Index: {currentImageIndex}</p>
        <p>Image ID: {imageIds[currentImageIndex]}</p>
      </div>
    </>
  );
}
