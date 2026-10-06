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

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // checkout wizard step: 1 = RECOMENDACIONES, 2 = REMITENTE, 3 = DESTINATARIO, 4 = REALIZAR PAGO
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  // Form states - REMITENTE
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState('');
  const [documentType, setDocumentType] = useState('CC');
  const [senderDocument, setSenderDocument] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');

  // Form states - DESTINATARIO
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [cardMessage, setCardMessage] = useState('');

  const [paymentMethod, setPaymentMethod] = useState('TRANSFERENCIA');
  const [deliveryType, setDeliveryType] = useState('DOMICILIO');

  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayName = i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : d.toLocaleDateString('es-ES', { weekday: 'long' });
      const formatted = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
      const isoValue = d.toISOString().split('T')[0];
      dates.push({ value: isoValue, label: `${dayName.toUpperCase()} (${formatted})` });
    }
    return dates;
  };

  // Escuchar evento global para abrir el carrito automáticamente
  useEffect(() => {
    const handleOpenCartEvent = () => {
      const toggleBtn = document.querySelector('[data-bs-target="#cartOffcanvas"]');
      if (toggleBtn) {
        toggleBtn.click();
      }
    };

    window.addEventListener('openCart', handleOpenCartEvent);
    return () => window.removeEventListener('openCart', handleOpenCartEvent);
  }, []);

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

  const selectServiceCategory = (catId) => {
    setSelectedCategory(catId);
    setSelectedSubCategory(null);
    window.history.pushState({ category: catId, subCategory: null }, '', '');
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
    setCheckoutStep(1);
    setShowCheckoutModal(true);
  };

  // Filtrado estricto de productos
  const filteredProducts = selectedCategory
    ? products.filter((p) => {
        if (selectedCategory === 'RAMOS') {
          // Si no hay subcategoría seleccionada en RAMOS, no se muestra ningún producto aún
          if (!selectedSubCategory) return false;
          return (
            p.category === 'RAMOS' &&
            (p.subCategory === selectedSubCategory || p.name.toUpperCase().includes(selectedSubCategory))
          );
        }
        return p.category.includes(selectedCategory);
      })
    : [];

  const addOnProducts = products.filter((p) => 
    ['CHOCOLATES', 'GLOBOS', 'CORONAS', 'PELUCHES', 'ESPECIALES'].includes(p.category)
  ).slice(0, 6);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

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

  const ramosSubcategories = [
    { id: 'NATURALES', label: 'RAMOS NATURALES' },
    { id: 'ETERNOS', label: 'RAMOS ETERNOS' },
    { id: 'FUNEBRES', label: 'RAMOS FÚNEBRES' }
  ];

  const handleFinalizePayment = async (e) => {
    if (e) e.preventDefault();
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
        sender: {
          documentType,
          document: senderDocument.trim() || 'N/A',
          email: senderEmail.trim() || 'N/A',
          name: senderName.trim() || (isCajaOrAdmin ? 'Cliente Tienda Física' : 'Cliente Web'),
          phone: senderPhone.trim() || 'N/A',
          deliveryDate,
          deliveryTimeSlot
        },
        customerName: recipientName.trim() || senderName.trim() || 'Cliente Destinatario',
        customerPhone: recipientPhone.trim() || senderPhone.trim() || 'N/A',
        deliveryAddress: deliveryType === 'DOMICILIO' ? `${deliveryAddress.trim()} (${deliveryNotes.trim()})` : 'Retiro Presencial en Tienda',
        customNote: cardMessage.trim(),
        status: 'PENDIENTE_PREPARACION',
        createdBy: user ? user.email : 'cliente_web',
        isPhysicalStoreSale: Boolean(isCajaOrAdmin),
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);

      updateCart([]);
      setShowCheckoutModal(false);

      navigate(`/rastreo/${docRef.id}`);
    } catch (error) {
      console.error('Error al procesar pedido:', error);
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
        {isCajaOrAdmin && (
          <div className="d-flex justify-content-end mb-3">
            <span className="badge bg-success fs-6 px-4 py-2 rounded-pill shadow">
              <i className="bi bi-cash-register me-2"></i> Modo Punto de Venta (Caja)
            </span>
          </div>
        )}

        {/* PORTAL INICIAL DE CATEGORÍAS */}
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
          /* VISTA DE PRODUCTOS */
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
                Servicio: {selectedCategory} {selectedSubCategory ? `- ${selectedSubCategory}` : ''}
              </h3>
            </div>

            {/* SI SELECCIONÓ RAMOS: MOSTRAR MÓDULO EXCLUSIVO DE SUBCATEGORÍAS PRIMERO */}
            {selectedCategory === 'RAMOS' && (
              <div className="bg-black p-4 rounded-4 border border-success border-opacity-50 mb-4 max-w-2xl mx-auto text-center shadow">
                <small className="text-success fw-bold text-uppercase d-block mb-3 fs-6">
                  <i className="bi bi-flower1 me-1"></i> Selecciona la variedad de Ramos que deseas consultar:
                </small>
                <div className="d-flex flex-wrap justify-content-center gap-3">
                  {ramosSubcategories.map((sub) => (
                    <button
                      key={sub.label}
                      type="button"
                      className={`btn ${
                        selectedSubCategory === sub.id
                          ? 'btn-warning text-dark fw-bold shadow-lg scale-105'
                          : 'btn-outline-success text-white'
                      } rounded-pill px-4 py-2 text-uppercase fw-semibold`}
                      onClick={() => {
                        setSelectedSubCategory(sub.id);
                        window.history.pushState({ category: 'RAMOS', subCategory: sub.id }, '', '');
                      }}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TARJETAS DE PRODUCTOS */}
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-success" role="status"></div>
                <p className="mt-2 text-muted">Cargando productos...</p>
              </div>
            ) : selectedCategory === 'RAMOS' && !selectedSubCategory ? (
              /* MENSAJE DE INDICACIÓN CUANDO AÚN NO HA SELECCIONADO SUBCATEGORÍA DE RAMOS */
              <div className="text-center py-5 bg-black rounded-4 border border-secondary my-4">
                <i className="bi bi-hand-index-thumb display-3 text-success d-block mb-2"></i>
                <h5 className="text-light fw-bold">Por favor selecciona una variedad de Ramos arriba</h5>
                <p className="text-muted small">Haz clic en Ramos Naturales, Eternos o Fúnebres para desplegar la colección.</p>
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
                    <Link to={`/producto/${p.id}`} className="text-decoration-none">
                      <div
                        className="card h-100 border-secondary bg-black rounded-4 overflow-hidden shadow-lg hover-border-success"
                        style={{ backgroundColor: '#181818', cursor: 'pointer' }}
                      >
                        <img
                          src={p.image}
                          alt={p.name}
                          className="card-img-top"
                          style={{ height: '240px', objectFit: 'cover' }}
                        />
                        <div className="card-body p-3 text-center">
                          <h6 className="fw-bold mb-1 text-light fs-6">{p.name}</h6>
                          <p className="text-success fw-bold fs-5 mb-0">
                            ${p.price.toLocaleString('es-CO')}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* OFFCANVAS / CARRITO EN MODO OSCURO */}
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
              <p className="small">Selecciona los detalles de tu agrado para agregarlos.</p>
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

      {/* MODAL CHECKOUT LIMPIO Y ELEGANTE */}
      {showCheckoutModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.88)', zIndex: 1070 }}
          onClick={() => setShowCheckoutModal(false)}
        >
          <div className="modal-dialog modal-dialog-centered modal-xl modal-fullscreen-md-down" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content bg-white text-dark rounded-4 border-0 shadow-lg overflow-hidden">
              
              <div className="modal-header bg-white border-bottom p-4 flex-column align-items-stretch">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-secondary fw-semibold cursor-pointer" onClick={() => setShowCheckoutModal(false)}>
                    ← Volver a la tienda
                  </span>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowCheckoutModal(false)}
                  ></button>
                </div>

                <div className="d-flex justify-content-center align-items-center gap-3 gap-md-5 pt-2">
                  {[
                    { num: 1, label: 'RECOMENDACIONES' },
                    { num: 2, label: 'REMITENTE' },
                    { num: 3, label: 'DESTINATARIO' },
                    { num: 4, label: 'REALIZAR PAGO' }
                  ].map((st) => (
                    <div key={st.num} className="d-flex align-items-center gap-2">
                      <span className={`badge rounded-circle p-2 fs-6 ${checkoutStep === st.num ? 'bg-dark text-white' : 'bg-light text-muted border'}`}>
                        {st.num}
                      </span>
                      <small className={`fw-bold text-uppercase d-none d-md-inline ${checkoutStep === st.num ? 'text-dark' : 'text-muted'}`}>
                        {st.label}
                      </small>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-body p-4 p-md-5 bg-light">
                <div className="row g-4 g-lg-5">
                  <div className="col-lg-8">
                    <div className="bg-white p-4 p-md-5 rounded-4 border shadow-sm">

                      {checkoutStep === 1 && (
                        <div>
                          <h3 className="fw-bold text-dark mb-1">Antes de continuar, agrega...</h3>
                          <p className="text-muted small mb-4">Estos productos complementan tu compra</p>

                          <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3">
                            {addOnProducts.map((add) => (
                              <div className="col" key={add.id}>
                                <div className="card h-100 border-0 bg-light p-3 position-relative rounded-4 text-center">
                                  <button
                                    type="button"
                                    className="btn btn-white bg-white shadow-sm position-absolute top-0 end-0 m-2 rounded-circle fw-bold fs-5 border"
                                    style={{ width: '36px', height: '36px', lineHeight: 1 }}
                                    onClick={() => addToCart(add)}
                                  >
                                    +
                                  </button>
                                  <img
                                    src={add.image}
                                    alt={add.name}
                                    className="rounded-3 mb-2 mx-auto"
                                    style={{ height: '120px', objectFit: 'contain', width: '100%' }}
                                  />
                                  <h6 className="fw-bold text-dark fs-7 mb-1 text-truncate">{add.name}</h6>
                                  <span className="text-dark fw-bold small">${add.price.toLocaleString('es-CO')}</span>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="d-flex justify-content-end mt-5">
                            <button
                              type="button"
                              className="btn btn-dark rounded-pill px-5 py-3 fw-bold text-uppercase shadow"
                              onClick={() => setCheckoutStep(2)}
                            >
                              CONTINUAR ›
                            </button>
                          </div>
                        </div>
                      )}

                      {checkoutStep === 2 && (
                        <div>
                          <h4 className="fw-bold text-dark mb-4 text-uppercase">DATOS DEL REMITENTE</h4>
                          
                          <div className="row g-3">
                            <div className="col-12">
                              <label className="form-label small fw-bold text-muted text-uppercase mb-1">FECHA Y HORA DE ENTREGA</label>
                              <select
                                className="form-select py-3 rounded-3 border-light-subtle mb-2"
                                value={deliveryDate}
                                onChange={(e) => setDeliveryDate(e.target.value)}
                              >
                                <option value="">Seleccione fecha</option>
                                {getAvailableDates().map((d) => (
                                  <option key={d.value} value={d.value}>{d.label}</option>
                                ))}
                              </select>

                              <select
                                className="form-select py-3 rounded-3 border-light-subtle"
                                value={deliveryTimeSlot}
                                onChange={(e) => setDeliveryTimeSlot(e.target.value)}
                              >
                                <option value="">Seleccione horario</option>
                                <option value="MAÑANA (8:00 AM - 12:00 PM)">Mañana (8:00 AM - 12:00 PM)</option>
                                <option value="TARDE (2:00 PM - 6:00 PM)">Tarde (2:00 PM - 6:00 PM)</option>
                              </select>
                            </div>

                            <div className="col-12 mt-3">
                              <label className="form-label small fw-bold text-muted text-uppercase mb-1">DOCUMENTO DE IDENTIDAD</label>
                              <div className="input-group">
                                <select
                                  className="form-select py-3 rounded-start-3 border-light-subtle fw-bold"
                                  style={{ maxWidth: '100px' }}
                                  value={documentType}
                                  onChange={(e) => setDocumentType(e.target.value)}
                                >
                                  <option value="CC">CC</option>
                                  <option value="CE">CE</option>
                                  <option value="NIT">NIT</option>
                                  <option value="PP">PP</option>
                                </select>
                                <input
                                  type="text"
                                  className="form-control py-3 rounded-end-3 border-light-subtle"
                                  placeholder="Número de documento *"
                                  value={senderDocument}
                                  onChange={(e) => setSenderDocument(e.target.value)}
                                />
                              </div>
                            </div>

                            <div className="col-12 mt-3">
                              <input
                                type="email"
                                className="form-control py-3 rounded-3 border-light-subtle"
                                placeholder="Email *"
                                value={senderEmail}
                                onChange={(e) => setSenderEmail(e.target.value)}
                              />
                            </div>

                            <div className="col-12 mt-3">
                              <input
                                type="text"
                                className="form-control py-3 rounded-3 border-light-subtle"
                                placeholder="Nombre y apellido *"
                                value={senderName}
                                onChange={(e) => setSenderName(e.target.value)}
                              />
                            </div>

                            <div className="col-12 mt-3">
                              <input
                                type="tel"
                                className="form-control py-3 rounded-3 border-light-subtle"
                                placeholder="Celular *"
                                value={senderPhone}
                                onChange={(e) => setSenderPhone(e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="d-flex justify-content-between mt-5">
                            <button
                              type="button"
                              className="btn btn-outline-secondary rounded-pill px-4 py-2"
                              onClick={() => setCheckoutStep(1)}
                            >
                              Volver
                            </button>
                            <button
                              type="button"
                              className="btn btn-dark rounded-pill px-5 py-3 fw-bold text-uppercase shadow"
                              onClick={() => setCheckoutStep(3)}
                            >
                              CONTINUAR ›
                            </button>
                          </div>
                        </div>
                      )}

                      {checkoutStep === 3 && (
                        <div>
                          <h4 className="fw-bold text-dark mb-4 text-uppercase">DATOS DEL DESTINATARIO</h4>
                          
                          <div className="row g-3">
                            <div className="col-12">
                              <input
                                type="text"
                                className="form-control py-3 rounded-3 border-light-subtle"
                                placeholder="Nombre y apellido *"
                                value={recipientName}
                                onChange={(e) => setRecipientName(e.target.value)}
                              />
                            </div>

                            <div className="col-12">
                              <input
                                type="tel"
                                className="form-control py-3 rounded-3 border-light-subtle"
                                placeholder="Celular *"
                                value={recipientPhone}
                                onChange={(e) => setRecipientPhone(e.target.value)}
                              />
                            </div>

                            <div className="col-12">
                              <input
                                type="text"
                                className="form-control py-3 rounded-3 border-light-subtle"
                                placeholder="Dirección de entrega *"
                                value={deliveryAddress}
                                onChange={(e) => setDeliveryAddress(e.target.value)}
                              />
                            </div>

                            <div className="col-12">
                              <input
                                type="text"
                                className="form-control py-3 rounded-3 border-light-subtle"
                                placeholder="Detalles adicionales (Conjunto, nombre edificio, oficina u observaciones de entrega)"
                                value={deliveryNotes}
                                onChange={(e) => setDeliveryNotes(e.target.value)}
                              />
                            </div>

                            <div className="col-12 mt-4">
                              <h5 className="fw-bold text-dark text-uppercase mb-2">MENSAJE PERSONALIZADO</h5>
                              <textarea
                                className="form-control p-3 rounded-3 border-light-subtle"
                                rows="3"
                                placeholder="Mensaje para la tarjeta y firma"
                                value={cardMessage}
                                onChange={(e) => setCardMessage(e.target.value)}
                              ></textarea>
                            </div>
                          </div>

                          <div className="d-flex justify-content-between mt-5">
                            <button
                              type="button"
                              className="btn btn-outline-secondary rounded-pill px-4 py-2"
                              onClick={() => setCheckoutStep(2)}
                            >
                              Corregir información
                            </button>
                            <button
                              type="button"
                              className="btn btn-dark rounded-pill px-5 py-3 fw-bold text-uppercase shadow"
                              onClick={() => setCheckoutStep(4)}
                            >
                              CONTINUAR ›
                            </button>
                          </div>
                        </div>
                      )}

                      {checkoutStep === 4 && (
                        <div>
                          <h4 className="fw-bold text-dark mb-4 text-uppercase">SELECCIONA EL MÉTODO DE PAGO</h4>
                          
                          <div className="d-flex flex-column gap-3">
                            <button
                              type="button"
                              className={`btn p-4 text-start border rounded-4 d-flex justify-content-between align-items-center ${
                                paymentMethod === 'TRANSFERENCIA' ? 'border-dark bg-light fw-bold' : 'bg-white'
                              }`}
                              onClick={() => setPaymentMethod('TRANSFERENCIA')}
                            >
                              <div>
                                <span className="d-block fw-bold fs-6 text-dark">📲 Transferencia Nequi / Daviplata</span>
                                <small className="text-muted">Cuenta bancaria directa o código QR</small>
                              </div>
                              <i className="bi bi-chevron-right fs-5"></i>
                            </button>

                            <button
                              type="button"
                              className={`btn p-4 text-start border rounded-4 d-flex justify-content-between align-items-center ${
                                paymentMethod === 'TARJETA' ? 'border-dark bg-light fw-bold' : 'bg-white'
                              }`}
                              onClick={() => setPaymentMethod('TARJETA')}
                            >
                              <div>
                                <span className="d-block fw-bold fs-6 text-dark">💳 Tarjeta Débito o Crédito</span>
                                <small className="text-muted">Pago seguro procesado en línea</small>
                              </div>
                              <i className="bi bi-chevron-right fs-5"></i>
                            </button>

                            {isCajaOrAdmin && (
                              <button
                                type="button"
                                className={`btn p-4 text-start border rounded-4 d-flex justify-content-between align-items-center ${
                                  paymentMethod === 'EFECTIVO' ? 'border-warning bg-warning bg-opacity-10 fw-bold' : 'bg-white'
                                }`}
                                onClick={() => {
                                  setPaymentMethod('EFECTIVO');
                                  setDeliveryType('TIENDA');
                                }}
                              >
                                <div>
                                  <span className="d-block fw-bold fs-6 text-dark">💵 Pago en Efectivo (Caja)</span>
                                  <small className="text-muted">Pago presencial en el mostrador</small>
                                </div>
                                <i className="bi bi-chevron-right fs-5"></i>
                              </button>
                            )}
                          </div>

                          <div className="d-flex justify-content-between mt-5">
                            <button
                              type="button"
                              className="btn btn-outline-secondary rounded-pill px-4 py-2"
                              onClick={() => setCheckoutStep(3)}
                            >
                              Corregir información
                            </button>
                            <button
                              type="button"
                              className="btn btn-dark rounded-pill px-5 py-3 fw-bold text-uppercase shadow fs-6"
                              disabled={isProcessing}
                              onClick={handleFinalizePayment}
                            >
                              {isProcessing ? 'Procesando...' : 'PAGAR AHORA ›'}
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>

                  {/* RESUMEN LATERAL */}
                  <div className="col-lg-4">
                    <div className="bg-white p-4 rounded-4 border shadow-sm sticky-top" style={{ top: '20px' }}>
                      <div className="d-flex flex-column gap-3 mb-4 max-h-60 overflow-auto">
                        {cart.map((item) => (
                          <div key={item.id} className="d-flex align-items-center justify-content-between pb-2 border-bottom">
                            <div className="d-flex align-items-center gap-3">
                              <div className="position-relative">
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="rounded-3"
                                  style={{ width: '56px', height: '56px', objectFit: 'cover' }}
                                />
                                <span className="position-absolute top-0 start-100 translate-middle badge rounded-circle bg-secondary">
                                  {item.quantity}
                                </span>
                              </div>
                              <div>
                                <span className="fw-bold text-dark d-block text-truncate" style={{ maxWidth: '150px' }}>
                                  {item.name}
                                </span>
                              </div>
                            </div>
                            <span className="fw-bold text-dark">${(item.price * item.quantity).toLocaleString('es-CO')}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2">
                        <div className="d-flex justify-content-between mb-2 text-secondary">
                          <span>Subtotal</span>
                          <span className="fw-semibold text-dark">${cartTotal.toLocaleString('es-CO')}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-3 text-secondary">
                          <span>Costo de envío</span>
                          <span>—</span>
                        </div>
                        <hr className="my-2" />
                        <div className="d-flex justify-content-between fw-bold fs-4 text-dark mt-3">
                          <span>TOTAL</span>
                          <span>${cartTotal.toLocaleString('es-CO')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}