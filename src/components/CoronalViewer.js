import React, { useEffect, useRef, useState } from "react";
import cornerstone from "cornerstone-core";
import cornerstoneMath from "cornerstone-math";
import cornerstoneWebImageLoader from "cornerstone-web-image-loader";
import cornerstoneTools from "cornerstone-tools";
import Hammer from "hammerjs/hammer.js";
import "./../styles/styles.scss";
import { ZoomTool } from "cornerstone-tools";
import axios from "axios";
import { useParams } from "react-router-dom";

export default function CoronalViewer({
  axialX,
  axialY,
  ratio,
  getCoronalCoords,
}) {
  const { studyDate, patientID, accessionNumber } = useParams();

  const [loadTool, setLoadTool] = useState(null);

  const [pngIds, setPngIds] = useState([]);
  const [currentImageIdIndex, setCurrentImageIdIndex] = useState(0);

  //tool switch state
  const [showCross, setShowCross] = useState(false);

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

  const coronalRef = useRef(null);

  useEffect(() => {
    cornerstoneTools.external.cornerstone = cornerstone; // set up Cornerstone Tools
    cornerstoneTools.external.cornerstoneMath = cornerstoneMath;
    cornerstoneWebImageLoader.external.cornerstone = cornerstone; // set up Cornerstone Web Image Loader
    cornerstoneTools.external.Hammer = Hammer;

    const element = coronalRef.current;
    cornerstone.enable(element); // enable the canvas with Cornerstone

    let formData = new FormData();
    formData.append("mode", "LungRads");
    formData.append("StudyDate", studyDate ? studyDate : "20201205");
    formData.append("PatientID", patientID ? patientID : "17918691");
    formData.append(
      "AccessionNumber",
      accessionNumber ? accessionNumber : "3924110977050"
    );

    axios
      .post("http://192.168.0.11:18000/get_file_coronal", formData)
      .then((response) => {
        // console.log("coronal_image_path", response.data.path);
        response.data.path.sort((a, b) => {
          const regex = /coronal_output_(\d+)\.png/;
          const aNumber = parseInt(a.match(regex)[1]);
          const bNumber = parseInt(b.match(regex)[1]);
          return aNumber - bNumber;
        });

        setPngIds(response.data.path);
      })
      .catch((error) => {
        console.error("Error fetching coronal data:", error);
      });

    return () => {};
  }, []);

  useEffect(() => {
    const element = coronalRef.current;

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
        x: Math.min(Math.max(x.toFixed(6), 0), imageSize - 1),
        y: Math.min(Math.max(y.toFixed(6), 0), imageSize - 1),
      });

      setCurrentImgCoord({
        x: Math.min(Math.max(imagePoint.x.toFixed(6), 0), 570),
        y: Math.min(Math.max(imagePoint.y.toFixed(6), 0), 570),
      });

      getCoronalCoords(
        Math.min(Math.max(imagePoint.x.toFixed(6), 0), 570),
        Math.min(Math.max(imagePoint.y.toFixed(6), 0), 570),
        currentImageIdIndex / pngIds.length
      );
    };

    const handleZoomEvent = (e) => {
      let viewport = cornerstone.getViewport(element);
      setCurrentViewport({
        scale: viewport.scale,
        x: viewport.translation.x,
        y: viewport.translation.y,
      });
    };

    const swtichOffCross = function (e) {
      setShowCross(false);
      let viewport = cornerstone.getViewport(element);
      // console.log("coronal scale:", viewport.scale);
      if (viewport.scale <= 0.89824) {
        cornerstone.setViewport(element, {
          scale: 0.89824,
          translation: {
            x: 0,
            y: 0,
          },
        });
        setCurrentViewport({
          scale: 0.89824,
          x: 0,
          y: 0,
        });
      }
      window.removeEventListener("mousemove", handleMouseMoveEvent);
      console.log("coronal mousemove removed");
    };

    const getCoords = function (e) {
      // console.log(e.button);
      if (e.button === 0) {
        window.addEventListener("mousemove", handleMouseMoveEvent);

        let imagePoint = cornerstone.pageToPixel(element, e.pageX, e.pageY);

        //each viewport must reference unique element else you get wrong coordinates
        let rect = element.getBoundingClientRect();
        let x = e.pageX - rect.left;
        let y = e.pageY - rect.top;

        setCurrentCoord({
          x: Math.min(Math.max(x.toFixed(6), 0), imageSize - 1),
          y: Math.min(Math.max(y.toFixed(6), 0), imageSize - 1),
        });

        setCurrentImgCoord({
          x: Math.min(Math.max(imagePoint.x.toFixed(6), 0), 570),
          y: Math.min(Math.max(imagePoint.y.toFixed(6), 0), 570),
        });
      }

      console.log("coronal mousemove added");
    };

    if (pngIds.length > 0) {
      setCurrentImageIdIndex(Math.floor(pngIds.length / 2));
      cornerstone
        .loadAndCacheImage(pngIds[Math.floor(pngIds.length / 2)])
        .then((image) => {
          cornerstone.enable(element); // enable the canvas with Cornerstone
          cornerstone.displayImage(element, image); // display the image on the canvas

          window.addEventListener("mouseup", swtichOffCross);
          console.log("coronal mouseup added");

          window.addEventListener("mousemove", handleZoomEvent);
          console.log("coronal mousemove added");

          element.addEventListener("mousedown", getCoords);

          setLoadTool(true); // enable
        });
    }
    return () => {
      if (pngIds.length > 0) {
        window.removeEventListener("mouseup", swtichOffCross);
        window.removeEventListener("mousemove", handleZoomEvent);
        element.removeEventListener("mousedown", getCoords);
        console.log("coronal mousedown removed");
        console.log("coronal mouseup removed");
        console.log("coronal mousemove removed");
      }
    };
  }, [pngIds]);

  useEffect(() => {
    const element = coronalRef.current;

    cornerstoneTools.init();
    cornerstoneTools.addToolForElement(element, ZoomTool, {
      configuration: {
        invert: true,
        preventZoomOutsideImage: false,
        minScale: 0.89823,
        maxScale: 20.0,
      },
    });
    cornerstoneTools.setToolActive("Zoom", {
      mouseButtonMask: 2,
    }); // activate ZoomTool with left mouse button

    const stack = {
      currentImageIdIndex: Math.floor(pngIds.length / 2),
      imageIds: pngIds,
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
    }
  }, [loadTool]);

  useEffect(() => {
    if (loadTool) {
      cornerstone
        .loadAndCacheImage(pngIds[currentImageIdIndex])
        .then((image) => {
          const element = coronalRef.current;
          cornerstone.displayImage(element, image);

          let stack = cornerstoneTools.getToolState(element, "stack");

          stack.data[0].currentImageIdIndex = currentImageIdIndex;

          // console.log(stack);
          // check viewport
          //   let viewport = cornerstone.getViewport(element);
          //   console.log(viewport);
        });
    }
  }, [currentImageIdIndex]);

  const scrollSlice = (e) => {
    if (pngIds.length > 0) {
      if (e.deltaY > 0 && currentImageIdIndex < pngIds.length - 1) {
        setCurrentImageIdIndex(currentImageIdIndex + 1);
      }
      if (e.deltaY < 0 && currentImageIdIndex > 0) {
        setCurrentImageIdIndex(currentImageIdIndex - 1);
      }
    }
  };

  useEffect(() => {
    // console.log(axialX, axialY, sync);
    let currentSlice = Math.floor((pngIds.length * axialY) / imageSize);
    // console.log(currentSlice);
    if (currentSlice <= 0) {
      currentSlice = 0;
      setCurrentImageIdIndex(currentSlice);
    } else if (currentSlice > pngIds.length - 1) {
      currentSlice = pngIds.length - 1;
      setCurrentImageIdIndex(currentSlice);
    } else {
      setCurrentImageIdIndex(currentSlice);
    }

    // Math.min(Math.max(x.toFixed(6), 0), 512)

    if (loadTool) {
      setShowCross(true);
    }
    setCurrentCoord({
      x: Math.min(
        Math.max(
          imageSize / 2 +
            (currentViewport.x + (axialX / 512) * 570 - imageSize / 2) *
              currentViewport.scale -
            26,
          0
        ),
        imageSize - 1
      ),
      y: Math.min(Math.max(ratio * imageSize, 0), imageSize - 1),
    });
    // console.log("coronal x:" + currentCoord.x);
  }, [axialX, axialY]);

  useEffect(() => {
    getCoronalCoords(
      currentImgCoord.x,
      currentImgCoord.y,
      currentImageIdIndex / pngIds.length
    );
  }, [currentImgCoord]);

  return (
    <>
      <div
        className="viewer"
        ref={coronalRef}
        onContextMenu={(e) => {
          e.preventDefault();
          return false;
        }}
        onWheel={scrollSlice}
        onMouseDown={(e) => {
          if (e.button === 0) {
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
    </>
  );
}
