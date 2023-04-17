import React, { useEffect, useRef, useState } from "react"
import cornerstone from "cornerstone-core"
import cornerstoneWebImageLoader from "cornerstone-web-image-loader"
import cornerstoneMath from "cornerstone-math"
import cornerstoneTools from "cornerstone-tools"
import Hammer from "hammerjs"
import "./../styles/styles.scss"
import { ZoomTool, LengthTool } from "cornerstone-tools"
import axios from "axios"
import { Link } from "react-router-dom"
import NoduleCanvas from "./../components/NoduleCanvas"

export default function WebImageAjax(props) {
  const canvasRef = useRef(null)
  const [noduleCoord, setNoduleCoord] = useState({
    x: 0,
    y: 0,
    size: 50,
  })
  const [imageIds, setImageIds] = useState([])
  const [loadTool, setLoadTool] = useState(false)
  const [currentImageIdIndex, setCurrentImageIdIndex] = useState(0)

  //tool switch state
  const [isRuler, setIsRuler] = useState(false)
  const [showCross, setShowCross] = useState(false)

  //dicom header data
  const [currentCase, setCurrentCase] = useState({
    studyDate: "N/A",
    patientID: "N/A",
    name: "N/A",
    age: "N/A",
    gender: "N/A",
  })

  //coord data
  const [currentCoord, setCurrentCoord] = useState({
    x: 0,
    y: 0,
  })
  const [currentImgCoord, setCurrentImgCoord] = useState({
    x: 0,
    y: 0,
  })
  const [currentViewport, setCurrentViewport] = useState({
    scale: 1,
    x: 0,
    y: 0,
  })

  //settings
  const imageSize = 512
  const crossSpace = 20

  useEffect(() => {
    cornerstoneTools.external.cornerstone = cornerstone
    cornerstoneTools.external.cornerstoneMath = cornerstoneMath
    cornerstoneTools.external.Hammer = Hammer

    //initialize dicom image loader/parser
    cornerstoneWebImageLoader.external.cornerstone = cornerstone // set up Cornerstone Web Image Loader

    axios
      .get("/json/web.json")
      .then((response) => {
        setImageIds(response.data)
      })
      .catch((error) => {
        const element = canvasRef.current
        console.error("Error fetching data:", error)
        cornerstone.enable(element)
      })
  }, [])

  useEffect(() => {
    console.log(imageIds)
    const element = canvasRef.current

    const handleMouseMoveEvent = (e) => {
      let viewport = cornerstone.getViewport(element)
      let imagePoint = cornerstone.pageToPixel(element, e.pageX, e.pageY)

      //each viewport must reference unique element else you get wrong coordinates
      let rect = element.getBoundingClientRect()
      let x = e.pageX - rect.left
      let y = e.pageY - rect.top

      setCurrentViewport({
        scale: viewport.scale,
        x: viewport.translation.x,
        y: viewport.translation.y,
      })

      setCurrentCoord({
        x: x.toFixed(2),
        y: y.toFixed(2),
      })

      setCurrentImgCoord({
        x: imagePoint.x.toFixed(2),
        y: imagePoint.y.toFixed(2),
      })
    }

    const swtichOffCross = function (e) {
      setShowCross(false)
      let viewport = cornerstone.getViewport(element)
      // console.log(viewport.scale);
      if (viewport.scale <= 1) {
        cornerstone.setViewport(element, {
          scale: 1,
          translation: {
            x: 0,
            y: 0,
          },
        })
        setCurrentViewport({
          scale: 1,
          x: 0,
          y: 0,
        })
      }
    }

    if (imageIds.length > 0) {
      cornerstone.loadAndCacheImage(imageIds[0]).then((image) => {
        cornerstone.enable(element)

        //display intial image
        cornerstone.displayImage(element, image)

        // let viewport = cornerstone.getViewport(element);
        // console.log(viewport);

        //viewport reset
        window.addEventListener("mouseup", swtichOffCross)
        console.log("mouseup added")

        window.addEventListener("mousemove", handleMouseMoveEvent)
        console.log("mousemove added")

        setLoadTool(true)
      })
    }

    return () => {
      if (imageIds.length > 0) {
        window.removeEventListener("mousemove", handleMouseMoveEvent)
        window.removeEventListener("mouseup", swtichOffCross)
        console.log("mousemove removed")
        console.log("mouseup removed")
      }
    }
  }, [imageIds])

  useEffect(() => {
    // check loadtool state
    // console.log("loadtool:" + loadTool);

    const element = canvasRef.current
    cornerstoneTools.init()

    cornerstoneTools.addToolForElement(element, ZoomTool, {
      configuration: {
        invert: true,
        preventZoomOutsideImage: false,
        minScale: 1,
        maxScale: 20.0,
      },
    })

    cornerstoneTools.addToolForElement(element, LengthTool, {
      configuration: {
        drawHandlesOnHover: true,
        deleteIfHandleOutsideImage: true,
        preventContextMenu: true,
      },
    })
    cornerstoneTools.toolColors.setActiveColor("rgb(0, 255, 0)")
    cornerstoneTools.toolColors.setToolColor("rgb(255, 255, 0)")

    const WwwcTool = cornerstoneTools.WwwcTool
    cornerstoneTools.addTool(WwwcTool)

    cornerstoneTools.setToolActive("Zoom", {
      mouseButtonMask: 2,
    })

    cornerstoneTools.setToolActive("Wwwc", { mouseButtonMask: 4 })

    const stack = {
      currentImageIdIndex: 0,
      imageIds: imageIds,
    }

    const removeMeasurements = (e) => {
      // Get the tool state for the "length" tool
      const toolState = cornerstoneTools.getToolState(element, "Length")

      if (toolState && toolState.data) {
        // Get the currently selected measurement
        toolState.data.forEach((v, i) => {
          if (v.active === true && e.which === 3) {
            // console.log(i);
            toolState.data.splice(i, 1)
            cornerstone.updateImage(element)
          }
        })
      }
    }

    if (loadTool) {
      cornerstoneTools.addStackStateManager(element, ["stack"])
      cornerstoneTools.addToolState(element, "stack", stack)

      // stack scroll using built-in cornerstone tool
      //   const StackScrollMouseWheelTool =
      //     cornerstoneTools.StackScrollMouseWheelTool;
      //   cornerstoneTools.addTool(StackScrollMouseWheelTool);
      //   cornerstoneTools.setToolActive("StackScrollMouseWheel", {
      //     mouseButtonMask: 0x1,
      //   });
      //remove length measurement
      element.addEventListener("mousedown", removeMeasurements)
      console.log("mousedown added")
    }

    return () => {
      if (loadTool) {
        element.removeEventListener("mousedown", removeMeasurements)
        console.log("mousedown removed")
      }
    }
  }, [loadTool])

  const scrollSlice = (e) => {
    if (imageIds.length > 0) {
      if (e.deltaY > 0 && currentImageIdIndex < imageIds.length - 1) {
        setCurrentImageIdIndex(currentImageIdIndex + 1)
      }
      if (e.deltaY < 0 && currentImageIdIndex > 0) {
        setCurrentImageIdIndex(currentImageIdIndex - 1)
      }
    }

    // if using built-in stack scroll tool, get current image index
    // const element = canvasRef.current;
    // setCurrentImageIdIndex(
    //   cornerstoneTools.getToolState(element, "stack").data[0]
    //     .currentImageIdIndex
    // );
  }

  useEffect(() => {
    if (loadTool) {
      cornerstone
        .loadAndCacheImage(imageIds[currentImageIdIndex])
        .then((image) => {
          const element = canvasRef.current
          cornerstone.displayImage(element, image)

          // check viewport
          //   let viewport = cornerstone.getViewport(element);
          //   console.log(viewport);
        })
    }
  }, [currentImageIdIndex])

  useEffect(() => {
    if (isRuler) {
      cornerstoneTools.setToolActive("Length", {
        mouseButtonMask: 1,
      })
    } else {
      cornerstoneTools.setToolEnabled("Length")
    }
  }, [isRuler])

  const switchRuler = () => {
    if (isRuler) {
      setIsRuler(false)
    } else {
      setIsRuler(true)
    }
  }

  const clearMeasure = (e) => {
    const element = canvasRef.current
    const toolState = cornerstoneTools.getToolState(element, "Length")

    toolState.data = []
    cornerstone.updateImage(element)
  }

  return (
    <>
      <h1>Cornerstone Ajax</h1>
      <table>
        <thead>
          <tr>
            <th>Study Date</th>
            <th>Patient ID</th>
            <th>Name</th>
            <th>Age</th>
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
          e.preventDefault()
          return false
        }}
        onWheel={scrollSlice}
        onMouseDown={(e) => {
          if (e.button === 0 && !isRuler) {
            setShowCross(true)
          }
        }}
      >
        <NoduleCanvas
          imageSize={imageSize}
          x={parseInt(noduleCoord.x)}
          y={parseInt(noduleCoord.y)}
          radius={parseInt(noduleCoord.size)}
          scale={currentViewport.scale}
          viewX={currentViewport.x}
          viewY={currentViewport.y}
        />
        {/* <div
          className="circle"
          style={{
            position: "absolute",
            width: `${(
              (isNaN(noduleCoord.size) ? 50 : parseInt(noduleCoord.size)) *
              currentViewport.scale
            ).toFixed(2)}px`,
            height: `${(
              (isNaN(noduleCoord.size) ? 50 : parseInt(noduleCoord.size)) *
              currentViewport.scale
            ).toFixed(2)}px`,
            border: "2px solid rgb(0, 255, 0)",
            top: `${(
              imageSize / 2 +
              (currentViewport.y + parseInt(noduleCoord.y)) *
                currentViewport.scale
            ).toFixed(2)}px`,
            left: `${(
              imageSize / 2 +
              (currentViewport.x + parseInt(noduleCoord.x)) *
                currentViewport.scale
            ).toFixed(2)}px`,
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
          }}
        ></div> */}
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
            clearMeasure()
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
        <p>
          {"nodule X: "}
          <input
            type="text"
            value={noduleCoord.x}
            onChange={(e) => {
              let x = e.target.value
              setNoduleCoord({
                ...noduleCoord,
                x: x,
              })
            }}
            onBlur={(e) => {
              let x = e.target.value
              if (isNaN(x) || x === "") {
                x = 0
              }
              setNoduleCoord({
                ...noduleCoord,
                x: x,
              })
            }}
          ></input>
          {" nodule Y: "}
          <input
            type="text"
            value={noduleCoord.y}
            onChange={(e) => {
              let y = e.target.value
              setNoduleCoord({
                ...noduleCoord,
                y: y,
              })
            }}
            onBlur={(e) => {
              let y = e.target.value
              if (isNaN(y) || y === "") {
                y = 0
              }
              setNoduleCoord({
                ...noduleCoord,
                y: y,
              })
            }}
          ></input>
          {" size: "}
          <input
            type="text"
            value={noduleCoord.size}
            onChange={(e) => {
              setNoduleCoord({
                ...noduleCoord,
                size: e.target.value,
              })
            }}
            onBlur={(e) => {
              let y = e.target.value
              if (isNaN(y) || y === "") {
                y = 0
              }
              setNoduleCoord({
                ...noduleCoord,
                y: y,
              })
            }}
          ></input>
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
        <Link to="/">Home</Link>
      </div>
    </>
  )
}
