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

  const stack = {
    currentImageIdIndex: 0,
    imageIds: imageIds,
  };

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

    //intial image loading
    cornerstone.loadAndCacheImage(imageIds[0]).then((image) => {
      cornerstone.displayImage(element, image);

      //viewport reset
      window.addEventListener("mouseup", (e) => {
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
          setCurrentViewport({
            scale: 1,
            x: 0,
            y: 0,
          });
        }
      });

      const handleMouseEvent = (e) => {
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

        // console.log(viewport);
        // console.log(
        //   "current:" + imagePoint.x.toFixed(0) + "," + imagePoint.y.toFixed(0)
        // );

        // console.log(`(x, y): (${x.toFixed(2)}, ${y.toFixed(2)})`);

        setCurrentCoord({
          x: x.toFixed(2),
          y: y.toFixed(2),
        });

        setCurrentImgCoord({
          x: imagePoint.x.toFixed(2),
          y: imagePoint.y.toFixed(2),
        });
      };

      element.addEventListener("mousemove", handleMouseEvent);

      //load cornerstone tools after intial image loading, else they will not mount properly
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
    element.addEventListener("mousedown", (e) => {
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
    });
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

  window.addEventListener("mouseup", (e) => {
    setShowCross(false);
  });

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
      </div>
    </>
  );
}
