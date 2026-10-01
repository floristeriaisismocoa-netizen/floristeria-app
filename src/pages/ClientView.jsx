import React, { useState, useEffect } from 'react';
import { createOrder, subscribeToProducts } from '../services/ordersService';

export function ClientView() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [recipient, setRecipient] = useState('');
  const [address, setAddress] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToProducts((data) => {
      setProducts(data);
    });
    return () => unsubscribe();
  }, []);

  const categories = ['Todos', 'Ramos', 'Desayunos', 'Pelunches', 'Mensajes'];

  const filteredProducts = selectedCategory === 'Todos'
    ? products
    : products.filter((p) => p.category === selectedCategory);

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

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        recipient,
        address,
        message,
        items: cart,
        total: calculateTotal(),
        status: 'pending', // Pasa a taller/cocina
        createdAt: new Date().toISOString(),
      };

      await createOrder(orderData);
      alert('¡Pedido realizado con éxito!');
      setCart([]);
      setRecipient('');
      setAddress('');
      setMessage('');
    } catch (error) {
      console.error('Error al crear el pedido:', error);
      alert('Hubo un error al enviar el pedido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid px-2 px-md-4 py-2">
      <h2 className="fw-bold mb-3">Catálogo de Productos</h2>

      {/* Contenedor de Categorías con scroll horizontal */}
      <div className="category-scroll mb-4">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`btn ${selectedCategory === cat ? 'btn-danger' : 'btn-outline-danger'} text-nowrap rounded-pill px-3`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="row g-3">
        {/* Catálogo de Productos */}
        <div className="col-12 col-lg-8">
          <div className="row g-3">
            {filteredProducts.map((product) => (
              <div key={product.id} className="col-12 col-sm-6 col-md-4">
                <div className="card h-100 shadow-sm border-0">
                  <img
                    src={product.imageUrl || 'https://via.placeholder.com/300'}
                    className="card-img-top object-fit-cover"
                    style={{ height: '180px' }}
                    alt={product.title}
                  />
                  <div className="card-body p-3 d-flex flex-column justify-content-between">
                    <div>
                      <h6 className="card-title fw-bold mb-1">{product.title}</h6>
                      <p className="fw-bold text-success fs-5 mb-2">${product.price}</p>
                    </div>
                    <button
                      onClick={() => addToCart(product)}
                      className="btn btn-outline-dark w-100 fw-bold"
                    >
                      🛒 Agregar al Carrito
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Carrito de Compras */}
        <div className="col-12 col-lg-4">
          <div className="card shadow-sm border-0 p-3 sticky-top" style={{ top: '80px' }}>
            <h4 className="fw-bold mb-3">Carrito de Compras</h4>
            {cart.length === 0 ? (
              <p className="text-muted">El carrito está vacío</p>
            ) : (
              <div>
                <ul className="list-group list-group-flush mb-3">
                  {cart.map((item) => (
                    <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center px-0">
                      <div>
                        <h6 className="mb-0 fw-bold">{item.title}</h6>
                        <small className="text-muted">${item.price} x {item.quantity}</small>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="btn btn-sm btn-outline-danger border-0"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="d-flex justify-content-between fw-bold fs-5 mb-3">
                  <span>Total:</span>
                  <span className="text-success">${calculateTotal()}</span>
                </div>

                <form onSubmit={handleCreateOrder}>
                  <div className="mb-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Nombre del destinatario"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Dirección de entrega"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <textarea
                      className="form-control"
                      placeholder="Mensaje de la tarjeta"
                      rows="2"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-success w-100 btn-lg fw-bold"
                  >
                    {loading ? 'Enviando...' : 'Confirmar Pedido'}
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