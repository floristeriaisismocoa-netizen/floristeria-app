import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export function Navbar() {
  const location = useLocation();

  return (
    <nav className="navbar navbar-expand-md navbar-dark bg-dark mb-3 shadow-sm sticky-top">
      <div className="container-fluid px-3">
        <Link className="navbar-brand fw-bold fs-4" to="/">
          🌸 Floristería
        </Link>
        <button 
          className="navbar-toggler border-0" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav" 
          aria-controls="navbarNav" 
          aria-expanded="false" 
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <div className="navbar-nav ms-auto gap-1 pt-2 pt-md-0">
            <Link 
              className={`nav-link px-3 rounded ${location.pathname === '/' ? 'active bg-primary fw-bold text-white' : ''}`} 
              to="/"
            >
              <i className="bi bi-shop me-2"></i>Cliente / Tienda
            </Link>
            <Link 
              className={`nav-link px-3 rounded ${location.pathname === '/taller' ? 'active bg-primary fw-bold text-white' : ''}`} 
              to="/taller"
            >
              <i className="bi bi-tools me-2"></i>Taller
            </Link>
            <Link 
              className={`nav-link px-3 rounded ${location.pathname === '/domicilios' ? 'active bg-primary fw-bold text-white' : ''}`} 
              to="/domicilios"
            >
              <i className="bi bi-truck me-2"></i>Domicilio
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}