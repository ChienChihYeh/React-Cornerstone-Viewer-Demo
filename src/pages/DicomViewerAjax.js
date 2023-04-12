//DEPRECATED
import React, { useEffect, useRef, useState } from "react";
import dicomParser from "dicom-parser";
import cornerstone from "cornerstone-core";
import cornerstoneWADOImageLoader from "cornerstone-wado-image-loader";
import cornerstoneMath from "cornerstone-math";
import cornerstoneTools from "cornerstone-tools";
import Hammer from "hammerjs";
import "./../styles/styles.scss";
import { ZoomTool, LengthTool } from "cornerstone-tools";
import axios from "axios";

export default function DicomViewerAjax(props) {
  const [isRuler, setIsRuler] = useState(false);
  const [showCross, setShowCross] = useState(false);
  const [loadImg, setLoadImg] = useState(false);
  const [loadTool, setLoadTool] = useState(false);
  const [currentSliceIndex, setCurrentSliceIndex] = useState(0);
  const [imageIds, setImageIds] = useState([]);
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
    axios
      .get("/json/data.json")
      .then((response) => {
        setImageIds(response.data);
        setLoadImg(true);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
    cornerstoneTools.external.cornerstone = cornerstone;
    cornerstoneTools.external.cornerstoneMath = cornerstoneMath;
    cornerstoneTools.external.Hammer = Hammer;

    //initialize dicom image loader/parser
    cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
    cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

    //initialize cornerstone
    const element = canvasRef.current;
    cornerstone.enable(element);
  }, []);

  useEffect(() => {
    const element = canvasRef.current;

    if (loadImg === true) {
      //intial image loading
      cornerstone
        .loadAndCacheImage(imageIds[currentSliceIndex])
        .then((image) => {
          //dicom data birthday
          console.log(image.data.string("x00100030"));
          cornerstone.displayImage(element, image);
          cornerstone.setViewport(element, {
            scale: currentViewport.scale,
            translation: {
              x: currentViewport.x,
              y: currentViewport.y,
            },
          });

          const resetViewport = (e) => {
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
          };

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

            setCurrentCoord({
              x: x.toFixed(2),
              y: y.toFixed(2),
            });

            setCurrentImgCoord({
              x: imagePoint.x.toFixed(2),
              y: imagePoint.y.toFixed(2),
            });
          };

          //change slice index
          const handleScroll = (e) => {
            if (e.deltaY > 0 && currentSliceIndex < imageIds.length - 1) {
              let viewport = cornerstone.getViewport(element);
              //   console.log(viewport);
              setCurrentViewport({
                scale: viewport.scale,
                x: viewport.translation.x,
                y: viewport.translation.y,
              });
              setCurrentSliceIndex(currentSliceIndex + 1);
            } else if (e.deltaY < 0 && currentSliceIndex > 0) {
              let viewport = cornerstone.getViewport(element);
              //   console.log(viewport);
              setCurrentViewport({
                scale: viewport.scale,
                x: viewport.translation.x,
                y: viewport.translation.y,
              });
              setCurrentSliceIndex(currentSliceIndex - 1);
            }
          };

          element.addEventListener("mousemove", handleMouseEvent);

          //viewport reset
          window.addEventListener("mouseup", resetViewport);

          element.addEventListener("wheel", handleScroll);

          //load cornerstone tools after intial image loading, else they will not mount properly
          setLoadTool(true);
        });
    }
  }, [currentSliceIndex, loadImg]);

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
          Image translation:
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
