import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import StudentList from './pages/StudentList';
import StudentProfile from './pages/StudentProfile';
import MarksPrediction from './pages/MarksPrediction';
import PredictionHistory from './pages/PredictionHistory';
import Analytics from './pages/Analytics';
import ModelInfo from './pages/ModelInfo';
import Settings from './pages/Settings';

const AppLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = (pathname) => {
    if (pathname.includes('/dashboard')) return 'Academic Performance Dashboard';
    if (pathname.includes('/students/')) return 'Student Academic Profile';
    if (pathname.includes('/students')) return 'Student Cohort Directory';
    if (pathname.includes('/predict')) return 'Marks Prediction Engine';
    if (pathname.includes('/history')) return 'Prediction History Archive';
    if (pathname.includes('/analytics')) return 'Analytics & Model Reports';
    if (pathname.includes('/model-info')) return 'Machine Learning Architecture';
    if (pathname.includes('/settings')) return 'Application Settings';
    return 'Gradelytics';
  };

  return (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} title={getPageTitle(location.pathname)} />
        <main style={{ flex: 1 }}>{children}</main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/students"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <StudentList />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/students/:id"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <StudentProfile />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/predict"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <MarksPrediction />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <PredictionHistory />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Analytics />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/model-info"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ModelInfo />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Settings />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Fallback route */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
