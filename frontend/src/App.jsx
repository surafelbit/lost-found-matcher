import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { api } from "./api";
import Home      from "./pages/Home";
import Submit    from "./pages/Submit";
import MyReports from "./pages/MyReports";
import Login     from "./pages/Login";
import Register  from "./pages/Register";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return children;
}

function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    const fetchUnread = async () => {
      const { data } = await api.getUnreadCount();
      if (data) setUnreadCount(data.count);
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 10000);
    return () => clearInterval(interval);
  }, [user, location.pathname]);

  const isAuthPage = ["/login", "/register"].includes(location.pathname);
  const isMatchesPage = location.pathname.startsWith("/matches");

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col">
      {/* TopNavBar Component from user's HTML */}
      {!isAuthPage && (
        <nav className="bg-surface dark:bg-on-background docked full-width top-0 border-b border-outline-variant dark:border-outline flat no shadows sticky z-50">
          <div className="flex justify-between items-center w-full px-gutter max-w-container-max mx-auto h-16">
            <div className="font-headline-md text-headline-md font-bold text-primary dark:text-primary-fixed-dim cursor-pointer" onClick={() => navigate("/")}>
              UniFound
            </div>
            <div className="hidden md:flex gap-md items-center">
              <NavLink to="/" className={({isActive}) => isActive ? "text-primary dark:text-primary-fixed-dim border-b-2 border-primary dark:border-primary-fixed-dim pb-1 font-label-md text-label-md active:scale-95 duration-150 transition-colors" : "text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-primary-fixed-dim font-label-md text-label-md hover:bg-surface-container-low dark:hover:bg-surface-container-highest transition-colors rounded-[0.25rem] px-2 py-1 active:scale-95 duration-150"}>Home</NavLink>
              <NavLink to="/my-reports" className={({isActive}) => isActive ? "text-primary dark:text-primary-fixed-dim border-b-2 border-primary dark:border-primary-fixed-dim pb-1 font-label-md text-label-md active:scale-95 duration-150 transition-colors" : "text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-primary-fixed-dim font-label-md text-label-md hover:bg-surface-container-low dark:hover:bg-surface-container-highest transition-colors rounded-[0.25rem] px-2 py-1 active:scale-95 duration-150"}>
                <div className="flex items-center gap-1.5 relative">
                  My Matches
                  {unreadCount > 0 && (
                    <div className="bg-red-500 text-white rounded-full h-4 w-4 flex items-center justify-center text-[9px] font-bold shadow-sm">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </div>
                  )}
                </div>
              </NavLink>
              <a className="text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-primary-fixed-dim font-label-md text-label-md hover:bg-surface-container-low dark:hover:bg-surface-container-highest transition-colors rounded-[0.25rem] px-2 py-1 active:scale-95 duration-150" href="#">Admin</a>
            </div>
            <div className="flex items-center gap-sm">
              <button className="text-on-surface-variant hover:text-primary p-2 rounded-full hover:bg-surface-container-low transition-colors active:scale-95 duration-150">
                <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 0"}}>notifications</span>
              </button>
              
              {user ? (
                <>
                  <button onClick={() => logout()} className="text-on-surface-variant hover:text-primary p-2 rounded-full hover:bg-surface-container-low transition-colors active:scale-95 duration-150 hidden md:flex" title="Logout">
                    <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 0"}}>logout</span>
                  </button>
                </>
              ) : (
                <button onClick={() => navigate('/login')} className="text-on-surface-variant hover:text-primary p-2 rounded-full hover:bg-surface-container-low transition-colors active:scale-95 duration-150 hidden md:flex">
                  <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 0"}}>account_circle</span>
                </button>
              )}

              <button onClick={() => navigate(user ? "/submit" : "/login")} className="bg-secondary-container text-on-secondary-fixed font-label-md text-label-md px-4 py-2 rounded-lg hover:bg-secondary-fixed-dim transition-colors active:scale-95 duration-150 shadow-sm ml-sm">
                Report Lost
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* Main Content Area */}
      {isAuthPage ? (
        <Routes>
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      ) : isMatchesPage ? (
        <div className="flex-1 flex overflow-hidden">
          <Routes>
            <Route path="/matches"     element={<Matches />} />
            <Route path="/matches/:id" element={<Matches />} />
          </Routes>
        </div>
      ) : (
        <div className="flex-1 w-full flex flex-col">
          <Routes>
            <Route path="/"            element={<Home />} />
            <Route path="/home"        element={<Home />} />
            <Route path="/submit"      element={<ProtectedRoute><div className="max-w-container-max mx-auto px-gutter py-xl w-full"><Submit /></div></ProtectedRoute>} />
            <Route path="/my-reports"  element={<ProtectedRoute><div className="max-w-container-max mx-auto px-gutter py-xl w-full"><MyReports /></div></ProtectedRoute>} />
          </Routes>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
}
