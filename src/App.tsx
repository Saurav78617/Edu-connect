import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AnimatePresence } from 'motion/react';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import MentorDashboard from './pages/MentorDashboard';
import Landing from './pages/Landing';
import Profile from './pages/Profile';
import Bookings from './pages/Bookings';
import CustomCursor from './components/CustomCursor';
import PageLoader from './components/PageLoader';
import BackgroundOrbs from './components/BackgroundOrbs';
import { useState, useEffect } from 'react';

const ProtectedRoute = ({ children, role }: { children: React.ReactNode, role?: string }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (role && user?.role !== role) return <Navigate to="/" />;
  return <>{children}</>;
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/student/*"
          element={
            <ProtectedRoute role="STUDENT">
              <Routes>
                <Route index element={<StudentDashboard />} />
                <Route path="profile" element={<Profile />} />
                <Route path="bookings" element={<Bookings />} />
              </Routes>
            </ProtectedRoute>
          }
        />

        <Route
          path="/mentor/*"
          element={
            <ProtectedRoute role="MENTOR">
              <Routes>
                <Route index element={<MentorDashboard />} />
                <Route path="profile" element={<Profile />} />
                <Route path="bookings" element={<Bookings />} />
              </Routes>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AnimatePresence>
  );
};

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <div className="min-h-screen bg-bg-primary relative overflow-hidden">
            <BackgroundOrbs />
            <AnimatePresence mode="wait">
              {isLoading && <PageLoader key="global-loader" />}
            </AnimatePresence>
            <CustomCursor />
            <AnimatedRoutes />
          </div>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}
