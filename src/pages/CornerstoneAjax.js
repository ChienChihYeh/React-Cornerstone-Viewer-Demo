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

export default function CornerstoneAjax(props) {
  const canvasRef = useRef(null);

  const [imageIds, setImageIds] = useState([]);
  const [loadTool, setLoadTool] = useState(false);
  const [currentImageIdIndex, setCurrentImageIdIndex] = useState(0);

  useEffect(() => {
    cornerstoneTools.external.cornerstone = cornerstone;
    cornerstoneTools.external.cornerstoneMath = cornerstoneMath;
    cornerstoneTools.external.Hammer = Hammer;

    //initialize dicom image loader/parser
    cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
    cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
    //initialize cornerstone

    axios
      .get("/json/data.json")
      .then((response) => {
        setImageIds(response.data);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }, []);

  useEffect(() => {
    console.log(imageIds);
    const element = canvasRef.current;
    if (imageIds.length > 0) {
      cornerstone.loadAndCacheImage(imageIds[0]).then((image) => {
        cornerstone.enable(element);
        console.log(image.data.string("x00100030"));
        cornerstone.displayImage(element, image);

        let viewport = cornerstone.getViewport(element);
        console.log(viewport);

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

    cornerstoneTools.setToolActive("Zoom", {
      mouseButtonMask: 2,
    });

    cornerstoneTools.setToolActive("Length", {
      mouseButtonMask: 1,
    });

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

  return (
    <>
      <h1>Ajax Test</h1>
      <div
        ref={canvasRef}
        className="viewer"
        onContextMenu={(e) => {
          e.preventDefault();
          return false;
        }}
        onWheel={scrollSlice}
      ></div>
      <div className="dicom-info">
        <p>
          Slice: {currentImageIdIndex + 1} / {imageIds.length}
        </p>
        <p>Image Link : {imageIds[currentImageIdIndex]}</p>
      </div>
    </>
  );
}
