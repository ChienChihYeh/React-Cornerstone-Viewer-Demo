import React from "react";
import { Link } from "react-router-dom";

export default function Hello() {
  return (
    <div className="dicom-info">
      <h1>Cornerstone Viewer Examples</h1>
      <Link to="/viewer">
        <h3>Single Web Image</h3>
      </Link>
      <Link to="/dicomviewer">
        <h3>Single Dicom Image</h3>
      </Link>
      <Link to="/dicomviewerscroll">
        <h3>Dicom Image Stack</h3>
      </Link>
      <Link to="/dicomviewerstacktool">
        <h3>Dicom Image Tool</h3>
      </Link>
      <Link to="/cornerstoneajax">
        <h3>Dicom Image Ajax</h3>
      </Link>
      <Link to="/webajax">
        <h3>Web Image Ajax</h3>
      </Link>
      <Link to="/flaskajax">
        <h3>Flask Ajax: For Flask Only</h3>
      </Link>
      <Link to="/sample">
        <h3>Create Your Annotation Here!</h3>
      </Link>
      {/* <Link to="/range">
        <h3>Test coordinates range limit</h3>
      </Link> */}
    </div>
  );
}
