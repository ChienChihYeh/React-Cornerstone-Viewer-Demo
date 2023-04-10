import React, { useEffect, useRef, useState } from "react";
import dicomParser from "dicom-parser";
import cornerstone from "cornerstone-core";
import cornerstoneWADOImageLoader from "cornerstone-wado-image-loader";
import cornerstoneMath from "cornerstone-math";
import cornerstoneTools from "cornerstone-tools";
import Hammer from "hammerjs";
import "./../styles/styles.scss";
import { ZoomTool, LengthTool } from "cornerstone-tools";

export default function DicomViewerStackTool(props) {
  const [loadTool, setLoadTool] = useState(false);
  const [currentSliceIndex, setCurrentSliceIndex] = useState(0);
  const [imageIds, setImageIds] = useState([
    "wadouri:/dicom/0a9acd27-56abc647-fdf52ffc-05af8061-00b19e5a.dcm",
    "wadouri:/dicom/0af4de12-34c9d74e-5ea89ac4-ff484958-02b344c5.dcm",
    "wadouri:/dicom/0afe7c0e-0f5f320d-a8a33a94-9de97e9d-c2444968.dcm",
  ]);
  const [currentCoord, setCurrentCoord] = useState({
    x: 0,
    y: 0,
  });

  const stack = {
    currentImageIdIndex: 0,
    imageIds: imageIds,
  };

  const canvasRef = useRef(null);
  const element = canvasRef.current;
  //   const imageId = imageIds[currentImageIndex];

  useEffect(() => {
    cornerstoneTools.external.cornerstone = cornerstone;
    cornerstoneTools.external.cornerstoneMath = cornerstoneMath;
    cornerstoneTools.external.Hammer = Hammer;

    cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
    cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

    const element = canvasRef.current;

    cornerstone.loadAndCacheImage(imageIds[0]).then((image) => {
      cornerstone.displayImage(element, image);

      window.addEventListener("mouseup", (e) => {
        let viewport = cornerstone.getViewport(element);
        // console.log(viewport.scale);
        if (viewport.scale <= 0.7) {
          cornerstone.setViewport(element, {
            scale: 0.7,
            translation: {
              x: 0,
              y: 0,
            },
          });
        }
      });

      setLoadTool(true);
    });
  }, [imageIds]);

  useEffect(() => {
    const element = canvasRef.current;
    cornerstone.enable(element);

    cornerstoneTools.init();
    cornerstoneTools.addToolForElement(element, ZoomTool, {
      configuration: {
        invert: true,
        preventZoomOutsideImage: false,
        minScale: 0.7,
        maxScale: 20.0,
      },
    });
    cornerstoneTools.addToolForElement(element, LengthTool, {
      configuration: {
        drawHandlesOnHover: true,
        deleteIfHandleOutsideImage: true,
        preventContextMenu: true,
      },
    });

    cornerstoneTools.setToolActive("Zoom", {
      mouseButtonMask: 2,
    });

    const WwwcTool = cornerstoneTools.WwwcTool;
    cornerstoneTools.addTool(WwwcTool);
    cornerstoneTools.setToolActive("Wwwc", { mouseButtonMask: 4 });

    cornerstoneTools.addStackStateManager(element, ["stack"]);
    cornerstoneTools.addToolState(element, "stack", stack);

    // const StackScrollMouseWheelTool =
    //   cornerstoneTools.StackScrollMouseWheelTool;
    // cornerstoneTools.addTool(StackScrollMouseWheelTool);
    // cornerstoneTools.setToolActive("StackScrollMouseWheel", {
    //   mouseButtonMask: 0x1,
    // });

    cornerstoneTools.setToolActive("Length", {
      mouseButtonMask: 1,
    });

    // Add event listener for left-click
    element.addEventListener("cornerstonetoolsmousedrag", handleMouseDrag);

    return () => {
      element.removeEventListener("cornerstonetoolsmousedrag", handleMouseDrag);
    };
  }, [loadTool]);

  // Event handler for mouse up event
  const handleMouseDrag = (e) => {
    // console.log(e.detail.buttons);
    const coords = cornerstone.pageToPixel(
      element,
      e.detail.currentPoints.page.x,
      e.detail.currentPoints.page.y
    );
    if (e.detail.buttons === 1) {
      setCurrentCoord({
        x: coords.x.toFixed(2),
        y: coords.y.toFixed(2),
      });
    }
  };

  const handleScroll = (e) => {
    if (e.deltaY > 0 && currentSliceIndex < imageIds.length - 1) {
      setCurrentSliceIndex(currentSliceIndex + 1);
    } else if (e.deltaY < 0 && currentSliceIndex > 0) {
      setCurrentSliceIndex(currentSliceIndex - 1);
    }
  };

  useEffect(() => {
    const element = canvasRef.current;
    element.addEventListener("wheel", handleScroll);

    cornerstone.loadAndCacheImage(imageIds[currentSliceIndex]).then((image) => {
      console.log("current slice: ", currentSliceIndex);
      cornerstone.displayImage(element, image);
    });

    return () => {
      element.removeEventListener("wheel", handleScroll);
    };
  }, [currentSliceIndex]);

  return (
    <>
      <h1>Cornerstone Dicom Viewer</h1>
      <div
        ref={canvasRef}
        className="viewer"
        onContextMenu={(e) => {
          e.preventDefault();
          return false;
        }}
      />
      <div className="dicom-info">
        <p>Image Index: {currentSliceIndex}</p>
        <p>Image ID: {imageIds[currentSliceIndex]}</p>
        <p>
          Coord During Dragging: &#40; {currentCoord.x} , {currentCoord.y} &#41;
        </p>
      </div>
    </>
  );
}
