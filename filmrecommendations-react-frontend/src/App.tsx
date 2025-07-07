import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
// import OtherPage from "./pages/OtherPage"; // Example for more pages

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      {/* <Route path="/other" element={<OtherPage />} /> */}
    </Routes>
  );
}

export default App;