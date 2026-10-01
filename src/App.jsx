// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ClientView } from './pages/ClientView';
import { KitchenView } from './pages/KitchenView';
import { DeliveryView } from './pages/DeliveryView';

// Componente Navbar interno para detectar la ruta activa
function NavigationBar() {
  const location = useLocation();

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4 shadow-sm">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">
          🌸 Floristería
        </Link>
        <div className="navbar-nav ms-auto gap-2">
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
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <Router>
      <NavigationBar />

      <Routes>
        <Route path="/" element={<ClientView />} />
        <Route path="/taller" element={<KitchenView />} />
        <Route path="/domicilios" element={<DeliveryView />} />
      </Routes>
    </Router>
  );
} 