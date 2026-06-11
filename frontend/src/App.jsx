import { Navigate, Outlet, Route, Routes } from "react-router-dom";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";

import Home from "./pages/Home";
import TemplateGallery from "./pages/TemplateGallery";
import TemplateBuilder from "./pages/TemplateBuilder";
import GenerateCard from "./pages/GenerateCard";
import GeneratedCards from "./pages/GeneratedCards";
import Login from "./pages/Login";
import Settings from "./pages/Settings";

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
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/templates" element={<TemplateGallery />} />
          <Route path="/builder" element={<TemplateBuilder />} />
          <Route path="/generate" element={<GenerateCard />} />
          <Route path="/generate/:templateId" element={<GenerateCard />} />
          <Route path="/cards" element={<GeneratedCards />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;