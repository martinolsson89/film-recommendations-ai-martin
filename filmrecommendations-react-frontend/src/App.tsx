import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { checkAuthStatus } from "./features/auth/authSlice";
import HomePage from "./pages/HomePage";
import MovieDetails from "./pages/MovieDetails";
import ProfilePage from "./pages/ProfilePage";
import type { AppDispatch } from "./app/store";

function App() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    // Check if user is authenticated on app startup
    dispatch(checkAuthStatus());
  }, [dispatch]);

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/movies/:id" element={<MovieDetails />} />
      <Route path="/profile" element={<ProfilePage />} />
    </Routes>
  );
}

export default App;