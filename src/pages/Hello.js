import React from "react";
import { Link } from "react-router-dom";

export default function Hello() {
  return (
    <div className="dicom-info">
      <h1>Cornerstone Viewer Examples</h1>
      <Link to="/viewer">Single Web Image</Link>
      <Link to="/dicomviewer">Single Dicom Image</Link>
      <Link to="/dicomviewerscroll">Dicom Image Stack</Link>
      <Link to="/dicomviewerstacktool">Dicom Image Tools</Link>
      <Link to="/cornerstoneajax">Dicom Image Ajax </Link>
      <Link to="/webajax">Web Image Ajax</Link>
    </div>
  );
}
