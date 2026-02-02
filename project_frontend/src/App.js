import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";

import Appone from "./pages/App";
import Home from "./pages/Home";
import FormRecords from "./pages/formrecords";
import Login from "./pages/Login";
import ProtectedRoute from "./pages/ProtectedRoutes";

function App() {
  const [message, setMessage] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);

    fetch("http://127.0.0.1:8000/api/hello/")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch from Django backend");
        }
        return res.json();
      })
      .then((data) => setMessage(data.message))
      .catch((err) => {
        console.error("Error fetching message:", err);
        setMessage("Failed to load message from backend.");
      });
  }, []);

  return (
    <Router>
      <AppLayout isAuthenticated={isAuthenticated} message={message} />
    </Router>
  );
}

function AppLayout({ isAuthenticated, message }) {
  return (
    <div style={{ fontFamily: "Arial" }}>
      {isAuthenticated && (
        <>
          <nav style={navStyles.container}>
            <div style={navStyles.left}>
              <Link to="/" style={navStyles.link}>App</Link>
              <Link to="/home" style={navStyles.link}>Home</Link>
              <Link to="/records" style={navStyles.link}>Records</Link>
            </div>
            <div style={navStyles.right}>
              <button
                onClick={() => {
                  localStorage.removeItem("token");
                  window.location.href = "/login";
                }}
                style={navStyles.logoutButton}
              >
                Logout
              </button>
            </div>
          </nav>
          <div style={{ padding: "20px" }}>
            <p>Backend says: {message}</p>
          </div>
        </>
      )}

      <Routes>
        <Route path="/" element={
          <ProtectedRoute>
            <Appone />
          </ProtectedRoute>
        } />
        <Route path="/home" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />
        <Route path="/records" element={
          <ProtectedRoute>
            <FormRecords />
          </ProtectedRoute>
        } />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} />} />
      </Routes>
    </div>
  );
}

const navStyles = {
  container: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#007bff",
    padding: "10px 20px",
    color: "white",
  },
  left: {
    display: "flex",
    gap: "15px",
  },
  right: {},
  link: {
    color: "white",
    textDecoration: "none",
    fontWeight: "bold",
  },
  logoutButton: {
    backgroundColor: "#ff4d4f",
    border: "none",
    padding: "8px 12px",
    borderRadius: "4px",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
  },
};

export default App;
