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
import { Link, useParams } from "react-router-dom";
import NoduleCanvasArr from "./../components/NoduleCanvasArr";
import CoronalViewer from "../components/CoronalViewer";
import NewNodule from "../components/NewNodule";

export default function CornerstoneAjax(props) {
  const canvasRef = useRef(null);

  const { studyDate, patientID, accessionNumber } = useParams();

  // console.log(studyDate, patientID, accessionNumber);

  const [imageIds, setImageIds] = useState([]);
  const [loadTool, setLoadTool] = useState(false);
  const [currentImageIdIndex, setCurrentImageIdIndex] = useState(0);

  //tool switch state
  const [isRuler, setIsRuler] = useState(false);
  const [showCross, setShowCross] = useState(false);

  const crossRef = useRef(false);

  //dicom header data
  const [currentCase, setCurrentCase] = useState({
    studyDate: "",
    patientID: "",
    name: "",
    age: "",
    gender: "",
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

  // const [noduleCoord, setNoduleCoord] = useState({
  //   x: 0,
  //   y: 0,
  //   size: 50,
  // });

  const [coronalImgCoord, setCoronalImgCoord] = useState({
    x: 0,
    y: 0,
    ratio: 0,
  });

  const [annoArray, setAnnoArray] = useState([]);
  const [displayArray, setDisplayArray] = useState([]);

  const [newNodule, setNewNodule] = useState({
    studyDate: "",
    patientID: "",
    coord_X: "",
    coord_Y: "",
    slice_path: "",
  });

  //settings
  const imageSize = 512;
  const crossSpace = 20;

  useEffect(() => {
    cornerstoneTools.external.cornerstone = cornerstone;
    cornerstoneTools.external.cornerstoneMath = cornerstoneMath;
    cornerstoneTools.external.Hammer = Hammer;

    //initialize dicom image loader/parser
    cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
    cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
    //initialize cornerstone

    const element = canvasRef.current;
    cornerstone.enable(element);

    // axios
    //   .get("/json/data.json")
    //   .then((response) => {
    //     setImageIds(response.data);
    //   })
    //   .catch((error) => {
    //     console.error("Error fetching data:", error);
    //   });

    let formData = new FormData();
    formData.append("mode", "LungRads");
    formData.append("StudyDate", studyDate ? studyDate : "20201205");
    formData.append("PatientID", patientID ? patientID : "17918691");
    formData.append(
      "AccessionNumber",
      accessionNumber ? accessionNumber : "3924110977050"
    );

    const getAnnoArray = (data, totalSlice) => {
      // console.log(data);
      // console.log(data.LungRads_Result);
      // console.log(data.LungRads_Result.NoduleNum);
      // console.log(totalSlice);

      let getArray = [];
      for (let i = 0; i < data.LungRads_Result.NoduleNum; i++) {
        let NoduleFinding = data.LungRads_Result[`NoduleFinding${i}`];
        let NoduleSlice = totalSlice - NoduleFinding.Coord_Z.split("/")[1];
        // console.log(NoduleSlice);
        for (let j = -2; j <= 2; j++) {
          let NoduleData = {
            index: i,
            x: NoduleFinding.Coord_X,
            y: NoduleFinding.Coord_Y,
            radius: NoduleFinding.Radius,
            slice: NoduleSlice + j - 1,
          };
          getArray.push(NoduleData);
        }
      }
      setAnnoArray(getArray);
      console.log(getArray);
    };

    axios
      .post("http://192.168.0.11:18000/get_file", formData)
      .then((response) => {
        // console.log("server response:" + JSON.stringify(response.data));
        // console.log(response.data.path);
        setImageIds(response.data.path);

        let totalSlice = response.data.path.length;
        formData.append("slicenum", totalSlice);

        axios
          .post("http://192.168.0.11:18000/read_LungRads_Result", formData)
          .then((response) => {
            getAnnoArray(response.data, totalSlice);
          });
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });

    return () => {
      // let info = cornerstone.imageCache.getCacheInfo();
      // console.log(info);
      cornerstone.imageCache.purgeCache();
      // console.log("cache cleared");
      let info = cornerstone.imageCache.getCacheInfo();
      // info = cornerstone.imageCache.getCacheInfo();
      console.log(info);
    };
  }, []);

  useEffect(() => {
    // console.log(imageIds);
    const element = canvasRef.current;

    const handleMouseMoveEvent = (e) => {
      if (!crossRef.current) {
        return null;
      }
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
        x: Math.min(Math.max(imagePoint.x.toFixed(6), 0), imageSize),
        y: Math.min(Math.max(imagePoint.y.toFixed(6), 0), imageSize),
      });
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
      window.removeEventListener("mousemove", handleMouseMoveEvent);
      console.log("mousemove removed");
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

        if (!crossRef.current) {
          return null;
        }

        setCurrentCoord({
          x: Math.min(Math.max(x.toFixed(6), 0), imageSize - 1),
          y: Math.min(Math.max(y.toFixed(6), 0), imageSize - 1),
        });

        setCurrentImgCoord({
          x: Math.min(Math.max(imagePoint.x.toFixed(6), 0), imageSize),
          y: Math.min(Math.max(imagePoint.y.toFixed(6), 0), imageSize),
        });
      }

      console.log("mousemove added");
    };

    if (imageIds.length > 0) {
      cornerstone.loadAndCacheImage(imageIds[0]).then((image) => {
        cornerstone.enable(element);

        //calculate patient age from studyDate and birthday
        const getDateFromString = (dateString) => {
          const year = dateString.slice(0, 4);
          const month = dateString.slice(4, 6) - 1;
          const day = dateString.slice(6, 8);

          return new Date(year, month, day);
        };

        const studyString = image.data.string("x00080020");
        const studyYear = studyString.slice(0, 4);
        const studyMonth = studyString.slice(4, 6) - 1;
        const studyDay = studyString.slice(6, 8);

        const birthString = image.data.string("x00100030");
        const birthday = getDateFromString(birthString);

        const millisecondsPerYear = 1000 * 60 * 60 * 24 * 365.25;
        const age = Math.floor((new Date() - birthday) / millisecondsPerYear);

        //set dicom data from initial image
        setCurrentCase({
          studyDate: `${studyYear}/${studyMonth + 1}/${studyDay}`,
          patientID: image.data.string("x00100020"),
          name: image.data.string("x00100010"),
          age: age,
          gender: image.data.string("x00100040"),
        });

        let viewport = cornerstone.getDefaultViewportForImage(element, image);
        viewport["translation"] = { x: 0, y: 0 };
        viewport.voi.windowCenter = -500;
        viewport.voi.windowWidth = 1600;
        //display intial image
        cornerstone.displayImage(element, image, viewport);

        // let viewport = cornerstone.getViewport(element);
        // console.log(viewport);

        window.addEventListener("mousemove", handleZoomEvent);
        window.addEventListener("mouseup", swtichOffCross);
        console.log("mouseup added");
        console.log("zoom track added");

        element.addEventListener("mousedown", getCoords);

        setLoadTool(true);
      });
    }

    return () => {
      if (imageIds.length > 0) {
        element.removeEventListener("mousedown", getCoords);
        window.removeEventListener("mouseup", swtichOffCross);
        window.removeEventListener("mousemove", handleZoomEvent);
        console.log("mousedown removed");
        console.log("mouseup removed");
        console.log("zoom track removed");
      }
    };
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

    cornerstoneTools.setToolEnabled("Length");

    const removeMeasurements = (e) => {
      // Get the tool state for the "length" tool
      const toolState = cornerstoneTools.getToolState(element, "Length");

      if (toolState && toolState.data) {
        // console.log(toolState.data);
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

    const handleMeasurementModified = (e) => {
      // console.log(e.detail);
    };

    if (loadTool) {
      // activate this if you want to sync length tool across slices
      cornerstoneTools.addStackStateManager(element, [
        "stack",
        "Length",
        "Wwc",
      ]);

      // activate this if you want to seperate length tool for individual slices
      // cornerstoneTools.addStackStateManager(element, ["stack"]);
      cornerstoneTools.addToolState(element, "stack", stack);

      // stack scroll using built-in cornerstone tool
      //   const StackScrollMouseWheelTool =
      //     cornerstoneTools.StackScrollMouseWheelTool;
      //   cornerstoneTools.addTool(StackScrollMouseWheelTool);
      //   cornerstoneTools.setToolActive("StackScrollMouseWheel", {
      //     mouseButtonMask: 0x1,
      //   });

      element.addEventListener("mousedown", removeMeasurements);
      console.log("mousedown added");

      element.addEventListener(
        cornerstoneTools.EVENTS.MEASUREMENT_MODIFIED,
        handleMeasurementModified
      );
    }

    return () => {
      if (loadTool) {
        element.removeEventListener("mousedown", removeMeasurements);
        console.log("mousedown removed");
      }
      cornerstoneTools.clearToolState(element, "Length");
      element.removeEventListener(
        cornerstoneTools.EVENTS.MEASUREMENT_MODIFIED,
        handleMeasurementModified
      );
    };
  }, [loadTool]);

  useEffect(() => {
    crossRef.current = showCross;
  });

  const scrollSlice = (e) => {
    if (imageIds.length > 0) {
      if (e.deltaY > 0 && currentImageIdIndex < imageIds.length - 1) {
        setCurrentImageIdIndex(currentImageIdIndex + 1);
        let displayArr = annoArray.filter(
          (a) => a.slice === currentImageIdIndex + 1
        );
        // console.log(currentImageIdIndex + 1, displayArr);
        setDisplayArray(displayArr);
      }
      if (e.deltaY < 0 && currentImageIdIndex > 0) {
        setCurrentImageIdIndex(currentImageIdIndex - 1);
        let displayArr = annoArray.filter(
          (a) => a.slice === currentImageIdIndex - 1
        );
        // console.log(currentImageIdIndex - 1, displayArr);
        setDisplayArray(displayArr);
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

          let stack = cornerstoneTools.getToolState(element, "stack");

          stack.data[0].currentImageIdIndex = currentImageIdIndex;

          // console.log(stack);
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
    // const stackManager = cornerstoneTools.getElementToolStateManager(element);
    // console.log(stackManager);
    const toolState = cornerstoneTools.getToolState(element, "Length");
    if (toolState.data) {
      // console.log(toolState.data);
      toolState.data = [];
    }

    // alternative
    // cornerstoneTools.clearToolState(element, "Length");
    cornerstone.updateImage(element);
  };

  const getCoronalCoords = (x, y, ratio) => {
    setCoronalImgCoord({ x: x, y: y, ratio: ratio });
  };

  useEffect(() => {
    let currentSlice = Math.floor((imageIds.length * coronalImgCoord.y) / 570);
    //coronal image size = 570px
    if (currentSlice <= 0) {
      currentSlice = 0;
      setCurrentImageIdIndex(currentSlice);
    } else if (currentSlice > imageIds.length - 1) {
      currentSlice = imageIds.length - 1;
      setCurrentImageIdIndex(currentSlice);
    } else {
      setCurrentImageIdIndex(currentSlice);
    }

    if (imageIds.length > 0) {
      setShowCross(true);
    }
    setCurrentCoord({
      x:
        imageSize / 2 +
        (currentViewport.x + (coronalImgCoord.x / 570) * 512 - imageSize / 2) *
          currentViewport.scale,
      y: isNaN(coronalImgCoord.ratio) ? 0 : coronalImgCoord.ratio * imageSize,
    });
  }, [coronalImgCoord]);

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
      <div className="flex-container">
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
          onDoubleClick={() => {
            setNewNodule({
              studyDate: studyDate,
              patientID: patientID,
              coord_X: `${currentImgCoord.x}`,
              coord_Y: `${currentImgCoord.y}`,
              slice_path: imageIds[currentImageIdIndex],
              currentImageIdIndex: currentImageIdIndex,
            });
          }}
        >
          <NewNodule
            newNodule={newNodule}
            imageSize={imageSize}
            scale={currentViewport.scale}
            viewX={currentViewport.x}
            viewY={currentViewport.y}
            currentImageIdIndex={currentImageIdIndex}
          />
          <NoduleCanvasArr
            displayArray={displayArray}
            imageSize={imageSize}
            scale={currentViewport.scale}
            viewX={currentViewport.x}
            viewY={currentViewport.y}
            currentId={0}
          />
          {showCross ? (
            <>
              <div
                className="crosshair crosshair-y"
                style={{
                  bottom: `${
                    imageSize + crossSpace - parseInt(currentCoord.y)
                  }px`,
                  left: `${parseInt(currentCoord.x)}px`,
                  // display: `${showCross ? "block" : "none"}`,
                }}
              ></div>
              <div
                className="crosshair crosshair-y"
                style={{
                  top: `${crossSpace + parseInt(currentCoord.y)}px`,
                  left: `${parseInt(currentCoord.x)}px`,
                }}
              ></div>
              <div
                className="crosshair crosshair-x"
                style={{
                  top: `${parseInt(currentCoord.y)}px`,
                  right: `${
                    imageSize + crossSpace - parseInt(currentCoord.x)
                  }px`,
                }}
              ></div>
              <div
                className="crosshair crosshair-x"
                style={{
                  top: `${parseInt(currentCoord.y)}px`,
                  left: `${crossSpace + parseInt(currentCoord.x)}px`,
                }}
              ></div>
            </>
          ) : (
            ""
          )}
        </div>
        <CoronalViewer
          axialX={currentImgCoord.x}
          axialY={currentImgCoord.y}
          ratio={currentImageIdIndex / imageIds.length}
          getCoronalCoords={getCoronalCoords}
        />
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
        <p>
          Absolute Coord In Coronal Image:
          {" ( " + coronalImgCoord.x + " , " + coronalImgCoord.y + " )"}
        </p>

        <p>Image scale: {currentViewport.scale.toFixed(6)}</p>
        <p>
          Image translation:{" "}
          {`( ${currentViewport.x.toFixed(6)}, ${currentViewport.y.toFixed(
            2
          )} )`}
        </p>
        {/* <Link to="/">Home</Link> */}
      </div>
    </>
  );
}
