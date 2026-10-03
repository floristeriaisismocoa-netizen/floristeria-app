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
  const [added, setAdded] = useState(false);

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
          code: found.code || '',
          images: found.images && found.images.length > 0 
            ? found.images 
            : ['https://via.placeholder.com/500']
        });
      }
      setLoading(false);
    });
    return () => unsubscribe && unsubscribe();
  }, [id]);

  if (loading) {
    return (
      <div className="container text-center py-5">
        <div className="spinner-border text-danger" role="status"></div>
        <p className="mt-2 text-muted">Cargando producto...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container text-center py-5">
        <h4>Producto no encontrado</h4>
        <button className="btn btn-outline-danger mt-3 rounded-pill px-4" onClick={() => navigate('/')}>
          Volver a la tienda
        </button>
      </div>
    );
  }

  const handleAddToCart = () => {
    // Leer el carrito actual guardado en localStorage
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

    // Guardar en localStorage y despachar evento para refrescar en ClientView
    localStorage.setItem('floristeria_cart', JSON.stringify(savedCart));
    window.dispatchEvent(new Event('cartUpdated'));

    // Feedback visual momentáneo
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="container py-4" style={{ maxWidth: '1000px' }}>
      {/* Botón Volver Estilizado */}
      <button 
        className="btn btn-light shadow-sm rounded-pill px-3 py-1 mb-4 border d-inline-flex align-items-center gap-2 fw-semibold text-secondary"
        onClick={() => navigate(-1)}
        style={{ transition: 'all 0.2s ease' }}
      >
        <span className="fs-5 lh-1">←</span>
        <span>Volver a la tienda</span>
      </button>

      <div className="row g-4 bg-white p-4 rounded-4 shadow-sm border">
        {/* Columna Izquierda: Galería */}
        <div className="col-md-6 d-flex flex-column align-items-center">
          <div className="position-relative w-100 mb-3 text-center d-flex align-items-center justify-content-center" style={{ height: '380px' }}>
            <img
              src={product.images[selectedImageIndex]}
              alt={product.name}
              className="img-fluid rounded-3 shadow-sm"
              style={{ maxHeight: '100%', objectFit: 'contain' }}
            />

            {product.images.length > 1 && (
              <>
                <button
                  className="btn btn-white bg-white shadow position-absolute top-50 start-0 translate-middle-y rounded-circle ms-2"
                  onClick={() => setSelectedImageIndex((prev) => (prev === 0 ? product.images.length - 1 : prev - 1))}
                  style={{ width: '38px', height: '38px' }}
                >
                  ‹
                </button>
                <button
                  className="btn btn-white bg-white shadow position-absolute top-50 end-0 translate-middle-y rounded-circle me-2"
                  onClick={() => setSelectedImageIndex((prev) => (prev === product.images.length - 1 ? 0 : prev + 1))}
                  style={{ width: '38px', height: '38px' }}
                >
                  ›
                </button>
              </>
            )}
          </div>

          {/* Miniaturas */}
          {product.images.length > 1 && (
            <div className="d-flex gap-2 overflow-auto w-100 justify-content-center py-2">
              {product.images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Thumb-${idx}`}
                  className={`rounded-3 border ${selectedImageIndex === idx ? 'border-danger border-2 shadow-sm' : 'opacity-75'}`}
                  style={{ width: '60px', height: '60px', objectFit: 'cover', cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => setSelectedImageIndex(idx)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Columna Derecha: Info */}
        <div className="col-md-6 d-flex flex-column justify-content-between">
          <div>
            <h2 className="fw-bold text-dark mb-1">{product.name}</h2>
            <h3 className="fw-bold text-danger fs-2 mb-3">
              ${product.price.toLocaleString('es-CO')}
            </h3>

            {product.code && (
              <p className="text-muted small mb-2">
                <strong>Referencia:</strong> {product.code}
              </p>
            )}

            <p className="text-muted small mb-3">
              <strong>Categoría:</strong> <span className="badge bg-danger bg-opacity-10 text-danger border border-danger-subtle ms-1">{product.category}</span>
            </p>

            <hr className="my-3 opacity-25" />

            <h6 className="fw-bold text-dark small mb-1">Descripción:</h6>
            <p className="text-secondary small">{product.description}</p>
          </div>

          {/* Cantidad y Botón */}
          <div className="mt-4">
            <div className="mb-3">
              <label className="form-label small fw-bold text-muted">Cantidad:</label>
              <div className="input-group" style={{ width: '130px' }}>
                <button 
                  className="btn btn-outline-secondary btn-sm px-3" 
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  -
                </button>
                <span className="form-control form-control-sm text-center fw-bold bg-white">
                  {quantity}
                </span>
                <button 
                  className="btn btn-outline-secondary btn-sm px-3" 
                  onClick={() => setQuantity((q) => q + 1)}
                >
                  +
                </button>
              </div>
            </div>

            <button
              className={`btn ${added ? 'btn-success' : 'btn-danger'} w-100 py-3 rounded-3 fw-bold text-uppercase shadow-sm d-flex align-items-center justify-content-center gap-2`}
              onClick={handleAddToCart}
              style={{ transition: 'all 0.3s ease' }}
            >
              <span>{added ? '✓ ¡Agregado al Carrito!' : '🛒 Agregar al Carrito'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}