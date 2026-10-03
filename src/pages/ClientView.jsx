// src/pages/ClientView.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { subscribeToProducts } from '../services/productsService';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export function ClientView() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(() => {
    return JSON.parse(localStorage.getItem('floristeria_cart') || '[]');
  });
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Escuchar cambios en el carrito (sincronización con otras vistas)
  useEffect(() => {
    const syncCart = () => {
      const savedCart = JSON.parse(localStorage.getItem('floristeria_cart') || '[]');
      setCart(savedCart);
    };

    window.addEventListener('cartUpdated', syncCart);
    return () => window.removeEventListener('cartUpdated', syncCart);
  }, []);

  // Guardar cambios del carrito en localStorage
  const updateCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem('floristeria_cart', JSON.stringify(newCart));
  };

  useEffect(() => {
    const unsubscribe = subscribeToProducts((data) => {
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
    const existing = cart.find((item) => item.id === product.id);
    let updated;
    if (existing) {
      updated = cart.map((item) =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      updated = [...cart, { ...product, quantity: 1 }];
    }
    updateCart(updated);
  };

  const removeFromCart = (productId) => {
    updateCart(cart.filter((item) => item.id !== productId));
  };

  const filteredProducts = selectedCategory === 'Todos'
    ? products
    : products.filter((p) => p.category === selectedCategory);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const categories = ['Todos', 'Ramos', 'Desayunos', 'Peluches', 'Mensajes', 'Especiales'];

  // Función para procesar el pago y crear el pedido en Firebase
  const handleCheckout = async () => {
    console.log('--- BOTÓN PRESIONADO: INICIANDO PAGO ---');
    if (cart.length === 0) {
      console.log('El carrito está vacío, no se procesa la orden.');
      return;
    }

    setIsProcessing(true);
    try {
      console.log('Guardando orden en la colección "orders" de Firestore...', cart);
      
      const docRef = await addDoc(collection(db, 'orders'), {
        items: cart,
        total: cartTotal,
        status: 'en_taller',
        createdAt: serverTimestamp()
      });

      console.log('¡Orden guardada con éxito! ID:', docRef.id);
      
      // Vaciar carrito local
      updateCart([]);

      // Redirección al taller
      console.log('Redirigiendo a /taller...');
      navigate('/taller');
    } catch (error) {
      console.error('Error al procesar el pedido en Firestore:', error);
      alert('Ocurrió un error al procesar el pedido: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="row g-4">
        {/* Catálogo de Productos */}
        <div className="col-lg-8">
          <h2 className="fw-bold mb-3">Catálogo de Productos</h2>

          {/* Filtros de Categoría */}
          <div className="d-flex flex-wrap gap-2 mb-4">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`btn btn-sm ${
                  selectedCategory === cat ? 'btn-danger fw-bold' : 'btn-outline-danger'
                } rounded-pill px-3`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

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
                        type="button"
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

        {/* Carrito de Compras */}
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
                        type="button"
                        className="btn btn-sm btn-link text-danger p-0 ms-2 text-decoration-none fw-bold"
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

                <button 
                  type="button"
                  className="btn btn-danger w-100 fw-bold py-2 rounded-2"
                  onClick={handleCheckout}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Enviando a Taller...' : 'Proceder al Pago'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}