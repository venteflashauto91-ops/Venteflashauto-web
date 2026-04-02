import "@/App.css";
import "@/index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import CarSearchPage from "./pages/CarSearchPage";
import EstimationResultPage from "./pages/EstimationResultPage";
import CarEstimationPage2 from "./pages/CarEstimationPage2";
import AdminPage from "./pages/AdminPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/car-search" element={<CarSearchPage />} />
        <Route path="/estimation-result" element={<EstimationResultPage />} />
        <Route path="/car-estimation-page-2" element={<CarEstimationPage2 />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/estimation" element={<CarSearchPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
