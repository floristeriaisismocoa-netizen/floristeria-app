// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ClientView } from './pages/ClientView';
import { KitchenView } from './pages/KitchenView';
import { DeliveryView } from './pages/DeliveryView';
import { LoginView } from './pages/LoginView'; // Crearemos esta vista sencilla

// Componente para proteger rutas privadas por rol
function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, loading } = useAuth();

  if (loading) return <div className="text-center my-5">Cargando verificación de acceso...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/" replace />;

  return children;
}

// Navbar interna actualizada con soporte de usuario y logout
function NavigationBar() {
  const location = useLocation();
  const { user, role, logout } = useAuth();

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4 shadow-sm">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">
          🌸 Floristería
        </Link>
        <div className="navbar-nav ms-auto gap-2 align-items-center">
          <Link 
            className={`nav-link ${location.pathname === '/' ? 'active fw-bold' : ''}`} 
            to="/"
          >
            Cliente / Tienda
          </Link>
          
          <Link 
            className={`nav-link ${location.pathname === '/taller' ? 'active fw-bold' : ''}`} 
            to="/taller"
          >
            Taller
          </Link>
          
          <Link 
            className={`nav-link ${location.pathname === '/domicilios' ? 'active fw-bold' : ''}`} 
            to="/domicilios"
          >
            Domicilio
          </Link>

          {user ? (
            <div className="d-flex align-items-center gap-2 ms-3">
              <span className="badge bg-secondary text-uppercase">{role || 'Personal'}</span>
              <button onClick={logout} className="btn btn-outline-danger btn-sm">
                Salir
              </button>
            </div>
          ) : (
            <Link className="btn btn-outline-light btn-sm ms-2" to="/login">
              Acceso Personal
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <NavigationBar />

        <Routes>
          {/* Ruta pública */}
          <Route path="/" element={<ClientView />} />
          <Route path="/login" element={<LoginView />} />

          {/* Rutas protegidas */}
          <Route 
            path="/taller" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'taller']}>
                <KitchenView />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/domicilios" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'domicilio']}>
                <DeliveryView />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}