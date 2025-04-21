import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import Dashboard from './components/Dashboard/Dashboard';
import AddProduct from './components/Dashboard/AddProduct';
import ProductManagement from './components/Dashboard/ProductManagement';
import Sales from './components/Dashboard/Sales';
import Navbar from './components/Layout/Navbar';
import Sidebar from './components/Layout/Sidebar';
import ParticlesBackground from './components/ParticlesBackground';
import SnowfallEffect from './components/SnowfallEffect';
import Loader from './components/Loader';
import { auth } from './firebase/firebaseConfig';
import { ClipLoader } from 'react-spinners';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('forest-bloom');
  
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    
    // Set data-theme attribute for global CSS theme variables
    document.documentElement.setAttribute('data-theme', theme);
    
    return () => unsubscribe();
  }, [theme]);
  
  const toggleTheme = (selectedTheme) => {
    setTheme(selectedTheme);
    document.documentElement.setAttribute('data-theme', selectedTheme);
  };

  // Global theme styles
  const themeStyles = `
    :root[data-theme="neon-glow"] {
      --bs-body-bg: #151521;
      --bs-body-color: #f8f9fa;
      --bs-primary: #0dcaf0;
      --bs-secondary: #ff00ff;
      --bs-success: #20c997;
      --bs-card-bg: #1e1e30;
      --bs-btn-bg: #0dcaf0;
      --bs-btn-border-color: #0dcaf0;
    }

    :root[data-theme="forest-bloom"] {
      --bs-body-bg: #f8f9fa;
      --bs-body-color: #212529;
      --bs-primary: #28a745;
      --bs-secondary: #ffc107;
      --bs-success: #28a745;
      --bs-card-bg: #ffffff;
      --bs-btn-bg: #28a745;
      --bs-btn-border-color: #28a745;
    }

    [data-theme="neon-glow"] .app-container {
      background-color: #151521;
      color: #f8f9fa;
      min-height: 100vh;
    }

    [data-theme="neon-glow"] .card {
      background-color: #1e1e30;
      border: 1px solid rgba(13, 202, 240, 0.2);
      box-shadow: 0 0 15px rgba(13, 202, 240, 0.1);
    }

    [data-theme="neon-glow"] .btn-primary {
      background-color: #0dcaf0;
      border-color: #0dcaf0;
    }

    [data-theme="forest-bloom"] .app-container {
      background-color: #f8f9fa;
      color: #212529;
      min-height: 100vh;
    }

    [data-theme="forest-bloom"] .card {
      background-color: #ffffff;
      border: 1px solid rgba(40, 167, 69, 0.2);
      box-shadow: 0 0 15px rgba(40, 167, 69, 0.1);
    }

    [data-theme="forest-bloom"] .btn-primary {
      background-color: #28a745;
      border-color: #28a745;
    }

    .content-area {
      transition: padding 0.3s ease;
    }
  `;
  
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <ClipLoader color={theme === 'neon-glow' ? '#0dcaf0' : '#28a745'} size={50} />
      </div>
    );
  }
  
  const ProtectedRoute = ({ children }) => {
    return user ? (
      <div className="app-container">
        <style>{themeStyles}</style>
        {theme === 'neon-glow' && <ParticlesBackground />}
        <div className="d-flex flex-column flex-md-row min-vh-100">
          <div className="sidebar">
            <Sidebar toggleTheme={toggleTheme} theme={theme} />
          </div>
          <div className="content flex-grow-1 p-3 content-area">
            <Navbar user={user} theme={theme} />
            {children}
          </div>
        </div>
      </div>
    ) : (
      <Navigate to="/" />
    );
  };
  
  return (
    <Router>
      {theme === 'forest-bloom' && <SnowfallEffect />}
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={theme === 'neon-glow' ? 'dark' : 'light'}
      />
      <Routes>
        <Route path="/" element={
          user ? (
            <Navigate to="/dashboard" />
          ) : (
            <div className={`auth-container ${theme === 'neon-glow' ? 'dark-theme' : ''}`}>
              <style>{themeStyles}</style>
              {theme === 'neon-glow' && <ParticlesBackground />}
              <Login toggleTheme={toggleTheme} theme={theme} />
            </div>
          )
        } />
        <Route path="/signup" element={
          user ? (
            <Navigate to="/dashboard" />
          ) : (
            <div className={`auth-container ${theme === 'neon-glow' ? 'dark-theme' : ''}`}>
              <style>{themeStyles}</style>
              {theme === 'neon-glow' && <ParticlesBackground />}
              <Signup toggleTheme={toggleTheme} theme={theme} />
            </div>
          )
        } />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard theme={theme} /></ProtectedRoute>} />
        <Route path="/add-product" element={<ProtectedRoute><AddProduct theme={theme} /></ProtectedRoute>} />
        <Route path="/product-management" element={<ProtectedRoute><ProductManagement theme={theme} /></ProtectedRoute>} />
        <Route path="/sales" element={<ProtectedRoute><Sales theme={theme} /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;