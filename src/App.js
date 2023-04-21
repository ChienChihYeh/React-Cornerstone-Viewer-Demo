import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Hello from "./pages/Hello";
import Viewer from "./pages/Viewer";
import DicomViewer from "./pages/DicomViewer";
import DicomViewerStack from "./pages/DicomViewerStack";
import DicomViewerScroll from "./pages/DicomViewerScroll";
import DicomViewerZoom from "./pages/DicomViewerZoom";
import DicomViewerXY from "./pages/DicomViewerXY";
import DicomViewerStackTool from "./pages/DicomViewerStackTool";
import CornerstoneAjax from "./pages/CornerstoneAjax";
// import Canvas from "./pages/simpleCanvas";
import WebImageAjax from "./pages/WebImageAjax";
import FlaskAjax from "./pages/FlaskAjax";
import AnnotationSample from "./pages/AnnotationSample";
// import CoordRange from "./pages/CoordRange";
import DicomList from "./pages/DicomList";
import "./styles/styles.scss";

function Navbar() {
  return (
    <nav>
      <ul>
        <li>
          <Link to="/">Home</Link>
        </li>
        {/* add more links here */}
      </ul>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Hello />} />
        <Route path="/viewer" element={<Viewer />} />
        {/* <Route path="/canvas" element={<Canvas />} /> */}
        <Route path="/dicomviewer" element={<DicomViewer />} />
        <Route path="/dicomviewerstack" element={<DicomViewerStack />} />
        <Route path="/dicomviewerscroll" element={<DicomViewerScroll />} />
        <Route path="/dicomviewerzoom" element={<DicomViewerZoom />} />
        <Route path="/dicomviewerxy" element={<DicomViewerXY />} />
        <Route
          path="/dicomviewerstacktool"
          element={<DicomViewerStackTool />}
        />
        <Route path="/cornerstoneajax" element={<CornerstoneAjax />} />
        <Route
          path="/cornerstoneajax/:studyDate/:patientID/:accessionNumber"
          element={<CornerstoneAjax />}
        />
        <Route path="/webajax" element={<WebImageAjax />} />
        <Route path="/flaskajax" element={<FlaskAjax />} />
        <Route path="/sample" element={<AnnotationSample />} />
        {/* <Route path="/range" element={<CoordRange />} /> */}
        <Route path="/list" element={<DicomList />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
