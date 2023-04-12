import React, { useEffect, useRef, useState } from "react";
import cornerstone from "cornerstone-core";
import cornerstoneWebImageLoader from "cornerstone-web-image-loader";
import cornerstoneMath from "cornerstone-math";
import cornerstoneTools from "cornerstone-tools";
import Hammer from "hammerjs";
import "./../styles/styles.scss";
import { ZoomTool, LengthTool } from "cornerstone-tools";
import axios from "axios";

export default function WebImageAjax(props) {
  const canvasRef = useRef(null);

  const [imageIds, setImageIds] = useState([]);
  const [loadTool, setLoadTool] = useState(false);
  const [currentImageIdIndex, setCurrentImageIdIndex] = useState(0);

  //tool switch state
  const [isRuler, setIsRuler] = useState(false);
  const [showCross, setShowCross] = useState(false);

  //dicom header data
  const [currentCase, setCurrentCase] = useState({
    studyDate: "N/A",
    patientID: "N/A",
    name: "N/A",
    age: "N/A",
    gender: "N/A",
  });

  //coord data
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

  //settings
  const imageSize = 512;
  const crossSpace = 20;

  useEffect(() => {
    cornerstoneTools.external.cornerstone = cornerstone;
    cornerstoneTools.external.cornerstoneMath = cornerstoneMath;
    cornerstoneTools.external.Hammer = Hammer;

    //initialize dicom image loader/parser
    cornerstoneWebImageLoader.external.cornerstone = cornerstone; // set up Cornerstone Web Image Loader

    axios
      .get("/json/web.json")
      .then((response) => {
        setImageIds(response.data);
      })
      .catch((error) => {
        const element = canvasRef.current;
        console.error("Error fetching data:", error);
        cornerstone.enable(element);
      });
  }, []);

  useEffect(() => {
    console.log(imageIds);
    const element = canvasRef.current;
    if (imageIds.length > 0) {
      cornerstone.loadAndCacheImage(imageIds[0]).then((image) => {
        cornerstone.enable(element);

        //display intial image
        cornerstone.displayImage(element, image);

        // let viewport = cornerstone.getViewport(element);
        // console.log(viewport);

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
          }
        });

        const handleMouseMoveEvent = (e) => {
          let viewport = cornerstone.getViewport(element);
          let imagePoint = cornerstone.pageToPixel(element, e.pageX, e.pageY);

          //each viewport must reference unique element else you get wrong coordinates
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

        element.addEventListener("mousemove", handleMouseMoveEvent);

        setLoadTool(true);
      });
    }
  }, [imageIds]);

  useEffect(() => {
    // check loadtool state
    // console.log("loadtool:" + loadTool);

    const element = canvasRef.current;
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

    const WwwcTool = cornerstoneTools.WwwcTool;
    cornerstoneTools.addTool(WwwcTool);

    cornerstoneTools.setToolActive("Zoom", {
      mouseButtonMask: 2,
    });

    cornerstoneTools.setToolActive("Wwwc", { mouseButtonMask: 4 });

    const stack = {
      currentImageIdIndex: 0,
      imageIds: imageIds,
    };

    if (loadTool) {
      cornerstoneTools.addStackStateManager(element, ["stack"]);
      cornerstoneTools.addToolState(element, "stack", stack);

      // stack scroll using built-in cornerstone tool
      //   const StackScrollMouseWheelTool =
      //     cornerstoneTools.StackScrollMouseWheelTool;
      //   cornerstoneTools.addTool(StackScrollMouseWheelTool);
      //   cornerstoneTools.setToolActive("StackScrollMouseWheel", {
      //     mouseButtonMask: 0x1,
      //   });
    }

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

  const scrollSlice = (e) => {
    if (imageIds.length > 0) {
      if (e.deltaY > 0 && currentImageIdIndex < imageIds.length - 1) {
        setCurrentImageIdIndex(currentImageIdIndex + 1);
      }
      if (e.deltaY < 0 && currentImageIdIndex > 0) {
        setCurrentImageIdIndex(currentImageIdIndex - 1);
      }
    }

    // if using built-in stack scroll tool, get current image index
    // const element = canvasRef.current;
    // setCurrentImageIdIndex(
    //   cornerstoneTools.getToolState(element, "stack").data[0]
    //     .currentImageIdIndex
    // );
  };

  useEffect(() => {
    if (loadTool) {
      cornerstone
        .loadAndCacheImage(imageIds[currentImageIdIndex])
        .then((image) => {
          const element = canvasRef.current;
          cornerstone.displayImage(element, image);

          // check viewport
          //   let viewport = cornerstone.getViewport(element);
          //   console.log(viewport);
        });
    }
  }, [currentImageIdIndex]);

  useEffect(() => {
    if (isRuler) {
      cornerstoneTools.setToolActive("Length", {
        mouseButtonMask: 1,
      });
    } else {
      cornerstoneTools.setToolEnabled("Length");
    }
  }, [isRuler]);

  const switchRuler = () => {
    if (isRuler) {
      setIsRuler(false);
    } else {
      setIsRuler(true);
    }
  };

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
      <h1>Cornerstone Ajax</h1>
      <table>
        <thead>
          <tr>
            <th>Study Date</th>
            <th>Patient ID</th>
            <th>Name</th>
            <th>age</th>
            <th>Gender</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{currentCase.studyDate}</td>
            <td>{currentCase.patientID}</td>
            <td>{currentCase.name}</td>
            <td>{currentCase.age}</td>
            <td>{currentCase.gender}</td>
          </tr>
        </tbody>
      </table>
      <div
        ref={canvasRef}
        className="viewer"
        onContextMenu={(e) => {
          e.preventDefault();
          return false;
        }}
        onWheel={scrollSlice}
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
        <p>
          Slice: {currentImageIdIndex + 1} / {imageIds.length}
        </p>
        <p>Image Link : {imageIds[currentImageIdIndex]}</p>
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
