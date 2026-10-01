import React, { useState } from 'react';
import { createOrder } from '../services/ordersService';

const INITIAL_PRODUCTS = [
  { 
    id: '1', 
    title: 'Ramo de 24 Rosas Rojas', 
    category: 'Ramos', 
    price: 120000, 
    img: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=500&q=80' 
  },
  { 
    id: '2', 
    title: 'Desayuno Sorpresa Especial', 
    category: 'Desayunos', 
    price: 85000, 
    img: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=500&q=80' 
  },
  { 
    id: '3', 
    title: 'Oso de Peluche Gigante', 
    category: 'Peluches', 
    price: 60000, 
    img: 'https://images.unsplash.com/photo-1559454403-b8fb88521f11?auto=format&fit=crop&w=500&q=80' 
  },
  { 
    id: '4', 
    title: 'Tarjeta con Mensaje Personalizado', 
    category: 'Mensajes', 
    price: 15000, 
    img: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=500&q=80' 
  },
];

export function ClientView() {
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', address: '', note: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const addToCart = (product) => {
    setCart(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return alert('El carrito está vacío');

    setIsSubmitting(true);

    const orderData = {
      items: cart,
      total,
      customNote: customerInfo.note,
      customer: {
        name: customerInfo.name,
        phone: customerInfo.phone,
        deliveryAddress: customerInfo.address
      },
      payment: {
        method: 'EN_LINEA_O_TIENDA',
        status: 'APROBADO'
      }
    };

    try {
      await createOrder(orderData);
      setOrderSuccess(true);
      setCart([]);
      setCustomerInfo({ name: '', phone: '', address: '', note: '' });
    } catch (error) {
      console.error('Error al enviar pedido:', error);
      alert('Ocurrió un error al procesar el pedido. Revisa la consola.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = selectedCategory === 'Todos' 
    ? INITIAL_PRODUCTS 
    : INITIAL_PRODUCTS.filter(p => p.category === selectedCategory);

  return (
    <div className="container py-4">
      {orderSuccess && (
        <div className="alert alert-success alert-dismissible fade show text-center" role="alert">
          <h4 className="alert-heading fw-bold">¡Pago Exitoso y Pedido Recibido!</h4>
          <p>Tu pedido ha sido enviado al taller. El equipo de bodega ya lo tiene en lista de espera.</p>
          <button type="button" className="btn-close" onClick={() => setOrderSuccess(false)}></button>
        </div>
      )}

      <div className="row g-4">
        {/* Catálogo de Productos */}
        <div className="col-12 col-lg-8">
          <h3 className="fw-bold mb-3">Catálogo de Productos</h3>
          
          <div className="btn-group mb-4 w-100 flex-wrap" role="group">
            {['Todos', 'Ramos', 'Desayunos', 'Peluches', 'Mensajes'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`btn ${selectedCategory === cat ? 'btn-danger' : 'btn-outline-danger'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="row row-cols-1 row-cols-sm-2 g-3">
            {filteredProducts.map(product => (
              <div key={product.id} className="col">
                <div className="card h-100 shadow-sm border-0">
                  <img src={product.img} className="card-img-top" alt={product.title} style={{ height: '200px', objectFit: 'cover' }} />
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title fw-bold">{product.title}</h5>
                    <p className="card-text text-muted mb-3">${product.price.toLocaleString('es-CO')}</p>
                    <button 
                      onClick={() => addToCart(product)} 
                      className="btn btn-outline-dark mt-auto fw-bold"
                    >
                      <i className="bi bi-cart-plus me-2"></i>Agregar al Carrito
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Carrito y Formulario */}
        <div className="col-12 col-lg-4">
          <div className="card shadow-sm border-0 sticky-top" style={{ top: '20px' }}>
            <div className="card-body">
              <h4 className="card-title fw-bold mb-3">
                <i className="bi bi-bag-check me-2"></i>Tu Pedido
              </h4>

              {cart.length === 0 ? (
                <p className="text-muted text-center py-4">El carrito está vacío</p>
              ) : (
                <>
                  <ul className="list-group list-group-flush mb-3">
                    {cart.map(item => (
                      <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center px-0">
                        <div>
                          <span className="fw-bold">{item.quantity}x</span> {item.title}
                          <div className="text-muted small">${(item.price * item.quantity).toLocaleString('es-CO')}</div>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} className="btn btn-sm btn-outline-danger border-0">
                          <i className="bi bi-trash"></i>
                        </button>
                      </li>
                    ))}
                  </ul>

                  <div className="d-flex justify-content-between fw-bold fs-5 mb-3">
                    <span>Total:</span>
                    <span className="text-success">${total.toLocaleString('es-CO')}</span>
                  </div>

                  <form onSubmit={handleCheckout}>
                    <div className="mb-2">
                      <input 
                        type="text" 
                        placeholder="Nombre completo" 
                        required 
                        className="form-control"
                        value={customerInfo.name}
                        onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})}
                      />
                    </div>
                    <div className="mb-2">
                      <input 
                        type="tel" 
                        placeholder="Teléfono / WhatsApp" 
                        required 
                        className="form-control"
                        value={customerInfo.phone}
                        onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})}
                      />
                    </div>
                    <div className="mb-2">
                      <input 
                        type="text" 
                        placeholder="Dirección de entrega" 
                        required 
                        className="form-control"
                        value={customerInfo.address}
                        onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})}
                      />
                    </div>
                    <div className="mb-3">
                      <textarea 
                        placeholder="Mensaje de dedicación o nota especial..." 
                        className="form-control"
                        rows="2"
                        value={customerInfo.note}
                        onChange={e => setCustomerInfo({...customerInfo, note: e.target.value})}
                      ></textarea>
                    </div>

                    <button 
                      type="submit" 
                      disabled={isSubmitting} 
                      className="btn btn-danger btn-lg w-100 fw-bold"
                    >
                      {isSubmitting ? 'Procesando...' : 'Pagar y Enviar Pedido'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}