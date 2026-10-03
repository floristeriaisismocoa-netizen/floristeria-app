// src/pages/ClientView.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { subscribeToProducts } from '../services/productsService';

export function ClientView() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [loading, setLoading] = useState(true);

  // Escuchar productos en tiempo real desde Firebase
  useEffect(() => {
    const unsubscribe = subscribeToProducts((data) => {
      // Mapear los datos de Firebase al formato del cliente
      const mappedProducts = data.map((item) => ({
        id: item.id,
        name: item.title || item.name || 'Sin Nombre',
        price: Number(item.price) || 0,
        category: item.category || 'Ramos',
        description: item.description || '',
        image: item.images && item.images.length > 0 
          ? item.images[0] 
          : 'https://via.placeholder.com/300?text=Sin+Imagen'
      }));
      setProducts(mappedProducts);
      setLoading(false);
    });

    return () => unsubscribe && unsubscribe();
  }, []);

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const filteredProducts = selectedCategory === 'Todos'
    ? products
    : products.filter((p) => p.category === selectedCategory);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const categories = ['Todos', 'Ramos', 'Desayunos', 'Peluches', 'Mensajes', 'Especiales'];

  return (
    <div className="container py-4">
      <div className="row g-4">
        {/* Sección de Catálogo de Productos */}
        <div className="col-lg-8">
          <h2 className="fw-bold mb-3">Catálogo de Productos</h2>

          {/* Filtros por Categoría */}
          <div className="d-flex flex-wrap gap-2 mb-4">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`btn btn-sm ${
                  selectedCategory === cat
                    ? 'btn-danger fw-bold'
                    : 'btn-outline-danger'
                } rounded-pill px-3`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Estado de Carga */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-danger" role="status"></div>
              <p className="mt-2 text-muted">Cargando catálogo...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-5 bg-light rounded-3">
              <p className="text-muted mb-0">No hay productos disponibles en esta categoría.</p>
            </div>
          ) : (
            /* Grilla de Productos */
            <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3">
              {filteredProducts.map((p) => (
                <div className="col" key={p.id}>
                  <div className="card h-100 border-0 shadow-sm rounded-3 overflow-hidden">
                    <Link to={`/producto/${p.id}`}>
                      <img
                        src={p.image}
                        alt={p.name}
                        className="card-img-top"
                        style={{ height: '180px', objectFit: 'cover', cursor: 'pointer' }}
                      />
                    </Link>
                    <div className="card-body d-flex flex-column justify-content-between p-3">
                      <div>
                        <Link to={`/producto/${p.id}`} className="text-decoration-none text-dark">
                          <h6 className="fw-bold mb-1">{p.name}</h6>
                        </Link>
                        <p className="text-danger fw-bold fs-5 mb-2">
                          ${p.price.toLocaleString('es-CO')}
                        </p>
                      </div>
                      <button
                        className="btn btn-outline-danger btn-sm w-100 rounded-2 fw-bold"
                        onClick={() => addToCart(p)}
                      >
                        <i className="bi bi-cart-plus me-1"></i> Agregar al Carrito
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sección del Carrito de Compras */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded-3 p-3 sticky-top" style={{ top: '80px' }}>
            <h4 className="fw-bold mb-3">Carrito de Compras</h4>

            {cart.length === 0 ? (
              <p className="text-muted small mb-0">El carrito está vacío</p>
            ) : (
              <>
                <div className="d-flex flex-column gap-2 mb-3 max-vh-50 overflow-auto">
                  {cart.map((item) => (
                    <div key={item.id} className="d-flex align-items-center justify-content-between bg-light p-2 rounded">
                      <div className="d-flex align-items-center gap-2">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="rounded"
                          style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                        />
                        <div>
                          <p className="mb-0 small fw-bold">{item.name}</p>
                          <small className="text-muted">
                            {item.quantity} x ${item.price.toLocaleString('es-CO')}
                          </small>
                        </div>
                      </div>
                      <button
                        className="btn btn-sm btn-link text-danger p-0 ms-2"
                        onClick={() => removeFromCart(item.id)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <hr />

                <div className="d-flex justify-content-between align-items-center fw-bold mb-3">
                  <span>Total:</span>
                  <span className="text-danger fs-5">${cartTotal.toLocaleString('es-CO')}</span>
                </div>

                <button className="btn btn-danger w-100 fw-bold py-2 rounded-2">
                  Proceder al Pago
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}