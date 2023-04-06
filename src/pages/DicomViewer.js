import React, { useEffect, useRef, useState } from "react";
import dicomParser from "dicom-parser";
import cornerstone from "cornerstone-core";
import cornerstoneWADOImageLoader from "cornerstone-wado-image-loader";
import cornerstoneMath from "cornerstone-math";
import cornerstoneTools from "cornerstone-tools";
import Hammer from "hammerjs";
import "./../styles/styles.scss";
import { ZoomTool, LengthTool } from "cornerstone-tools";

export default function DicomViewer(props) {
  const [loadTool, setLoadTool] = useState(null);

  const canvasRef = useRef(null);
  const element = canvasRef.current;
  const imageId =
    "wadouri:http://10.20.19.148:17000/dicom/serverRoot/data/DeepLungV1.1.0/upload_folder/20200824/17766041/3921110297050/024e3d8a.dcm";

  useEffect(() => {
    cornerstoneTools.external.cornerstone = cornerstone; // set up Cornerstone Tools
    cornerstoneTools.external.cornerstoneMath = cornerstoneMath;
    cornerstoneTools.external.Hammer = Hammer;
    // Image Loader
    cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
    cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

    const element = canvasRef.current;

    cornerstone.loadAndCacheImage(imageId).then((image) => {
      cornerstone.enable(element); // enable the canvas with Cornerstone
      cornerstone.displayImage(element, image); // display the image on the canvas

      setLoadTool(true); // enable
    });
  }, []);

  useEffect(() => {
    cornerstoneTools.init();
    cornerstoneTools.addToolForElement(element, ZoomTool);
    cornerstoneTools.addToolForElement(element, LengthTool);
    cornerstoneTools.setToolActive("Zoom", {
      mouseButtonMask: 2,
      minScale: 1,
      maxScale: 20.0,
      preventZoomOutsideImage: true,
    }); // activate ZoomTool with left mouse button

    cornerstoneTools.setToolActive("Length", {
      mouseButtonMask: 1,
    });
  }, [loadTool]);

  return (
    <>
      <h1>Cornerstone Dicom Viewer</h1>
      <div className="viewer" ref={canvasRef}></div>
    </>
  );
}
