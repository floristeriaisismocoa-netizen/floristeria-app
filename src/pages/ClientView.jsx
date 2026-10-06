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

  // Estado inicial NULL (Sin categoría ni subcategoría seleccionada por defecto)
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
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

  // Manejo del Historial para el botón 'Atrás' en celulares
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.category) {
        setSelectedCategory(event.state.category);
        setSelectedSubCategory(event.state.subCategory || null);
      } else {
        setSelectedCategory(null);
        setSelectedSubCategory(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const selectServiceCategory = (catId, subCatId = null) => {
    setSelectedCategory(catId);
    setSelectedSubCategory(subCatId);

    // Guardar estado en el historial para interceptar el botón Atrás del celular
    window.history.pushState({ category: catId, subCategory: subCatId }, '', '');
  };

  const handleBackToMenu = () => {
    setSelectedCategory(null);
    setSelectedSubCategory(null);
    if (window.history.state && window.history.state.category) {
      window.history.back();
    }
  };

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
        category: (item.category || 'RAMOS').toUpperCase(),
        subCategory: item.subCategory ? item.subCategory.toUpperCase() : null,
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

  const handleOpenCheckout = () => {
    const offcanvasElement = document.getElementById('cartOffcanvas');
    if (offcanvasElement) {
      const closeBtn = offcanvasElement.querySelector('.btn-close');
      if (closeBtn) closeBtn.click();
    }
    setShowCheckoutModal(true);
  };

  // Filtrado estricto por categoría y subcategoría
  const filteredProducts = selectedCategory
    ? products.filter((p) => {
        if (selectedCategory === 'RAMOS') {
          if (!selectedSubCategory) return false; // Si no ha presionado ninguna variedad de Ramos, no muestra productos
          return (
            p.category === 'RAMOS' &&
            (p.subCategory === selectedSubCategory || p.name.toUpperCase().includes(selectedSubCategory))
          );
        }
        return p.category.includes(selectedCategory);
      })
    : [];

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Lista de Servicios Principales
  const services = [
    { id: 'RAMOS', label: 'RAMOS', icon: '🌹', desc: 'Naturales, Eternos y Fúnebres', hasSubmenu: true },
    { id: 'DESAYUNOS', label: 'DESAYUNOS', icon: '🍳', desc: 'Sorpresas matutinas deliciosas' },
    { id: 'PELUCHES', label: 'PELUCHES', icon: '🧸', desc: 'Detalles afelpados y tiernos' },
    { id: 'CHOCOLATES', label: 'CHOCOLATES', icon: '🍫', desc: 'Cajas de golosinas y bombones' },
    { id: 'GLOBOS', label: 'GLOBOS', icon: '🎈', desc: 'Arreglos y decoraciones con helio' },
    { id: 'CORONAS', label: 'CORONAS', icon: '👑', desc: 'Tiaras y coronas finas de cristal' },
    { id: 'MARIPOSAS', label: 'MARIPOSAS', icon: '🦋', desc: 'Detalles con mariposas luminosas' },
    { id: 'ESPECIALES', label: 'ESPECIALES', icon: '✨', desc: 'Diseños únicos e inolvidables' }
  ];

  // Variedades de Ramos (sin selección automática)
  const ramosSubcategories = [
    { id: 'NATURALES', label: 'RAMOS NATURALES' },
    { id: 'ETERNOS', label: 'RAMOS ETERNOS' },
    { id: 'FUNEBRES', label: 'RAMOS FÚNEBRES' }
  ];

  const handleFinalizePayment = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setIsProcessing(true);
    try {
      const formattedItems = cart.map((item) => ({
        id: item.id || '',
        title: item.title || item.name,
        name: item.title || item.name,
        quantity: Number(item.quantity) || 1,
        price: Number(item.price) || 0,
        image: item.image || (item.images && item.images[0]) || '',
        images: item.images && item.images.length > 0 ? item.images : [item.image]
      }));

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
      console.error('Error al procesar venta:', error);
      alert('Error al procesar la venta en la base de datos.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-dark text-white min-vh-100 pb-5" style={{ backgroundColor: '#121212' }}>
      
      {/* BANNER HERO DE BIENVENIDA */}
      <div className="bg-black py-4 px-3 text-center border-bottom border-success border-opacity-25 shadow">
        <div className="container" style={{ maxWidth: '850px' }}>
          <img
            src="/logotipo.jpeg"
            alt="Floristería Isis Logo"
            className="rounded-circle border border-2 border-success shadow-lg mb-2"
            style={{ width: '110px', height: '110px', objectFit: 'cover' }}
            onError={(e) => (e.target.style.display = 'none')}
          />
          <h1 className="fw-bold display-6 text-success mb-2 text-uppercase tracking-wider">
            ¡BIENVENIDOS A FLORISTERÍA ISIS!
          </h1>
          <h3 className="fs-5 text-light fw-normal mb-2">
            ¿En qué te podemos servir hoy?
          </h3>
          <p className="text-secondary small text-uppercase fw-semibold tracking-wide border-top border-secondary pt-2 mb-0 d-inline-block">
            ESTE ES NUESTRO DESPLIEGUE DE SERVICIOS DE NUESTRA TIENDA
          </p>
        </div>
      </div>

      <div className="container px-4 py-4">
        {/* INDICADOR MODO CAJA */}
        {isCajaOrAdmin && (
          <div className="d-flex justify-content-end mb-3">
            <span className="badge bg-success fs-6 px-4 py-2 rounded-pill shadow">
              <i className="bi bi-cash-register me-2"></i> Modo Punto de Venta (Caja)
            </span>
          </div>
        )}

        {/* 1. SI NO HAY CATEGORÍA SELECCIONADA */}
        {!selectedCategory ? (
          <div>
            <div className="text-center mb-4">
              <h4 className="fw-bold text-success text-uppercase">Elige el servicio que requieres:</h4>
              <p className="text-muted small">Haz clic sobre la categoría para ver los productos disponibles</p>
            </div>

            <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-3">
              {services.map((srv) => (
                <div className="col" key={srv.id}>
                  <div
                    className="card h-100 border-secondary bg-black rounded-4 p-4 text-center cursor-pointer service-card shadow-lg hover-border-success"
                    style={{ backgroundColor: '#181818', cursor: 'pointer', transition: 'transform 0.2s' }}
                    onClick={() => selectServiceCategory(srv.id)}
                  >
                    <div className="display-4 mb-2">{srv.icon}</div>
                    <h5 className="fw-bold text-white text-uppercase mb-1">{srv.label}</h5>
                    <small className="text-muted">{srv.desc}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* 2. SI HAY CATEGORÍA SELECCIONADA */
          <div>
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-2 border-bottom border-secondary gap-2">
              <button
                type="button"
                className="btn btn-outline-light rounded-pill px-4 fw-bold"
                onClick={handleBackToMenu}
              >
                <i className="bi bi-arrow-left me-2"></i> Volver al Menú de Servicios
              </button>

              <h3 className="fw-bold text-success text-uppercase mb-0">
                Servicio: {selectedCategory}
              </h3>
            </div>

            {/* BOTONES DE VARIEDAD DE RAMOS (NINGUNO SELECCIONADO AL ENTRAR) */}
            {selectedCategory === 'RAMOS' && (
              <div className="bg-black p-3 rounded-4 border border-success border-opacity-50 mb-4 max-w-2xl mx-auto text-center shadow">
                <small className="text-success fw-bold text-uppercase d-block mb-3 fs-6">
                  <i className="bi bi-flower1 me-1"></i> Por favor selecciona qué variedad de Ramos buscas:
                </small>
                <div className="d-flex flex-wrap justify-content-center gap-2">
                  {ramosSubcategories.map((sub) => (
                    <button
                      key={sub.label}
                      type="button"
                      className={`btn ${
                        selectedSubCategory === sub.id
                          ? 'btn-warning text-dark fw-bold shadow-lg scale-105'
                          : 'btn-outline-success text-white'
                      } rounded-pill px-4 py-2 fw-semibold`}
                      onClick={() => setSelectedSubCategory(sub.id)}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CATALOGO Y ESTADOS DE CARGA / SELECCIÓN */}
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-success" role="status"></div>
                <p className="mt-2 text-muted">Cargando productos...</p>
              </div>
            ) : selectedCategory === 'RAMOS' && !selectedSubCategory ? (
              <div className="text-center py-5 bg-black rounded-4 border border-secondary my-4">
                <i className="bi bi-hand-index-thumb display-3 text-success d-block mb-2"></i>
                <h5 className="text-light fw-normal">Por favor presiona una de las opciones arriba:</h5>
                <p className="text-muted small">RAMOS NATURALES, RAMOS ETERNOS o RAMOS FÚNEBRES</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-5 bg-black rounded-4 border border-secondary my-4">
                <i className="bi bi-flower2 display-3 text-secondary d-block mb-2"></i>
                <h5 className="text-muted">No hay productos disponibles en esta sección por el momento.</h5>
                <button
                  className="btn btn-outline-success rounded-pill mt-3 px-4"
                  onClick={handleBackToMenu}
                >
                  Elegir otro servicio
                </button>
              </div>
            ) : (
              <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
                {filteredProducts.map((p) => (
                  <div className="col" key={p.id}>
                    <div
                      className="card h-100 border-secondary bg-black rounded-4 overflow-hidden shadow-lg"
                      style={{ backgroundColor: '#181818' }}
                    >
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
                          <Link to={`/producto/${p.id}`} className="text-decoration-none text-white">
                            <h6 className="fw-bold mb-1 text-light fs-6">{p.name}</h6>
                          </Link>
                          <p className="text-success fw-bold fs-5 mb-2">
                            ${p.price.toLocaleString('es-CO')}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="btn btn-outline-success text-white btn-sm w-100 rounded-3 fw-bold py-2 mt-2"
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
        )}
      </div>

      {/* OFFCANVAS CARRITO */}
      <div
        className="offcanvas offcanvas-end bg-black text-white border-start border-secondary"
        tabIndex="-1"
        id="cartOffcanvas"
      >
        <div className="offcanvas-header bg-dark border-bottom border-secondary p-3">
          <h5 className="offcanvas-title fw-bold text-success d-flex align-items-center gap-2">
            <i className="bi bi-cart3"></i>
            <span>Carrito de Compras</span>
          </h5>
          <button
            type="button"
            className="btn-close btn-close-white"
            data-bs-dismiss="offcanvas"
          ></button>
        </div>

        <div className="offcanvas-body d-flex flex-column justify-content-between p-3">
          {cart.length === 0 ? (
            <div className="text-center py-5 my-auto text-muted">
              <i className="bi bi-cart-x display-1 text-secondary d-block mb-3"></i>
              <h5 className="fw-bold text-light">Tu carrito está vacío</h5>
              <p className="small">Elige los arreglos de Floristería Isis para agregarlos.</p>
            </div>
          ) : (
            <>
              <div className="d-flex flex-column gap-2 overflow-auto mb-3 pe-1">
                {cart.map((item) => (
                  <div key={item.id} className="d-flex align-items-center justify-content-between bg-dark p-2 rounded-3 border border-secondary">
                    <div className="d-flex align-items-center gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="rounded"
                        style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                      />
                      <div>
                        <h6 className="mb-0 fw-bold text-white fs-6">{item.name}</h6>
                        <small className="text-success fw-bold">
                          {item.quantity} x ${item.price.toLocaleString('es-CO')}
                        </small>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-danger p-1 text-decoration-none fw-bold fs-5"
                      onClick={() => removeFromCart(item.id)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className="border-top border-secondary pt-3">
                <div className="d-flex justify-content-between align-items-center fw-bold mb-3">
                  <span className="fs-5 text-light">Total:</span>
                  <span className="text-success fs-4">${cartTotal.toLocaleString('es-CO')}</span>
                </div>

                <button
                  type="button"
                  className="btn btn-success w-100 fw-bold py-3 rounded-3 shadow fs-6 text-uppercase"
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
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)', zIndex: 1070 }}
          onClick={() => setShowCheckoutModal(false)}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content bg-dark text-white rounded-4 border border-secondary shadow-lg">
              <div className="modal-header bg-black border-bottom border-secondary p-3">
                <h5 className="modal-title fw-bold text-success">
                  <i className="bi bi-shield-check me-2"></i>
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
                      <label className="form-label fw-bold text-light">
                        1. Selecciona el Método de Pago:
                      </label>
                      <div className="row g-2">
                        <div className="col-md-4">
                          <button
                            type="button"
                            className={`btn w-100 p-3 text-start border-2 rounded-3 ${
                              paymentMethod === 'TRANSFERENCIA' ? 'btn-success text-white fw-bold' : 'btn-outline-secondary text-light'
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
                              paymentMethod === 'TARJETA' ? 'btn-success text-white fw-bold' : 'btn-outline-secondary text-light'
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
                                paymentMethod === 'EFECTIVO' ? 'btn-warning fw-bold text-dark' : 'btn-outline-warning text-warning'
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
                      <label className="form-label fw-bold text-light">
                        2. Tipo de Entrega:
                      </label>
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className={`btn rounded-pill px-4 fw-bold ${
                            deliveryType === 'DOMICILIO' ? 'btn-success' : 'btn-outline-secondary text-light'
                          }`}
                          onClick={() => setDeliveryType('DOMICILIO')}
                        >
                          🛵 Envió a Domicilio
                        </button>
                        <button
                          type="button"
                          className={`btn rounded-pill px-4 fw-bold ${
                            deliveryType === 'TIENDA' ? 'btn-success' : 'btn-outline-secondary text-light'
                          }`}
                          onClick={() => setDeliveryType('TIENDA')}
                        >
                          🏪 Retiro Presencial en Tienda
                        </button>
                      </div>
                    </div>

                    <div className="col-md-6 mt-3">
                      <label className="form-label small fw-bold text-light">Nombre del Cliente / Destinatario:</label>
                      <input
                        type="text"
                        className="form-control bg-black text-white border-secondary"
                        placeholder="Ej: Cliente Mostrador / María Gómez"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                      />
                    </div>

                    <div className="col-md-6 mt-3">
                      <label className="form-label small fw-bold text-light">Teléfono de Contacto:</label>
                      <input
                        type="tel"
                        className="form-control bg-black text-white border-secondary"
                        placeholder="Ej: 3101234567"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                      />
                    </div>

                    {deliveryType === 'DOMICILIO' && (
                      <div className="col-12 mt-2">
                        <label className="form-label small fw-bold text-light">Dirección de Entrega:</label>
                        <input
                          type="text"
                          className="form-control bg-black text-white border-secondary"
                          placeholder="Ej: Carrera 5 # 10-20 Barrio Centro"
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          required
                        />
                      </div>
                    )}

                    <div className="col-12 mt-2">
                      <label className="form-label small fw-bold text-light">Nota o Dedicatoria para la Tarjeta (Opcional):</label>
                      <textarea
                        className="form-control bg-black text-white border-secondary"
                        rows="2"
                        placeholder="Ej: ¡Feliz aniversario de parte de la familia!"
                        value={customNote}
                        onChange={(e) => setCustomNote(e.target.value)}
                      ></textarea>
                    </div>
                  </div>

                  <div className="bg-black p-3 rounded-3 mt-4 border border-secondary d-flex justify-content-between align-items-center">
                    <div>
                      <small className="text-muted d-block">Total a Pagar:</small>
                      <span className="fs-4 fw-bold text-success">${cartTotal.toLocaleString('es-CO')}</span>
                    </div>
                    <span className="badge bg-secondary px-3 py-2">
                      Método: {paymentMethod === 'EFECTIVO' ? '💵 Efectivo (Caja)' : paymentMethod === 'TARJETA' ? '💳 Tarjeta' : '📲 Transferencia'}
                    </span>
                  </div>
                </div>

                <div className="modal-footer bg-black border-top border-secondary p-3">
                  <button
                    type="button"
                    className="btn btn-outline-secondary text-light rounded-3"
                    onClick={() => setShowCheckoutModal(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success rounded-3 px-4 fw-bold text-uppercase"
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