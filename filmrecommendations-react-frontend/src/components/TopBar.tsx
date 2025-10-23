import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAppSelector } from "../hooks/useAppSelector";
import { useAppDispatch } from "../hooks/useAppDispatch";
import LoginModal from "./LoginModal";
import RegisterModal from "./RegisterModal";
import { logoutUser } from "../features/auth/authSlice";
// types now provided via typed hooks

const TopBar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  // track theme locally to re-render icon state if needed (icons are class-based)
  const [isDark, setIsDark] = useState<boolean | null>(null);

  const handleLogin = () => setShowLoginModal(true);
  const handleRegister = () => setShowRegisterModal(true);
  const handleLogout = () => dispatch(logoutUser());

  const switchToRegister = () => {
    setShowLoginModal(false);
    setShowRegisterModal(true);
  };

  const switchToLogin = () => {
    setShowRegisterModal(false);
    setShowLoginModal(true);
  };

  const closeModals = () => {
    setShowLoginModal(false);
    setShowRegisterModal(false);
  };

  // Initialize theme on mount based on saved preference or system setting
  useEffect(() => {
    try {
      const stored = localStorage.getItem("theme");
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      const shouldBeDark = stored === "dark" || (!stored && prefersDark);
      document.documentElement.classList.toggle("dark", shouldBeDark);
      setIsDark(shouldBeDark);
    } catch {
      // fallback: don't crash if storage is unavailable
      setIsDark(document.documentElement.classList.contains("dark"));
    }
  }, []);

  const toggleDarkMode = () => {
    const nowDark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", nowDark);
    setIsDark(nowDark);
    try {
      localStorage.setItem("theme", nowDark ? "dark" : "light");
    } catch {
      // ignore storage errors
    }
  };

  return (
    <>
      <div className="flex gap-3 absolute top-4 right-6 z-10">
        <div className="flex flex-wrap gap-3">
          {isAuthenticated ? (
            <>
              <div className="flex items-center text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                {user?.userName ? `Welcome back, ${user.userName}!` : "Welcome back!"}
              </div>
              <Link
                to="/profile"
                className="flex items-center rounded bg-indigo-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-indigo-500"
              >
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition-colors"
              >
                <div className="flex items-center">Sign Out</div>
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={handleLogin}
                className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded transition-colors"
              >
                <div className="flex items-center">Log in</div>
              </button>
              <button 
                onClick={handleRegister}
                className="bg-pink-600 hover:bg-pink-500 text-white font-semibold py-2 px-4 rounded transition-colors"
              >
                <div className="flex items-center">Create an account</div>
              </button>
            </>
          )}
        </div>
        
        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className="bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded ml-2 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 hidden dark:block"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4.22 1.78a1 1 0 011.42 1.42l-.71.71a1 1 0 01-1.42-1.42l.71-.71zM17 9a1 1 0 110 2h-1a1 1 0 110-2h1zM14.22 14.22a1 1 0 011.42 1.42l-.71.71a1 1 0 01-1.42-1.42l.71-.71zM10 15a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm-4.22-1.78a1 1 0 00-1.42 1.42l.71.71a1 1 0 001.42-1.42l-.71-.71zM3 9a1 1 0 100 2H2a1 1 0 100-2h1zm1.78-4.22a1 1 0 00-1.42 1.42l.71.71a1 1 0 001.42-1.42l-.71-.71zM10 6a4 4 0 100 8 4 4 0 000-8z" />
          </svg>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 block dark:hidden"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
            />
          </svg>
        </button>
      </div>

      {/* Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={closeModals}
        onSwitchToRegister={switchToRegister}
      />
      <RegisterModal
        isOpen={showRegisterModal}
        onClose={closeModals}
        onSwitchToLogin={switchToLogin}
      />
    </>
  );
};

export default TopBar;