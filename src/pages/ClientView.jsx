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

  const isCajaOrAdmin = Boolean(user && (role === 'caja' || role === 'cajero' || role === 'admin'));

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(() => {
    return JSON.parse(localStorage.getItem('floristeria_cart') || '[]');
  });
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Estados Checkout Modal
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('TRANSFERENCIA');
  const [deliveryType, setDeliveryType] = useState('DOMICILIO');
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
    window.dispatchEvent(new Event('cartUpdated'));
  };

  useEffect(() => {
    const unsubscribe = subscribeToProducts((data) => {
      const mappedProducts = data.map((item) => ({
        id: item.id,
        name: item.title || item.name || 'Arreglo Floral',
        title: item.title || item.name || 'Arreglo Floral',
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

  // Abrir la pasarela cerrando primero el menú del carrito para liberar el foco del teclado
  const handleOpenCheckout = () => {
    const offcanvasElement = document.getElementById('cartOffcanvas');
    if (offcanvasElement) {
      // 1. Intentar cerrar via API de Bootstrap
      if (window.bootstrap && window.bootstrap.Offcanvas) {
        const bsOffcanvas = window.bootstrap.Offcanvas.getInstance(offcanvasElement) || new window.bootstrap.Offcanvas(offcanvasElement);
        bsOffcanvas.hide();
      }
      
      // 2. Ocultar elemento directamente por selector si aplica
      const closeBtn = offcanvasElement.querySelector('.btn-close');
      if (closeBtn) {
        closeBtn.click();
      }
    }

    // Mostrar el modal de la pasarela
    setShowCheckoutModal(true);
  };

  const filteredProducts = selectedCategory === 'Todos'
    ? products
    : products.filter((p) => p.category === selectedCategory);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const categories = ['Todos', 'Ramos', 'Desayunos', 'Peluches', 'Mensajes', 'Especiales'];

  const handleFinalizePayment = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setIsProcessing(true);
    try {
      const formattedItems = cart.map((item) => {
        const itemTitle = item.title || item.name || 'Arreglo Floral';
        return {
          id: item.id || '',
          title: itemTitle,
          name: itemTitle,
          quantity: Number(item.quantity) || 1,
          price: Number(item.price) || 0,
          image: item.image || (item.images && item.images[0]) || '',
          images: item.images && item.images.length > 0 ? item.images : [item.image]
        };
      });

      const orderData = {
        items: formattedItems,
        total: cartTotal,
        paymentMethod,
        deliveryType,
        customerName: customerName.trim() || (isCajaOrAdmin ? 'Cliente Tienda Física' : 'Cliente Web'),
        customerPhone: customerPhone.trim() || 'N/A',
        deliveryAddress: deliveryType === 'DOMICILIO' ? deliveryAddress.trim() : 'Retiro Presencial en Tienda',
        customNote: customNote.trim(),
        status: 'PENDIENTE_PREPARACION',
        createdBy: user ? user.email : 'cliente_web',
        isPhysicalStoreSale: Boolean(isCajaOrAdmin),
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);

      updateCart([]);
      setShowCheckoutModal(false);

      setCustomerName('');
      setCustomerPhone('');
      setDeliveryAddress('');
      setCustomNote('');

      navigate(`/rastreo/${docRef.id}`);
    } catch (error) {
      console.error('Error al procesar la venta:', error);
      alert('Error al registrar la transacción en la base de datos.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container-fluid px-4 py-4">
      {/* Encabezado del Catálogo */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h2 className="fw-bold mb-0 text-dark">Catálogo de Productos</h2>
          <p className="text-muted small mb-0">Selecciona tus arreglos florales y detalles favoritos</p>
        </div>

        {isCajaOrAdmin && (
          <span className="badge bg-success fs-6 px-3 py-2 rounded-pill shadow-sm">
            <i className="bi bi-cash-register me-1"></i> Punto de Venta (Caja Registradora)
          </span>
        )}
      </div>

      {/* Categorías */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`btn btn-sm ${
              selectedCategory === cat ? 'btn-danger fw-bold shadow-sm' : 'btn-outline-danger'
            } rounded-pill px-4 py-2`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid de Productos Completo (4 columnas) */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-danger" role="status"></div>
          <p className="mt-2 text-muted">Cargando catálogo de productos...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-5 bg-light rounded-4 border">
          <p className="text-muted mb-0">No hay productos disponibles en esta categoría.</p>
        </div>
      ) : (
        <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
          {filteredProducts.map((p) => (
            <div className="col" key={p.id}>
              <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden card-hover">
                <Link to={`/producto/${p.id}`}>
                  <img
                    src={p.image}
                    alt={p.name}
                    className="card-img-top"
                    style={{ height: '220px', objectFit: 'cover' }}
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
                    className="btn btn-outline-danger btn-sm w-100 rounded-3 fw-bold py-2 mt-2"
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

      {/* MENÚ LATERAL DESLIZANTE DEL CARRITO (OFFCANVAS) */}
      <div
        className="offcanvas offcanvas-end rounded-start-4 border-0 shadow-lg"
        tabIndex="-1"
        id="cartOffcanvas"
        aria-labelledby="cartOffcanvasLabel"
      >
        <div className="offcanvas-header bg-dark text-white p-3">
          <h5 className="offcanvas-title fw-bold d-flex align-items-center gap-2" id="cartOffcanvasLabel">
            <i className="bi bi-cart3 text-danger"></i>
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
              <h5 className="fw-bold">El carrito está vacío</h5>
              <p className="small">Agrega productos del catálogo para realizar tu compra.</p>
            </div>
          ) : (
            <>
              <div className="d-flex flex-column gap-2 overflow-auto mb-3 pe-1">
                {cart.map((item) => (
                  <div key={item.id} className="d-flex align-items-center justify-content-between bg-light p-2 rounded-3 border">
                    <div className="d-flex align-items-center gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="rounded"
                        style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                      />
                      <div>
                        <h6 className="mb-0 fw-bold text-dark fs-6">{item.name}</h6>
                        <small className="text-muted">
                          {item.quantity} x ${item.price.toLocaleString('es-CO')}
                        </small>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-danger p-1 text-decoration-none fw-bold fs-5"
                      onClick={() => removeFromCart(item.id)}
                      title="Eliminar producto"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className="border-top pt-3">
                <div className="d-flex justify-content-between align-items-center fw-bold mb-3">
                  <span className="fs-5">Total:</span>
                  <span className="text-danger fs-4">${cartTotal.toLocaleString('es-CO')}</span>
                </div>

                <button
                  type="button"
                  className="btn btn-danger w-100 fw-bold py-3 rounded-3 shadow-sm fs-6"
                  onClick={handleOpenCheckout}
                >
                  <i className="bi bi-credit-card-2-front me-2"></i>
                  Proceder al Pago
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* MODAL DE PASARELA DE PAGO */}
      {showCheckoutModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)', zIndex: 1070 }}
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

                        {isCajaOrAdmin && (
                          <div className="col-md-4">
                            <button
                              type="button"
                              className={`btn w-100 p-3 text-start border-2 rounded-3 ${
                                paymentMethod === 'EFECTIVO' ? 'btn-success fw-bold text-white' : 'btn-outline-success'
                              }`}
                              onClick={() => {
                                setPaymentMethod('EFECTIVO');
                                setDeliveryType('TIENDA');
                              }}
                            >
                              <i className="bi bi-cash-stack fs-4 d-block mb-1"></i>
                              <span>Pago en Efectivo (Caja)</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

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

                    <div className="col-md-6 mt-3">
                      <label className="form-label small fw-bold">Nombre del Cliente / Destinatario:</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ej: Cliente Mostrador / María Gómez"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
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
                        placeholder="Ej: ¡Feliz aniversario de parte de la familia!"
                        value={customNote}
                        onChange={(e) => setCustomNote(e.target.value)}
                      ></textarea>
                    </div>
                  </div>

                  <div className="bg-light p-3 rounded-3 mt-4 d-flex justify-content-between align-items-center">
                    <div>
                      <small className="text-muted d-block">Total Cobrado:</small>
                      <span className="fs-4 fw-bold text-danger">${cartTotal.toLocaleString('es-CO')}</span>
                    </div>
                    <span className="badge bg-secondary px-3 py-2">
                      Método: {paymentMethod === 'EFECTIVO' ? '💵 Efectivo (Caja)' : paymentMethod === 'TARJETA' ? '💳 Tarjeta' : '📲 Transferencia'}
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
                    {isProcessing ? 'Enviando a Taller...' : 'Confirmar Venta y Enviar a Taller'}
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