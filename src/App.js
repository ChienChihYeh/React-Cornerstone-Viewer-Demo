import { BrowserRouter, Routes, Route } from "react-router-dom";
import Hello from "./pages/Hello";
import Viewer from "./pages/Viewer";
import DicomViewer from "./pages/DicomViewer";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Hello />} />
        <Route path="/viewer" element={<Viewer />} />
        <Route path="/dicomviewer" element={<DicomViewer />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
