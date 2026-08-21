import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ChatProvider } from "./context/ChatContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import VehicleDetail from "./pages/VehicleDetail";
import AssistantPage from "./pages/AssistantPage";
import Alerts from "./pages/Alerts";
import Analytics from "./pages/Analytics";
import Fleet from "./pages/Fleet";
import Settings from "./pages/Settings";
import Compare from "./pages/Compare";

function App() {
  return (
    <ChatProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/fleet" element={<Fleet />} />
            <Route path="/vehicles/:id" element={<VehicleDetail />} />
            <Route path="/assistant" element={<AssistantPage />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ChatProvider>
  );
}

export default App;