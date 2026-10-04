// src/components/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Navbar() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Estado para el contador del carrito
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('floristeria_cart') || '[]');
      const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
      setCartCount(totalItems);
    };

    updateCartCount();
    window.addEventListener('cartUpdated', updateCartCount);
    window.addEventListener('storage', updateCartCount);

    return () => {
      window.removeEventListener('cartUpdated', updateCartCount);
      window.removeEventListener('storage', updateCartCount);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const isActive = (path) => location.pathname.startsWith(path) && (path !== '/' || location.pathname === '/');

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-3 py-2 shadow-sm sticky-top">
      <div className="container-fluid">
        {/* LOGO */}
        <Link className="navbar-brand d-flex align-items-center gap-2 fw-bold fs-4 me-4" to="/">
          <span role="img" aria-label="flor">🌸</span>
          <span style={{ color: '#ffffff' }}>Floristería</span>
        </Link>

        {/* BOTÓN CARRITO MOBILE & TOGGLER */}
        <div className="d-flex align-items-center gap-2 d-lg-none me-2">
          <button
            className="btn btn-outline-light position-relative rounded-circle border-0"
            data-bs-toggle="offcanvas"
            data-bs-target="#cartOffcanvas"
            aria-controls="cartOffcanvas"
          >
            <i className="bi bi-cart3 fs-4"></i>
            {cartCount > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        <button
          className="navbar-toggler border-0 shadow-none"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 gap-1">
            <li className="nav-item">
              <Link
                className={`nav-link px-3 rounded-2 fw-medium ${isActive('/') && location.pathname === '/' ? 'active bg-secondary bg-opacity-25' : ''}`}
                to="/"
              >
                🏠 Tienda
              </Link>
            </li>

            <li className="nav-item">
              <Link
                className={`nav-link px-3 rounded-2 fw-medium ${isActive('/rastreo') ? 'active bg-secondary bg-opacity-25 text-warning' : ''}`}
                to="/rastreo"
              >
                🔍 Rastrear Pedido
              </Link>
            </li>

            {user && (role === 'florist' || role === 'taller' || role === 'admin') && (
              <li className="nav-item">
                <Link
                  className={`nav-link px-3 rounded-2 fw-medium ${isActive('/taller') ? 'active bg-secondary bg-opacity-25' : ''}`}
                  to="/taller"
                >
                  ✂️ Taller
                </Link>
              </li>
            )}

            {user && (role === 'delivery' || role === 'domicilio' || role === 'admin') && (
              <li className="nav-item">
                <Link
                  className={`nav-link px-3 rounded-2 fw-medium ${isActive('/domicilios') ? 'active bg-secondary bg-opacity-25' : ''}`}
                  to="/domicilios"
                >
                  🚚 Domicilio
                </Link>
              </li>
            )}

            {user && role === 'admin' && (
              <li className="nav-item">
                <Link
                  className={`nav-link px-3 rounded-2 fw-medium ${isActive('/admin') ? 'active bg-primary text-white' : ''}`}
                  to="/admin"
                >
                  📦 Admin Productos
                </Link>
              </li>
            )}
          </ul>

          <div className="d-flex align-items-center gap-3">
            {/* BOTÓN DEL CARRITO DESKTOP */}
            <button
              className="btn btn-outline-light position-relative rounded-pill px-3 py-1 d-none d-lg-flex align-items-center gap-2 border-1"
              data-bs-toggle="offcanvas"
              data-bs-target="#cartOffcanvas"
              aria-controls="cartOffcanvas"
            >
              <i className="bi bi-cart3 fs-5"></i>
              <span className="fw-semibold">Carrito</span>
              {cartCount > 0 && (
                <span className="badge rounded-pill bg-danger ms-1">
                  {cartCount}
                </span>
              )}
            </button>

            {/* USUARIO & SESIÓN */}
            {user ? (
              <div className="d-flex align-items-center gap-2">
                <span className={`badge rounded-pill px-3 py-2 fw-bold ${
                  role === 'caja' || role === 'cajero'
                    ? 'bg-success text-white'
                    : role === 'admin'
                    ? 'bg-primary text-white'
                    : 'bg-secondary text-white'
                }`}>
                  <i className={`bi ${role === 'caja' || role === 'cajero' ? 'bi-cash-register' : 'bi-person-fill'} me-1`}></i>
                  {role === 'caja' || role === 'cajero' ? 'Caja Registradora' : role.toUpperCase()}
                </span>

                <button
                  onClick={handleLogout}
                  className="btn btn-outline-danger btn-sm d-flex align-items-center gap-2 px-3 py-2 border-1 rounded-3 fw-semibold shadow-none"
                >
                  <i className="bi bi-box-arrow-right fs-6"></i>
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="btn btn-danger btn-sm d-flex align-items-center gap-2 px-3 py-2 rounded-3 fw-semibold shadow-none text-white text-decoration-none"
              >
                <i className="bi bi-box-arrow-in-right fs-6"></i>
                <span>Iniciar Sesión</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;