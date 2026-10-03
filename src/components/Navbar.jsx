// src/components/Navbar.jsx
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const handleLogout = async () => {
    try {
      closeMenu();
      if (logout) await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-3 shadow-sm sticky-top">
      <div className="container-fluid px-3">
        {/* Marca / Logo */}
        <Link className="navbar-brand fw-bold fs-4 m-0 me-4" to="/" onClick={closeMenu}>
          🌸 Floristería
        </Link>
        
        {/* Botón Hamburguesa (solo visible en pantallas pequeñas / móviles) */}
        <button 
          className="navbar-toggler border-0 px-2" 
          type="button" 
          onClick={toggleMenu}
          aria-label="Abrir menú"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Menú desplegable móvil / Horizontal en escritorio */}
        <div className={`collapse navbar-collapse ${isOpen ? 'show' : ''}`} id="navbarContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 gap-1 pt-2 pt-lg-0">
            <li className="nav-item">
              <Link 
                className={`nav-link px-3 py-2 rounded text-white ${location.pathname === '/' ? 'bg-primary fw-bold' : ''}`} 
                to="/"
                onClick={closeMenu}
              >
                <i className="bi bi-shop me-2"></i>Tienda
              </Link>
            </li>

            {/* Accesos condicionales según el rol */}
            {(role === 'florist' || role === 'taller' || role === 'admin') && (
              <li className="nav-item">
                <Link 
                  className={`nav-link px-3 py-2 rounded text-white ${location.pathname === '/taller' ? 'bg-primary fw-bold' : ''}`} 
                  to="/taller"
                  onClick={closeMenu}
                >
                  <i className="bi bi-tools me-2"></i>Taller
                </Link>
              </li>
            )}

            {(role === 'delivery' || role === 'domicilio' || role === 'admin') && (
              <li className="nav-item">
                <Link 
                  className={`nav-link px-3 py-2 rounded text-white ${location.pathname === '/domicilios' ? 'bg-primary fw-bold' : ''}`} 
                  to="/domicilios"
                  onClick={closeMenu}
                >
                  <i className="bi bi-truck me-2"></i>Domicilio
                </Link>
              </li>
            )}

            {role === 'admin' && (
              <li className="nav-item">
                <Link 
                  className={`nav-link px-3 py-2 rounded text-white ${location.pathname === '/admin' ? 'bg-primary fw-bold' : ''}`} 
                  to="/admin"
                  onClick={closeMenu}
                >
                  <i className="bi bi-box-seam me-2"></i>Admin Productos
                </Link>
              </li>
            )}
          </ul>

          {/* Botón de Acceso / Cerrar Sesión */}
          <div className="d-flex align-items-center pt-2 pt-lg-0 border-top border-secondary border-lg-0">
            {user ? (
              <button 
                className="btn btn-outline-danger btn-sm fw-bold w-100 w-lg-auto px-3 py-2 text-white"
                onClick={handleLogout}
              >
                <i className="bi bi-box-arrow-right me-2"></i>Cerrar Sesión
              </button>
            ) : (
              <Link 
                className={`btn btn-danger btn-sm fw-bold w-100 w-lg-auto px-3 py-2 ${location.pathname === '/login' ? 'active' : ''}`} 
                to="/login"
                onClick={closeMenu}
              >
                <i className="bi bi-person-badge-fill me-2"></i>Acceso / Admin
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}