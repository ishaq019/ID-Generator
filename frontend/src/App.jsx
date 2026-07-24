import { Navigate, Outlet, Route, Routes } from "react-router-dom";

import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import TemplateGallery from "./pages/TemplateGallery";
import TemplateBuilder from "./pages/TemplateBuilder";
import GenerateCard from "./pages/GenerateCard";
import GeneratedCards from "./pages/GeneratedCards";

function AppLayout() {
  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
    </>
  );
}

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/templates" element={<TemplateGallery />} />
        <Route path="/builder" element={<TemplateBuilder />} />
        <Route path="/generate" element={<GenerateCard />} />
        <Route path="/generate/:templateId" element={<GenerateCard />} />
        <Route path="/cards" element={<GeneratedCards />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
