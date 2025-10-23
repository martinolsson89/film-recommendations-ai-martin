import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { checkAuthStatus } from "./features/auth/authSlice";
import HomePage from "./pages/HomePage";
import MovieDetails from "./pages/MovieDetails";
import ProfilePage from "./pages/ProfilePage";
import type { AppDispatch } from "./app/store";
import { useAppSelector } from "./hooks/useAppSelector";

function App() {
  const dispatch = useDispatch<AppDispatch>();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    // Check if user is authenticated on app startup
    dispatch(checkAuthStatus());
  }, [dispatch]);

  const RequireAuth = ({ children }: { children: JSX.Element }) => {
    if (!isAuthenticated) {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/movies/:id" element={<MovieDetails />} />
      <Route
        path="/profile"
        element={
          <RequireAuth>
            <ProfilePage />
          </RequireAuth>
        }
      />
    </Routes>
  );
}

export default App;