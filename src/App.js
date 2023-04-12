import { BrowserRouter, Routes, Route } from "react-router-dom";
import Hello from "./pages/Hello";
import Viewer from "./pages/Viewer";
import DicomViewer from "./pages/DicomViewer";
import DicomViewerStack from "./pages/DicomViewerStack";
import DicomViewerScroll from "./pages/DicomViewerScroll";
import DicomViewerZoom from "./pages/DicomViewerZoom";
import DicomViewerXY from "./pages/DicomViewerXY";
import DicomViewerStackTool from "./pages/DicomViewerStackTool";
import DicomViewerAjax from "./pages/DicomViewerAjax";
import CornerstoneAjax from "./pages/CornerstoneAjax";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Hello />} />
        <Route path="/viewer" element={<Viewer />} />
        <Route path="/dicomviewer" element={<DicomViewer />} />
        <Route path="/dicomviewerstack" element={<DicomViewerStack />} />
        <Route path="/dicomviewerscroll" element={<DicomViewerScroll />} />
        <Route path="/dicomviewerzoom" element={<DicomViewerZoom />} />
        <Route path="/dicomviewerxy" element={<DicomViewerXY />} />
        <Route
          path="/dicomviewerstacktool"
          element={<DicomViewerStackTool />}
        />
        <Route path="/dicomviewerajax" element={<DicomViewerAjax />} />
        <Route path="/cornerstoneajax" element={<CornerstoneAjax />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
