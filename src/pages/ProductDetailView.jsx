// src/pages/ProductDetailView.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { subscribeToProducts } from '../services/productsService';

export function ProductDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToProducts((products) => {
      const found = products.find((p) => p.id === id);
      if (found) {
        setProduct({
          id: found.id,
          name: found.title || found.name || 'Sin nombre',
          price: Number(found.price) || 0,
          category: found.category || 'Ramos',
          description: found.description || 'Sin descripción disponible.',
          code: found.sku || found.code || '',
          images: found.images && found.images.length > 0 
            ? found.images 
            : (found.image ? [found.image] : ['https://via.placeholder.com/500?text=Sin+Imagen'])
        });
      }
      setLoading(false);
    });
    return () => unsubscribe && unsubscribe();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;

    const savedCart = JSON.parse(localStorage.getItem('floristeria_cart') || '[]');
    const existingIndex = savedCart.findIndex((item) => item.id === product.id);

    const itemToAdd = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0]
    };

    if (existingIndex > -1) {
      savedCart[existingIndex].quantity += quantity;
    } else {
      savedCart.push({ ...itemToAdd, quantity });
    }

    localStorage.setItem('floristeria_cart', JSON.stringify(savedCart));
    window.dispatchEvent(new Event('cartUpdated'));

    // Abrir automáticamente el Offcanvas del Carrito
    const cartElement = document.getElementById('cartOffcanvas');
    if (cartElement) {
      if (window.bootstrap && window.bootstrap.Offcanvas) {
        const bsOffcanvas = window.bootstrap.Offcanvas.getOrCreateInstance(cartElement);
        bsOffcanvas.show();
      } else {
        const triggerBtn = document.getElementById('desktopCartTrigger') || document.getElementById('mobileCartTrigger');
        if (triggerBtn) triggerBtn.click();
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-dark min-vh-100 d-flex flex-column align-items-center justify-content-center text-center py-5">
        <div className="spinner-border text-success" role="status"></div>
        <p className="mt-2 text-muted">Cargando producto...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-dark text-white min-vh-100 d-flex flex-column align-items-center justify-content-center text-center py-5">
        <i className="bi bi-exclamation-circle display-1 text-secondary mb-3"></i>
        <h4 className="fw-bold">Producto no encontrado</h4>
        <button className="btn btn-outline-success mt-3 rounded-pill px-4 fw-bold" onClick={() => navigate('/')}>
          <i className="bi bi-arrow-left me-2"></i>Volver a la tienda
        </button>
      </div>
    );
  }

  return (
    <div className="bg-dark text-white min-vh-100 py-4" style={{ backgroundColor: '#121212' }}>
      <div className="container" style={{ maxWidth: '1000px' }}>
        <button 
          className="btn btn-outline-light rounded-pill px-4 py-2 mb-4 border-secondary d-inline-flex align-items-center gap-2 fw-semibold"
          onClick={() => navigate(-1)}
        >
          <i className="bi bi-arrow-left fs-5"></i>
          <span>Volver al Catálogo</span>
        </button>

        <div className="row g-4 bg-black p-4 rounded-4 shadow-lg border border-secondary" style={{ backgroundColor: '#181818' }}>
          <div className="col-md-6 d-flex flex-column align-items-center">
            <div className="position-relative w-100 mb-3 text-center d-flex align-items-center justify-content-center bg-dark rounded-3 border border-secondary" style={{ height: '380px' }}>
              <img
                src={product.images[selectedImageIndex]}
                alt={product.name}
                className="img-fluid rounded-3"
                style={{ maxHeight: '100%', objectFit: 'contain' }}
              />

              {product.images.length > 1 && (
                <>
                  <button
                    className="btn btn-dark bg-opacity-75 text-white position-absolute top-50 start-0 translate-middle-y rounded-circle ms-2 shadow border border-secondary"
                    onClick={() => setSelectedImageIndex((prev) => (prev === 0 ? product.images.length - 1 : prev - 1))}
                    style={{ width: '40px', height: '40px' }}
                  >
                    ‹
                  </button>
                  <button
                    className="btn btn-dark bg-opacity-75 text-white position-absolute top-50 end-0 translate-middle-y rounded-circle me-2 shadow border border-secondary"
                    onClick={() => setSelectedImageIndex((prev) => (prev === product.images.length - 1 ? 0 : prev + 1))}
                    style={{ width: '40px', height: '40px' }}
                  >
                    ›
                  </button>
                </>
              )}
            </div>

            {product.images.length > 1 && (
              <div className="d-flex gap-2 overflow-auto w-100 justify-content-center py-2">
                {product.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`Thumb-${idx}`}
                    className={`rounded-3 border ${selectedImageIndex === idx ? 'border-success border-2 shadow' : 'border-secondary opacity-50'}`}
                    style={{ width: '60px', height: '60px', objectFit: 'cover', cursor: 'pointer' }}
                    onClick={() => setSelectedImageIndex(idx)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="col-md-6 d-flex flex-column justify-content-between">
            <div>
              <h2 className="fw-bold text-white mb-2">{product.name}</h2>
              <h3 className="fw-bold text-success display-6 mb-3">
                ${product.price.toLocaleString('es-CO')}
              </h3>

              {product.code && (
                <p className="text-secondary small mb-2">
                  <strong className="text-light">Referencia / SKU:</strong> {product.code}
                </p>
              )}

              <p className="text-secondary small mb-3">
                <strong className="text-light">Categoría:</strong>{' '}
                <span className="badge bg-success bg-opacity-25 text-success border border-success ms-1 text-uppercase">
                  {product.category}
                </span>
              </p>

              <hr className="my-3 border-secondary" />

              <h6 className="fw-bold text-light small mb-2 text-uppercase">Detalles y Características:</h6>
              <p className="text-secondary small lh-lg">{product.description}</p>
            </div>

            <div className="mt-4">
              <div className="mb-3">
                <label className="form-label small fw-bold text-secondary text-uppercase">Cantidad:</label>
                <div className="input-group" style={{ width: '140px' }}>
                  <button 
                    className="btn btn-outline-secondary text-light btn-sm px-3" 
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    -
                  </button>
                  <span className="form-control form-control-sm text-center fw-bold bg-black text-white border-secondary">
                    {quantity}
                  </span>
                  <button 
                    className="btn btn-outline-secondary text-light btn-sm px-3" 
                    onClick={() => setQuantity((q) => q + 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                className="btn btn-success w-100 py-3 rounded-3 fw-bold text-uppercase shadow-lg d-flex align-items-center justify-content-center gap-2 fs-6"
                onClick={handleAddToCart}
              >
                <i className="bi bi-cart-plus-fill fs-5"></i>
                <span>Agregar al Carrito</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}