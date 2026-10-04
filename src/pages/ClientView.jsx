// src/pages/ClientView.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { subscribeToProducts } from '../services/productsService';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

export function ClientView() {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  // Verificar si la persona autenticada tiene permisos de Cajero/Admin
  const isCajaOrAdmin = Boolean(user && (role === 'caja' || role === 'cajero' || role === 'admin'));

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(() => {
    return JSON.parse(localStorage.getItem('floristeria_cart') || '[]');
  });
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Estados de la Pasarela de Pago Modal
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('TRANSFERENCIA'); // 'TRANSFERENCIA' | 'TARJETA' | 'EFECTIVO'
  const [deliveryType, setDeliveryType] = useState('DOMICILIO'); // 'DOMICILIO' | 'TIENDA'
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [customNote, setCustomNote] = useState('');

  useEffect(() => {
    const syncCart = () => {
      const savedCart = JSON.parse(localStorage.getItem('floristeria_cart') || '[]');
      setCart(savedCart);
    };

    window.addEventListener('cartUpdated', syncCart);
    return () => window.removeEventListener('cartUpdated', syncCart);
  }, []);

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
        images: item.images && item.images.length > 0 ? item.images : (item.image ? [item.image] : []),
        image: item.images && item.images.length > 0 
          ? item.images[0] 
          : (item.image || 'https://via.placeholder.com/300?text=Sin+Imagen')
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

  // Procesar la orden con la pasarela configurada
  const handleFinalizePayment = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setIsProcessing(true);
    try {
      const formattedItems = cart.map(item => ({
        ...item,
        title: item.title || item.name,
        images: item.images && item.images.length > 0 ? item.images : [item.image]
      }));

      // Determinar el estado inicial del pedido según la entrega
      const initialStatus = 'PENDIENTE_PREPARACION';

      const orderData = {
        items: formattedItems,
        total: cartTotal,
        paymentMethod, // 'TRANSFERENCIA', 'TARJETA', 'EFECTIVO'
        deliveryType,   // 'DOMICILIO', 'TIENDA'
        customerName: customerName.trim() || 'Cliente Mostrador',
        customerPhone: customerPhone.trim() || 'N/A',
        deliveryAddress: deliveryType === 'DOMICILIO' ? deliveryAddress.trim() : 'Retiro Presencial en Tienda',
        customNote: customNote.trim(),
        status: initialStatus,
        createdBy: user ? user.email : 'cliente_web',
        isPhysicalStoreSale: paymentMethod === 'EFECTIVO' || deliveryType === 'TIENDA',
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);

      updateCart([]);
      setShowCheckoutModal(false);
      navigate(`/rastreo/${docRef.id}`);
    } catch (error) {
      console.error('Error al procesar la compra:', error);
      alert('Error al registrar la transacción. Intenta nuevamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="row g-4">
        {/* Catálogo de Productos */}
        <div className="col-lg-8">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="fw-bold mb-0">Catálogo de Productos</h2>
            {isCajaOrAdmin && (
              <span className="badge bg-success fs-6 px-3 py-2 rounded-pill">
                <i className="bi bi-cash-register me-1"></i> Modo Caja Registradora
              </span>
            )}
          </div>

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
                  onClick={() => setShowCheckoutModal(true)}
                >
                  <i className="bi bi-credit-card-2-front me-2"></i>
                  Proceder al Pago
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* MODAL / PASARELA DE PAGO COMPLETA */}
      {showCheckoutModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)', zIndex: 1055 }}
          onClick={() => setShowCheckoutModal(false)}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header bg-dark text-white p-3">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-shield-check text-success me-2"></i>
                  Pasarela de Pago y Datos de Entrega
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowCheckoutModal(false)}
                ></button>
              </div>

              <form onSubmit={handleFinalizePayment}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    {/* Sección 1: Selección del Método de Pago */}
                    <div className="col-12">
                      <label className="form-label fw-bold text-dark">
                        1. Selecciona el Método de Pago:
                      </label>
                      <div className="row g-2">
                        <div className="col-md-4">
                          <button
                            type="button"
                            className={`btn w-100 p-3 text-start border-2 rounded-3 ${
                              paymentMethod === 'TRANSFERENCIA' ? 'btn-outline-danger active fw-bold' : 'btn-outline-secondary'
                            }`}
                            onClick={() => setPaymentMethod('TRANSFERENCIA')}
                          >
                            <i className="bi bi-qr-code-scan fs-4 d-block mb-1"></i>
                            <span>Transferencia Nequi / Daviplata</span>
                          </button>
                        </div>

                        <div className="col-md-4">
                          <button
                            type="button"
                            className={`btn w-100 p-3 text-start border-2 rounded-3 ${
                              paymentMethod === 'TARJETA' ? 'btn-outline-danger active fw-bold' : 'btn-outline-secondary'
                            }`}
                            onClick={() => setPaymentMethod('TARJETA')}
                          >
                            <i className="bi bi-credit-card fs-4 d-block mb-1"></i>
                            <span>Tarjeta Débito / Crédito</span>
                          </button>
                        </div>

                        {/* BOTÓN EXCLUSIVO PARA CAJA / ADMIN */}
                        {isCajaOrAdmin && (
                          <div className="col-md-4">
                            <button
                              type="button"
                              className={`btn w-100 p-3 text-start border-2 rounded-3 ${
                                paymentMethod === 'EFECTIVO' ? 'btn-success fw-bold text-white' : 'btn-outline-success'
                              }`}
                              onClick={() => {
                                setPaymentMethod('EFECTIVO');
                                setDeliveryType('TIENDA'); // Por defecto retiro en tienda si es pago presencial
                              }}
                            >
                              <i className="bi bi-cash-stack fs-4 d-block mb-1"></i>
                              <span>Pago en Efectivo (Caja)</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sección 2: Tipo de Entrega */}
                    <div className="col-12 mt-4">
                      <label className="form-label fw-bold text-dark">
                        2. Tipo de Entrega:
                      </label>
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className={`btn rounded-pill px-4 fw-bold ${
                            deliveryType === 'DOMICILIO' ? 'btn-danger' : 'btn-outline-secondary'
                          }`}
                          onClick={() => setDeliveryType('DOMICILIO')}
                        >
                          🛵 Envió a Domicilio
                        </button>
                        <button
                          type="button"
                          className={`btn rounded-pill px-4 fw-bold ${
                            deliveryType === 'TIENDA' ? 'btn-danger' : 'btn-outline-secondary'
                          }`}
                          onClick={() => setDeliveryType('TIENDA')}
                        >
                          🏪 Retiro Presencial en Tienda
                        </button>
                      </div>
                    </div>

                    {/* Sección 3: Datos del Cliente */}
                    <div className="col-md-6 mt-3">
                      <label className="form-label small fw-bold">Nombre del Cliente / Destinatario:</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ej: María Gómez"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="col-md-6 mt-3">
                      <label className="form-label small fw-bold">Teléfono de Contacto:</label>
                      <input
                        type="tel"
                        className="form-control"
                        placeholder="Ej: 3101234567"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        required
                      />
                    </div>

                    {deliveryType === 'DOMICILIO' && (
                      <div className="col-12 mt-2">
                        <label className="form-label small fw-bold">Dirección de Entrega:</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Ej: Carrera 5 # 10-20 Barrio Centro"
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          required
                        />
                      </div>
                    )}

                    <div className="col-12 mt-2">
                      <label className="form-label small fw-bold">Nota o Dedicatoria para la Tarjeta (Opcional):</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        placeholder="Ej: ¡Feliz cumpleaños te desea tu familia!"
                        value={customNote}
                        onChange={(e) => setCustomNote(e.target.value)}
                      ></textarea>
                    </div>
                  </div>

                  {/* Resumen Final */}
                  <div className="bg-light p-3 rounded-3 mt-4 d-flex justify-content-between align-items-center">
                    <div>
                      <small className="text-muted d-block">Total a Pagar:</small>
                      <span className="fs-4 fw-bold text-danger">${cartTotal.toLocaleString('es-CO')}</span>
                    </div>
                    <span className="badge bg-secondary px-3 py-2">
                      Método: {paymentMethod === 'EFECTIVO' ? '💵 Efectivo en Caja' : paymentMethod === 'TARJETA' ? '💳 Tarjeta' : '📲 Transferencia'}
                    </span>
                  </div>
                </div>

                <div className="modal-footer bg-light p-3">
                  <button
                    type="button"
                    className="btn btn-outline-secondary rounded-3"
                    onClick={() => setShowCheckoutModal(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={`btn ${paymentMethod === 'EFECTIVO' ? 'btn-success' : 'btn-danger'} rounded-3 px-4 fw-bold`}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Procesando Orden...' : 'Confirmar y Finalizar Pedido'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}