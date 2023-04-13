import React, { useEffect, useRef, useState } from "react";
import dicomParser from "dicom-parser";
import cornerstone from "cornerstone-core";
import cornerstoneWADOImageLoader from "cornerstone-wado-image-loader";
import cornerstoneMath from "cornerstone-math";
import cornerstoneTools from "cornerstone-tools";
import Hammer from "hammerjs";
import "./../styles/styles.scss";
import { ZoomTool, LengthTool } from "cornerstone-tools";
import { Link } from "react-router-dom";

export default function DicomViewerStackTool(props) {
  const [isRuler, setIsRuler] = useState(false);
  const [showCross, setShowCross] = useState(false);
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
  const [currentImgCoord, setCurrentImgCoord] = useState({
    x: 0,
    y: 0,
  });
  const [currentViewport, setCurrentViewport] = useState({
    scale: 1,
    x: 0,
    y: 0,
  });

  const imageSize = 512;
  const crossSpace = 20;

  const canvasRef = useRef(null);

  useEffect(() => {
    //initialize cornerstone
    cornerstoneTools.external.cornerstone = cornerstone;
    cornerstoneTools.external.cornerstoneMath = cornerstoneMath;
    cornerstoneTools.external.Hammer = Hammer;

    //initialize dicom image loader/parser
    cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
    cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

    const element = canvasRef.current;

    const handleMouseMoveEvent = (e) => {
      let viewport = cornerstone.getViewport(element);
      let imagePoint = cornerstone.pageToPixel(element, e.pageX, e.pageY);

      let rect = element.getBoundingClientRect();

      let x = e.pageX - rect.left;
      let y = e.pageY - rect.top;

      setCurrentViewport({
        scale: viewport.scale,
        x: viewport.translation.x,
        y: viewport.translation.y,
      });

      setCurrentCoord({
        x: x.toFixed(2),
        y: y.toFixed(2),
      });

      setCurrentImgCoord({
        x: imagePoint.x.toFixed(2),
        y: imagePoint.y.toFixed(2),
      });
    };

    const swtichOffCross = function (e) {
      setShowCross(false);
      let viewport = cornerstone.getViewport(element);
      // console.log(viewport.scale);
      if (viewport.scale <= 1) {
        cornerstone.setViewport(element, {
          scale: 1,
          translation: {
            x: 0,
            y: 0,
          },
        });
      }
    };

    //intial image loading
    cornerstone.loadAndCacheImage(imageIds[0]).then((image) => {
      cornerstone.displayImage(element, image);

      if (imageIds.length > 0) {
        window.addEventListener("mouseup", swtichOffCross);
        console.log("mouseup added");

        element.addEventListener("mousemove", handleMouseMoveEvent);
        console.log("mousemove added");

        //load cornerstone tools after intial image loading, else they will not mount properly
        setLoadTool(true);
      }
    });

    return () => {
      if (imageIds.length > 0) {
        element.removeEventListener("mousemove", handleMouseMoveEvent);
        window.removeEventListener("mouseup", swtichOffCross);
        console.log("mousemove removed");
        console.log("mouseup removed");
      }
    };
  }, [imageIds]);

  useEffect(() => {
    const element = canvasRef.current;
    cornerstone.enable(element);
    cornerstoneTools.init();

    cornerstoneTools.addToolForElement(element, ZoomTool, {
      configuration: {
        invert: true,
        preventZoomOutsideImage: false,
        minScale: 1,
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
    cornerstoneTools.toolColors.setActiveColor("rgb(0, 255, 0)");
    cornerstoneTools.toolColors.setToolColor("rgb(255, 255, 0)");

    //tools have to be set active
    cornerstoneTools.setToolActive("Zoom", {
      mouseButtonMask: 2,
    });

    const WwwcTool = cornerstoneTools.WwwcTool;
    cornerstoneTools.addTool(WwwcTool);
    cornerstoneTools.setToolActive("Wwwc", { mouseButtonMask: 4 });

    const stack = {
      currentImageIdIndex: 0,
      imageIds: imageIds,
    };

    const removeMeasurements = (e) => {
      // Get the tool state for the "length" tool
      const toolState = cornerstoneTools.getToolState(element, "Length");

      if (toolState && toolState.data) {
        // Get the currently selected measurement
        toolState.data.forEach((v, i) => {
          if (v.active === true && e.which === 3) {
            // console.log(i);
            toolState.data.splice(i, 1);
            cornerstone.updateImage(element);
          }
        });
      }
    };

    if (loadTool) {
      cornerstoneTools.addStackStateManager(element, ["stack"]);
      cornerstoneTools.addToolState(element, "stack", stack);

      // stack scroll using built-in cornerstone tool
      // const StackScrollMouseWheelTool =
      //   cornerstoneTools.StackScrollMouseWheelTool;
      // cornerstoneTools.addTool(StackScrollMouseWheelTool);
      // cornerstoneTools.setToolActive("StackScrollMouseWheel", {
      //   mouseButtonMask: 0x1,
      // });

      //remove length measurement
      element.addEventListener("mousedown", removeMeasurements);
      console.log("mousedown added");
    }

    return () => {
      if (loadTool) {
        element.removeEventListener("mousedown", removeMeasurements);
        console.log("mousedown removed");
      }
    };
  }, [loadTool]);

  //change slice index
  const handleScroll = (e) => {
    if (e.deltaY > 0 && currentSliceIndex < imageIds.length - 1) {
      setCurrentSliceIndex(currentSliceIndex + 1);
    } else if (e.deltaY < 0 && currentSliceIndex > 0) {
      setCurrentSliceIndex(currentSliceIndex - 1);
    }
  };

  //change displayed image by slice index
  useEffect(() => {
    const element = canvasRef.current;
    element.addEventListener("wheel", handleScroll);

    cornerstone.loadAndCacheImage(imageIds[currentSliceIndex]).then((image) => {
      // console.log("current slice: ", currentSliceIndex);
      cornerstone.displayImage(element, image);
    });

    return () => {
      element.removeEventListener("wheel", handleScroll);
    };
  }, [currentSliceIndex]);

  useEffect(() => {
    if (isRuler) {
      cornerstoneTools.setToolActive("Length", {
        mouseButtonMask: 1,
      });
    } else {
      cornerstoneTools.setToolEnabled("Length");
    }
  }, [isRuler]);

  function switchRuler() {
    if (isRuler) {
      setIsRuler(false);
    } else {
      setIsRuler(true);
    }
  }

  const clearMeasure = (e) => {
    const element = canvasRef.current;
    const toolState = cornerstoneTools.getToolState(element, "Length");

    toolState.data = [];
    cornerstone.updateImage(element);
  };

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
        onMouseDown={(e) => {
          if (e.button === 0 && !isRuler) {
            setShowCross(true);
          }
        }}
      >
        <div
          className="crosshair crosshair-y"
          style={{
            bottom: `${imageSize + crossSpace - parseInt(currentCoord.y)}px`,
            left: `${parseInt(currentCoord.x)}px`,
            display: `${showCross ? "block" : "none"}`,
          }}
        ></div>
        <div
          className="crosshair crosshair-y"
          style={{
            top: `${crossSpace + parseInt(currentCoord.y)}px`,
            left: `${parseInt(currentCoord.x)}px`,
            display: `${showCross ? "block" : "none"}`,
          }}
        ></div>
        <div
          className="crosshair crosshair-x"
          style={{
            top: `${parseInt(currentCoord.y)}px`,
            right: `${imageSize + crossSpace - parseInt(currentCoord.x)}px`,
            display: `${showCross ? "block" : "none"}`,
          }}
        ></div>
        <div
          className="crosshair crosshair-x"
          style={{
            top: `${parseInt(currentCoord.y)}px`,
            left: `${crossSpace + parseInt(currentCoord.x)}px`,
            display: `${showCross ? "block" : "none"}`,
          }}
        ></div>
      </div>
      <div className="dicom-info">
        <button
          type="button"
          onClick={() => {
            clearMeasure();
          }}
        >
          Clear
        </button>
        <button type="button" onClick={switchRuler}>
          {isRuler ? "Crosshairs" : "Ruler"}
        </button>
        <p>Image Index: {currentSliceIndex}</p>
        <p>Image ID: {imageIds[currentSliceIndex]}</p>
        <p>
          Current Coord:
          {" ( " + currentCoord.x + " , " + currentCoord.y + " )"}
        </p>
        <p>
          Absolute Coord In Image:
          {" ( " + currentImgCoord.x + " , " + currentImgCoord.y + " )"}
        </p>
        <p>Image scale: {currentViewport.scale.toFixed(2)}</p>
        <p>
          Image translation:{" "}
          {`( ${currentViewport.x.toFixed(2)}, ${currentViewport.y.toFixed(
            2
          )} )`}
        </p>
        <Link to="/">Home</Link>
      </div>
    </>
  );
}
