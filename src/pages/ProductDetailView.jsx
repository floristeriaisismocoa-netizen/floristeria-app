// src/pages/ProductDetailView.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { subscribeToProducts } from '../services/productsService';

export function ProductDetailView({ onAddToCart }) {
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
        <button className="btn btn-outline-danger mt-3" onClick={() => navigate('/')}>
          Volver a la tienda
        </button>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart({ ...product, quantity });
    }
  };

  return (
    <div className="container py-4" style={{ maxWidth: '1000px' }}>
      <button 
        className="btn btn-link text-decoration-none text-muted mb-3 p-0"
        onClick={() => navigate(-1)}
      >
        <i className="bi bi-arrow-left me-1"></i> Volver
      </button>

      <div className="row g-4 bg-white p-4 rounded-3 shadow-sm">
        {/* Columna Izquierda: Galería de Imágenes */}
        <div className="col-md-6 d-flex flex-column align-items-center">
          <div className="position-relative w-100 mb-3 text-center" style={{ minHeight: '350px' }}>
            <img
              src={product.images[selectedImageIndex]}
              alt={product.name}
              className="img-fluid rounded-3"
              style={{ maxHeight: '420px', objectFit: 'contain' }}
            />

            {/* Flechas del carrusel si hay más de 1 imagen */}
            {product.images.length > 1 && (
              <>
                <button
                  className="btn btn-light position-absolute top-50 start-0 translate-middle-y rounded-circle shadow-sm"
                  onClick={() => setSelectedImageIndex((prev) => (prev === 0 ? product.images.length - 1 : prev - 1))}
                >
                  ❮
                </button>
                <button
                  className="btn btn-light position-absolute top-50 end-0 translate-middle-y rounded-circle shadow-sm"
                  onClick={() => setSelectedImageIndex((prev) => (prev === product.images.length - 1 ? 0 : prev + 1))}
                >
                  ❯
                </button>
              </>
            )}
          </div>

          {/* Miniaturas de imágenes */}
          {product.images.length > 1 && (
            <div className="d-flex gap-2 overflow-auto w-100 justify-content-center py-2">
              {product.images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Thumb-${idx}`}
                  className={`rounded border ${selectedImageIndex === idx ? 'border-danger border-2' : ''}`}
                  style={{ width: '60px', height: '60px', objectFit: 'cover', cursor: 'pointer' }}
                  onClick={() => setSelectedImageIndex(idx)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Columna Derecha: Detalles e Interacción */}
        <div className="col-md-6 d-flex flex-column justify-content-between">
          <div>
            <h2 className="fw-bold text-dark mb-2">{product.name}</h2>
            <h3 className="fw-bold text-danger mb-3">
              ${product.price.toLocaleString('es-CO')}
            </h3>

            {product.code && (
              <p className="text-muted small mb-2">
                <strong>Referencia:</strong> {product.code}
              </p>
            )}

            <p className="text-muted small mb-3">
              <strong>Categoría:</strong> <span className="badge bg-light text-dark border">{product.category}</span>
            </p>

            <hr />

            <h6 className="fw-bold small">Descripción:</h6>
            <p className="text-secondary small">{product.description}</p>
          </div>

          {/* Selección de cantidad y botón Agregar */}
          <div className="mt-4">
            <div className="mb-3">
              <label className="form-label small fw-bold">Cantidad:</label>
              <div className="d-flex align-items-center gap-2" style={{ maxWidth: '140px' }}>
                <button 
                  className="btn btn-outline-secondary btn-sm px-3" 
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  -
                </button>
                <span className="fw-bold px-2">{quantity}</span>
                <button 
                  className="btn btn-outline-secondary btn-sm px-3" 
                  onClick={() => setQuantity((q) => q + 1)}
                >
                  +
                </button>
              </div>
            </div>

            <button
              className="btn btn-danger w-100 py-2 rounded-2 fw-bold text-uppercase"
              onClick={handleAddToCart}
            >
              <i className="bi bi-cart-plus me-2"></i> Agregar al Carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}