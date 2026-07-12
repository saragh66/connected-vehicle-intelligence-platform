import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import VehicleDetail from "./pages/VehicleDetail";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/vehicles/:id" element={<VehicleDetail />} />
      </Routes>
    </BrowserRouter>
  );
}


export default App;