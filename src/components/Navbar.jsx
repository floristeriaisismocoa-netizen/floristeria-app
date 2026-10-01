// src/components/Navbar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export function Navbar() {
  const location = useLocation();

  return (
    <nav className="navbar navbar-expand navbar-dark bg-dark shadow-sm py-2">
      <div className="container">
        {/* Marca / Logo */}
        <Link className="navbar-brand fw-bold d-flex align-items-center" to="/">
          <span className="me-2 fs-4">🌸</span>
          Floristería
        </Link>

        {/* Enlaces de Navegación */}
        <div className="navbar-nav ms-auto gap-2">
          <Link 
            className={`nav-link fw-semibold ${location.pathname === '/' ? 'active text-white' : ''}`} 
            to="/"
          >
            Cliente / Tienda
          </Link>

          <Link 
            className={`nav-link fw-semibold ${location.pathname === '/taller' || location.pathname === '/cocina' ? 'active text-white' : ''}`} 
            to="/taller"
          >
            Taller
          </Link>

          <Link 
            className={`nav-link fw-semibold ${location.pathname === '/domicilios' ? 'active text-white' : ''}`} 
            to="/domicilios"
          >
            Domicilio
          </Link>
        </div>
      </div>
    </nav>
  );
}