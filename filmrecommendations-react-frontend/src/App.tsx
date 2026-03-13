import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, type JSX } from "react";
import { useDispatch } from "react-redux";
import { checkAuthStatus, clearAuthState, setCredentials } from "./features/auth/authSlice";
import HomePage from "./pages/HomePage";
import MovieDetails from "./pages/MovieDetails";
import ProfilePage from "./pages/ProfilePage";
import type { AppDispatch } from "./app/store";
import { useAppSelector } from "./hooks/useAppSelector";
import { authService } from "./services/authService";
import { authSession } from "./services/authSession";

function App() {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, initialized } = useAppSelector((state) => state.auth);

  useEffect(() => {
    authSession.configure({
      refreshHandler: async () => {
        try {
          return await authService.refresh();
        } catch {
          return null;
        }
      },
      onAuthSuccess: (response) => {
        dispatch(setCredentials(response));
      },
      onAuthCleared: () => {
        dispatch(clearAuthState());
      }
    });

    dispatch(checkAuthStatus());
  }, [dispatch]);

  const RequireAuth = ({ children }: { children: JSX.Element }) => {
    if (!initialized) {
      return null;
    }

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
