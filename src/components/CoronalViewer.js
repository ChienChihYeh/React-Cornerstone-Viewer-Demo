import React, { useEffect, useRef, useState } from "react";
import cornerstone from "cornerstone-core";
import cornerstoneMath from "cornerstone-math";
import cornerstoneWebImageLoader from "cornerstone-web-image-loader";
import cornerstoneTools from "cornerstone-tools";
import Hammer from "hammerjs/hammer.js";
import "./../styles/styles.scss";
import { ZoomTool } from "cornerstone-tools";
import axios from "axios";

export default function CoronalViewer(props) {
  const [loadTool, setLoadTool] = useState(null);

  const [imageIds, setImageIds] = useState([]);
  const [currentImageIdIndex, setCurrentImageIdIndex] = useState(0);

  //tool switch state
  const [showCross, setShowCross] = useState(false);

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
  const imageId =
    "https://rawgit.com/cornerstonejs/cornerstoneWebImageLoader/master/examples/Renal_Cell_Carcinoma.jpg";

  useEffect(() => {
    cornerstoneTools.external.cornerstone = cornerstone; // set up Cornerstone Tools
    cornerstoneTools.external.cornerstoneMath = cornerstoneMath;
    cornerstoneWebImageLoader.external.cornerstone = cornerstone; // set up Cornerstone Web Image Loader
    cornerstoneTools.external.Hammer = Hammer;

    const element = coronalRef.current;
    cornerstone.enable(element); // enable the canvas with Cornerstone

    let formData = new FormData();
    formData.append("mode", "LungRads");
    formData.append("StudyDate", "20201205");
    formData.append("PatientID", "17918691");
    formData.append("AccessionNumber", "3924110977050");

    axios
      .post("http://10.20.19.148:18000/get_file_coronal", formData)
      .then((response) => {
        // console.log("coronal_image_path", response.data.path);
        setImageIds(response.data.path);
      })
      .catch((error) => {
        console.error("Error fetching coronal data:", error);
      });

    return () => {
      cornerstone.imageCache.purgeCache();
    };
  }, []);

  useEffect(() => {
    const element = coronalRef.current;
    if (imageIds.length > 0) {
      cornerstone.loadAndCacheImage(imageIds[0]).then((image) => {
        cornerstone.displayImage(element, image); // display the image on the canvas
        cornerstone.enable(element); // enable the canvas with Cornerstone

        setLoadTool(true); // enable
      });
    }
  }, [imageIds]);

  useEffect(() => {
    const element = coronalRef.current;

    cornerstoneTools.init();
    cornerstoneTools.addToolForElement(element, ZoomTool, {
      configuration: {
        invert: true,
        preventZoomOutsideImage: false,
        minScale: 1,
        maxScale: 20.0,
      },
    });
    cornerstoneTools.setToolActive("Zoom", {
      mouseButtonMask: 2,
    }); // activate ZoomTool with left mouse button
  }, [loadTool]);

  return (
    <>
      <div
        className="viewer"
        ref={coronalRef}
        onContextMenu={(e) => {
          e.preventDefault();
          return false;
        }}
      ></div>
    </>
  );
}
