import React, { useState, useEffect } from 'react';
import { createOrder, subscribeToProducts } from '../services/ordersService';

// Productos predeterminados de la floristería
const DEFAULT_PRODUCTS = [
  { id: '1', name: 'Ramo de 24 Rosas Rojas', price: 85000, category: 'Ramos', image: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=500&auto=format&fit=crop&q=60' },
  { id: '2', name: 'Desayuno Sorpresa Primavera', price: 110000, category: 'Desayunos', image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=500&auto=format&fit=crop&q=60' },
  { id: '3', name: 'Peluche Gigante de Oso', price: 95000, category: 'Peluches', image: 'https://images.unsplash.com/photo-1559454403-b8fb88521f11?w=500&auto=format&fit=crop&q=60' },
  { id: '4', name: 'Caja con Rosas y Mensaje', price: 75000, category: 'Mensajes', image: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=500&auto=format&fit=crop&q=60' }
];

export function ClientView() {
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [cart, setCart] = useState([]);
  const [customerInfo, setCustomerInfo] = useState({ name: '', address: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    // Escuchar si hay productos cargados en Firestore; si no, mantener los predeterminados
    const unsubscribe = subscribeToProducts((firestoreProducts) => {
      if (firestoreProducts && firestoreProducts.length > 0) {
        setProducts(firestoreProducts);
      }
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const updateQuantity = (id, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const filteredProducts =
    selectedCategory === 'Todos'
      ? products
      : products.filter((p) => p.category === selectedCategory);

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setSubmitting(true);
    setOrderSuccess(false);

    try {
      const orderData = {
        customer: customerInfo,
        items: cart,
        total: totalAmount,
        code: Math.random().toString(36).substring(2, 7).toUpperCase(),
      };

      await createOrder(orderData);

      setCart([]);
      setCustomerInfo({ name: '', address: '', phone: '' });
      setOrderSuccess(true);
    } catch (err) {
      console.error('Error al enviar pedido:', err);
      alert('Ocurrió un error al procesar el pedido.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-4">
      {orderSuccess && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>
          <strong>¡Pedido enviado con éxito!</strong> El pedido ya está en cola para el Taller.
          <button type="button" className="btn-close" onClick={() => setOrderSuccess(false)}></button>
        </div>
      )}

      <div className="row g-4">
        {/* Catálogo */}
        <div className="col-lg-8">
          <h2 className="fw-bold mb-3">Catálogo de Productos</h2>

          <div className="d-flex gap-2 mb-4 overflow-auto pb-2">
            {['Todos', 'Ramos', 'Desayunos', 'Peluches', 'Mensajes'].map((cat) => (
              <button
                key={cat}
                className={`btn rounded-pill px-3 ${
                  selectedCategory === cat ? 'btn-danger' : 'btn-outline-danger'
                }`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="row row-cols-1 row-cols-md-2 g-3">
            {filteredProducts.map((p) => (
              <div className="col" key={p.id}>
                <div className="card h-100 border-0 shadow-sm rounded-3 overflow-hidden">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="card-img-top"
                    style={{ height: '180px', objectFit: 'cover' }}
                  />
                  <div className="card-body d-flex flex-column justify-content-between">
                    <div>
                      <h6 className="fw-bold text-dark mb-1">{p.name}</h6>
                      <p className="text-danger fw-bold fs-5 mb-2">${p.price.toLocaleString()}</p>
                    </div>
                    <button
                      className="btn btn-outline-danger btn-sm w-100 rounded-2"
                      onClick={() => addToCart(p)}
                    >
                      <i className="bi bi-cart-plus me-1"></i> Agregar al Carrito
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Carrito y Datos de Envío */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded-3 p-3 sticky-top" style={{ top: '80px' }}>
            <h5 className="fw-bold mb-3">Carrito de Compras</h5>

            {cart.length === 0 ? (
              <p className="text-muted small">El carrito está vacío</p>
            ) : (
              <div>
                <ul className="list-group list-group-flush mb-3">
                  {cart.map((item) => (
                    <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center px-0">
                      <div>
                        <div className="fw-semibold small">{item.name}</div>
                        <div className="text-muted small">${(item.price * item.quantity).toLocaleString()}</div>
                      </div>
                      <div className="d-flex align-items-center gap-1">
                        <button className="btn btn-sm btn-light px-2" onClick={() => updateQuantity(item.id, -1)}>-</button>
                        <span className="small fw-bold px-1">{item.quantity}</span>
                        <button className="btn btn-sm btn-light px-2" onClick={() => updateQuantity(item.id, 1)}>+</button>
                        <button className="btn btn-sm text-danger ms-1" onClick={() => removeFromCart(item.id)}>
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="d-flex justify-content-between fw-bold fs-5 border-top pt-2 mb-3">
                  <span>Total:</span>
                  <span className="text-danger">${totalAmount.toLocaleString()}</span>
                </div>

                <form onSubmit={handleOrderSubmit}>
                  <h6 className="fw-bold text-dark small mb-2">Datos para el Envío:</h6>
                  <input
                    type="text"
                    className="form-control form-control-sm mb-2"
                    placeholder="Nombre del destinatario"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                    required
                  />
                  <input
                    type="text"
                    className="form-control form-control-sm mb-2"
                    placeholder="Dirección de entrega"
                    value={customerInfo.address}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                    required
                  />
                  <input
                    type="tel"
                    className="form-control form-control-sm mb-3"
                    placeholder="Teléfono de contacto"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                    required
                  />

                  <button
                    type="submit"
                    className="btn btn-danger w-100 py-2 rounded-2 fw-bold"
                    disabled={submitting}
                  >
                    {submitting ? 'Enviando...' : 'Confirmar y Enviar al Taller'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}