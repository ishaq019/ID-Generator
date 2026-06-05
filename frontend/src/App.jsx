import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import TemplateGallery from "./pages/TemplateGallery";
import TemplateBuilder from "./pages/TemplateBuilder";
import GenerateCard from "./pages/GenerateCard";
import GeneratedCards from "./pages/GeneratedCards";

function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/templates" element={<TemplateGallery />} />
          <Route path="/builder" element={<TemplateBuilder />} />
          <Route path="/generate" element={<GenerateCard />} />
          <Route path="/generate/:templateId" element={<GenerateCard />} />
          <Route path="/cards" element={<GeneratedCards />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
