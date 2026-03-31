import "@/App.css";
import "@/index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import CarSearchPage from "./pages/CarSearchPage";
import ResultPage from "./pages/ResultPage";
import CarEstimationPage2 from "./pages/CarEstimationPage2";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/car-search" element={<CarSearchPage />} />
        <Route path="/result-page" element={<ResultPage />} />
        <Route path="/car-estimation-page-2" element={<CarEstimationPage2 />} />
        {/* Legacy route redirect */}
        <Route path="/estimation" element={<CarSearchPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
