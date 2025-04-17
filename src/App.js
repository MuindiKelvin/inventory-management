import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import Dashboard from './components/Dashboard/Dashboard';
import AddProduct from './components/Dashboard/AddProduct';
import SearchProducts from './components/Dashboard/SearchProducts';
import PrintReceipts from './components/Dashboard/PrintReceipts';
import Navbar from './components/Layout/Navbar';
import Sidebar from './components/Layout/Sidebar';
import ParticlesBackground from './components/ParticlesBackground';
import SnowfallEffect from './components/SnowfallEffect'; // Add this import
import Loader from './components/Loader';
import { auth } from './firebase/firebaseConfig';
import { ClipLoader } from 'react-spinners';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('winter');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const toggleTheme = (selectedTheme) => {
    setTheme(selectedTheme);
  };

  if (loading) {
    return <Loader />;
  }

  const ProtectedRoute = ({ children }) => {
    return user ? (
      <div className="d-flex">
        <Sidebar toggleTheme={toggleTheme} theme={theme} />
        <div className="flex-grow-1">
          <Navbar />
          {children}
        </div>
      </div>
    ) : (
      <Navigate to="/" />
    );
  };

  return (
    <div className={`theme-${theme}`}>
      <ParticlesBackground />
      <SnowfallEffect theme={theme} /> {/* Add SnowfallEffect */}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      <Router>
        <Routes>
          <Route
            path="/"
            element={user ? <Navigate to="/dashboard" /> : <Login toggleTheme={toggleTheme} theme={theme} />}
          />
          <Route
            path="/signup"
            element={user ? <Navigate to="/dashboard" /> : <Signup toggleTheme={toggleTheme} theme={theme} />}
          />
          <Route
            path="/dashboard"
            element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
          />
          <Route
            path="/add-product"
            element={<ProtectedRoute><AddProduct /></ProtectedRoute>}
          />
          <Route
            path="/search-products"
            element={<ProtectedRoute><SearchProducts /></ProtectedRoute>}
          />
          <Route
            path="/print-receipts"
            element={<ProtectedRoute><PrintReceipts /></ProtectedRoute>}
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;