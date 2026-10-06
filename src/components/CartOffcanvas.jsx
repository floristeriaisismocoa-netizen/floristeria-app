// src/components/CartOffcanvas.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function CartOffcanvas() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(() => {
    return JSON.parse(localStorage.getItem('floristeria_cart') || '[]');
  });

  useEffect(() => {
    const syncCart = () => {
      const savedCart = JSON.parse(localStorage.getItem('floristeria_cart') || '[]');
      setCart(savedCart);
    };

    window.addEventListener('cartUpdated', syncCart);
    window.addEventListener('storage', syncCart);
    return () => {
      window.removeEventListener('cartUpdated', syncCart);
      window.removeEventListener('storage', syncCart);
    };
  }, []);

  const updateCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem('floristeria_cart', JSON.stringify(newCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const removeFromCart = (productId) => {
    updateCart(cart.filter((item) => item.id !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleProceedToCheckout = () => {
    // Cerrar el offcanvas
    const offcanvasElement = document.getElementById('cartOffcanvas');
    if (offcanvasElement) {
      const closeBtn = offcanvasElement.querySelector('.btn-close');
      if (closeBtn) closeBtn.click();
    }
    // Ir a la tienda / checkout
    navigate('/', { state: { openCheckout: true } });
  };

  return (
    <div
      className="offcanvas offcanvas-end bg-black text-white border-start border-secondary"
      tabIndex="-1"
      id="cartOffcanvas"
      aria-labelledby="cartOffcanvasLabel"
    >
      <div className="offcanvas-header bg-dark border-bottom border-secondary p-3">
        <h5 className="offcanvas-title fw-bold text-success d-flex align-items-center gap-2" id="cartOffcanvasLabel">
          <i className="bi bi-cart3"></i>
          <span>Carrito de Compras</span>
        </h5>
        <button
          type="button"
          className="btn-close btn-close-white"
          data-bs-dismiss="offcanvas"
          aria-label="Close"
        ></button>
      </div>

      <div className="offcanvas-body d-flex flex-column justify-content-between p-3">
        {cart.length === 0 ? (
          <div className="text-center py-5 my-auto text-muted">
            <i className="bi bi-cart-x display-1 text-secondary d-block mb-3"></i>
            <h5 className="fw-bold text-light">Tu carrito está vacío</h5>
            <p className="small">Selecciona los detalles de tu agrado para agregarlos.</p>
          </div>
        ) : (
          <>
            <div className="d-flex flex-column gap-2 overflow-auto mb-3 pe-1">
              {cart.map((item) => (
                <div key={item.id} className="d-flex align-items-center justify-content-between bg-dark p-2 rounded-3 border border-secondary">
                  <div className="d-flex align-items-center gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="rounded"
                      style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                    />
                    <div>
                      <h6 className="mb-0 fw-bold text-white fs-6">{item.name}</h6>
                      <small className="text-success fw-bold">
                        {item.quantity} x ${item.price.toLocaleString('es-CO')}
                      </small>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-link text-danger p-1 text-decoration-none fw-bold fs-5"
                    onClick={() => removeFromCart(item.id)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="border-top border-secondary pt-3">
              <div className="d-flex justify-content-between align-items-center fw-bold mb-3">
                <span className="fs-5 text-light">Total:</span>
                <span className="text-success fs-4">${cartTotal.toLocaleString('es-CO')}</span>
              </div>

              <button
                type="button"
                className="btn btn-success w-100 fw-bold py-3 rounded-3 shadow fs-6 text-uppercase"
                onClick={handleProceedToCheckout}
              >
                <i className="bi bi-credit-card-2-front me-2"></i>
                Proceder al Pago
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}