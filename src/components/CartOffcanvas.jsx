// src/components/CartOffcanvas.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscribeToProducts } from '../services/productsService';
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

export function CartOffcanvas() {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const isCajaOrAdmin = Boolean(user && (role === 'caja' || role === 'cajero' || role === 'admin'));

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(() => {
    return JSON.parse(localStorage.getItem('floristeria_cart') || '[]');
  });

  const [checkoutStep, setCheckoutStep] = useState(1);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Estado para la categoría de recomendados seleccionada en Paso 1
  const [selectedAddonCategory, setSelectedAddonCategory] = useState(null);

  // Estado para la animación de carrito volando por la pantalla
  const [isCartAnimating, setIsCartAnimating] = useState(false);

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

  // Menú de recomendados con la división de Ramos
  const addonCategories = [
    { id: 'CHOCOLATES', label: 'CHOCOLATES', icon: '🍫', desc: 'Cajas de bombones y golosinas' },
    { id: 'GLOBOS', label: 'GLOBOS', icon: '🎈', desc: 'Decoraciones con helio' },
    { id: 'CORONAS', label: 'CORONAS', icon: '👑', desc: 'Tiaras y coronas finas' },
    { id: 'MARIPOSAS', label: 'MARIPOSAS', icon: '🦋', desc: 'Detalles brillantes' },
    { id: 'PELUCHES', label: 'PELUCHES', icon: '🧸', desc: 'Muñecos afelpados' },
    { id: 'RAMOS_NATURALES', label: 'RAMOS NATURALES', icon: '🌹', desc: 'Flores frescas' },
    { id: 'RAMOS_ETERNOS', label: 'RAMOS ETERNOS', icon: '✨', desc: 'Ramos preservados' },
    { id: 'RAMOS_FUNEBRES', label: 'RAMOS FÚNEBRES', icon: '🕊️', desc: 'Condolencias y homenajes' },
    { id: 'DESAYUNOS', label: 'DESAYUNOS', icon: '🍳', desc: 'Sorpresas matutinas' },
    { id: 'ESPECIALES', label: 'ESPECIALES', icon: '✨', desc: 'Diseños únicos' }
  ];

  useEffect(() => {
    const handlePopState = (event) => {
      if (showCheckoutModal) {
        if (event.state && typeof event.state.checkoutStep === 'number') {
          setCheckoutStep(event.state.checkoutStep);
        } else {
          setShowCheckoutModal(false);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [showCheckoutModal]);

  const changeCheckoutStep = (newStep) => {
    setCheckoutStep(newStep);
    window.history.pushState({ checkoutStep: newStep }, '', '');
  };

  const handleOpenCheckout = () => {
    const offcanvasElement = document.getElementById('cartOffcanvas');
    if (offcanvasElement) {
      if (window.bootstrap && window.bootstrap.Offcanvas) {
        const bsOffcanvas = window.bootstrap.Offcanvas.getInstance(offcanvasElement);
        if (bsOffcanvas) bsOffcanvas.hide();
      } else {
        const closeBtn = offcanvasElement.querySelector('.btn-close');
        if (closeBtn) closeBtn.click();
      }
    }
    setCheckoutStep(1);
    setSelectedAddonCategory(null);
    setShowCheckoutModal(true);
    window.history.pushState({ checkoutStep: 1 }, '', '');
  };

  const handleCloseCheckout = () => {
    setShowCheckoutModal(false);
    if (window.history.state && typeof window.history.state.checkoutStep === 'number') {
      window.history.back();
    }
  };

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

  useEffect(() => {
    const unsubscribe = subscribeToProducts((data) => {
      const mappedProducts = data.map((item) => ({
        id: item.id,
        name: item.title || item.name || 'Arreglo Floral',
        price: Number(item.price) || 0,
        category: (item.category || 'RAMOS_NATURALES').toUpperCase(),
        image: item.images && item.images.length > 0 
          ? item.images[0] 
          : (item.image || 'https://via.placeholder.com/300?text=Sin+Imagen')
      }));
      setProducts(mappedProducts);
    });

    return () => unsubscribe && unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToProducts((data) => {
      const mappedProducts = data.map((item) => {
        const cat = (item.category || '').toUpperCase().trim();
        const sub = (item.subCategory || '').toUpperCase().trim();

        // Si la categoría es RAMOS, combinamos con su subcategoría (NATURALES, ETERNOS, FUNEBRES)
        let finalCategory = cat;
        if (cat === 'RAMOS') {
          if (sub.includes('ETERNO')) {
            finalCategory = 'RAMOS_ETERNOS';
          } else if (sub.includes('FUNEBRE') || sub.includes('FÚNEBRE')) {
            finalCategory = 'RAMOS_FUNEBRES';
          } else {
            finalCategory = 'RAMOS_NATURALES';
          }
        }

        return {
          id: item.id,
          name: item.title || item.name || 'Arreglo Floral',
          price: Number(item.price) || 0,
          category: finalCategory,
          image: item.images && item.images.length > 0 
            ? item.images[0] 
            : (item.image || 'https://via.placeholder.com/300?text=Sin+Imagen')
        };
      });
      setProducts(mappedProducts);
    });

    return () => unsubscribe && unsubscribe();
  }, []);

  const updateCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem('floristeria_cart', JSON.stringify(newCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const handleAddAddonWithAnimation = (product) => {
    setIsCartAnimating(true);

    setTimeout(() => {
      setIsCartAnimating(false);
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
    }, 5000);
  };

  const removeFromCart = (productId) => {
    updateCart(cart.filter((item) => item.id !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const addonProducts = selectedAddonCategory
    ? products.filter((p) => p.category.includes(selectedAddonCategory))
    : [];

  const getNextOrderNumber = async () => {
    try {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, orderBy('createdAt', 'desc'), limit(10));
      const querySnapshot = await getDocs(q);

      let maxSeq = -1;
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.orderNumber && typeof data.orderNumber === 'string' && data.orderNumber.startsWith('J-')) {
          const num = parseInt(data.orderNumber.replace('J-', ''), 10);
          if (!isNaN(num) && num > maxSeq) {
            maxSeq = num;
          }
        }
      });

      const nextSeq = maxSeq + 1;
      return `J-${nextSeq}`;
    } catch (err) {
      console.error('Error calculando consecutivo:', err);
      return `J-0`;
    }
  };

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
        image: item.image || ''
      }));

      const newOrderNumber = await getNextOrderNumber();

      const orderData = {
        orderNumber: newOrderNumber,
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
        status: 'EN_PREPARACION',
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
    <>
      {/* ANIMACIÓN DEL CARRITO VOLADOR */}
      {isCartAnimating && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            zIndex: 2000
          }}
        >
          <div className="text-center p-4 rounded-4 bg-dark border border-success shadow-lg" style={{ maxWidth: '380px' }}>
            <div className="cart-flying-animation mb-3">
              <span className="display-1 d-block animate-bounce">🛒</span>
            </div>
            <h4 className="fw-bold text-success mb-2">¡Añadiendo a tu pedido!</h4>
            <p className="text-light small mb-3">Actualizando el carrito de compras en tiempo real...</p>
            <div className="spinner-border text-success" role="status"></div>
          </div>
        </div>
      )}

      {/* PANEL LATERAL / CARRITO OFFCANVAS */}
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
                {cart.map((item, idx) => (
                  <div key={item.id} className="d-flex align-items-center justify-content-between bg-dark p-2 rounded-3 border border-secondary position-relative">
                    <span 
                      className="badge bg-success rounded-circle d-flex align-items-center justify-content-center me-2 flex-shrink-0"
                      style={{ width: '28px', height: '28px' }}
                    >
                      {idx + 1}
                    </span>
                    <div className="d-flex align-items-center gap-2 flex-grow-1">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="rounded"
                        style={{ width: '45px', height: '45px', objectFit: 'cover' }}
                      />
                      <div>
                        <h6 className="mb-0 fw-bold text-white fs-6 text-truncate" style={{ maxWidth: '140px' }}>{item.name}</h6>
                        <small className="text-success fw-bold">
                          {item.quantity} x ${item.price.toLocaleString('es-CO')}
                        </small>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-danger p-1 text-decoration-none fw-bold fs-5"
                      onClick={() => removeFromCart(item.id)}
                      title="Quitar producto"
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

      {/* MODAL CHECKOUT */}
      {showCheckoutModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.88)', zIndex: 1080 }}
          onClick={handleCloseCheckout}
        >
          <div className="modal-dialog modal-dialog-centered modal-xl modal-fullscreen-md-down" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content bg-white text-dark rounded-4 border-0 shadow-lg overflow-hidden">
              
              <div className="modal-header bg-white border-bottom p-4 flex-column align-items-stretch">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-secondary fw-semibold cursor-pointer" onClick={handleCloseCheckout} style={{ cursor: 'pointer' }}>
                    ← Volver
                  </span>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={handleCloseCheckout}
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
                      <span 
                        className={`badge rounded-circle d-flex align-items-center justify-content-center fw-bold fs-6 ${checkoutStep === st.num ? 'bg-dark text-white' : 'bg-light text-muted border'}`}
                        style={{ minWidth: '32px', height: '32px' }}
                      >
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

                      {/* PASO 1: RECOMENDACIONES */}
                      {checkoutStep === 1 && (
                        <div>
                          <h3 className="fw-bold text-dark mb-1">¿Deseas complementar tu compra con algo más?</h3>
                          <p className="text-muted small mb-4">Elige una categoría para desplegar sus adiciones:</p>

                          {!selectedAddonCategory ? (
                            <div className="row row-cols-2 row-cols-md-4 g-3 mb-4">
                              {addonCategories.map((cat) => (
                                <div className="col" key={cat.id}>
                                  <div
                                    className="card h-100 border p-3 text-center rounded-4 bg-light"
                                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                                    onClick={() => setSelectedAddonCategory(cat.id)}
                                  >
                                    <div className="fs-1 mb-1">{cat.icon}</div>
                                    <h6 className="fw-bold text-dark text-uppercase mb-1 fs-7">{cat.label}</h6>
                                    <small className="text-muted fs-8 d-none d-md-block">{cat.desc}</small>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="mb-4">
                              <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                                <button
                                  type="button"
                                  className="btn btn-outline-dark btn-sm rounded-pill fw-bold"
                                  onClick={() => setSelectedAddonCategory(null)}
                                >
                                  ← Ver todas las categorías
                                </button>
                                <span className="fw-bold text-success text-uppercase">
                                  Categoría: {selectedAddonCategory.replace('_', ' ')}
                                </span>
                              </div>

                              {addonProducts.length === 0 ? (
                                <p className="text-muted text-center py-4">No hay adicionales en esta categoría.</p>
                              ) : (
                                <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3">
                                  {addonProducts.map((add) => (
                                    <div className="col" key={add.id}>
                                      <div className="card h-100 border-0 bg-light p-3 rounded-4 text-center d-flex flex-column justify-content-between">
                                        <div>
                                          <img
                                            src={add.image}
                                            alt={add.name}
                                            className="rounded-3 mb-2 mx-auto"
                                            style={{ height: '110px', objectFit: 'contain', width: '100%' }}
                                          />
                                          <h6 className="fw-bold text-dark fs-7 mb-1 text-truncate">{add.name}</h6>
                                          <div className="text-dark fw-bold small mb-2">${add.price.toLocaleString('es-CO')}</div>
                                        </div>
                                        <button
                                          type="button"
                                          className="btn btn-success btn-sm text-white shadow-sm rounded-3 fw-bold w-100 text-uppercase py-2"
                                          onClick={() => handleAddAddonWithAnimation(add)}
                                        >
                                          AGREGAR
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          <div className="d-flex justify-content-end mt-4">
                            <button
                              type="button"
                              className="btn btn-dark rounded-pill px-4 py-3 fw-bold text-uppercase shadow fs-7"
                              onClick={() => changeCheckoutStep(2)}
                            >
                              NO QUIERO AGREGAR MÁS PRODUCTOS Y CONTINUAR PAGO ›
                            </button>
                          </div>
                        </div>
                      )}

                      {/* PASO 2: REMITENTE */}
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
                              onClick={() => changeCheckoutStep(1)}
                            >
                              Volver
                            </button>
                            <button
                              type="button"
                              className="btn btn-dark rounded-pill px-5 py-3 fw-bold text-uppercase shadow"
                              onClick={() => changeCheckoutStep(3)}
                            >
                              CONTINUAR ›
                            </button>
                          </div>
                        </div>
                      )}

                      {/* PASO 3: DESTINATARIO */}
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
                              onClick={() => changeCheckoutStep(2)}
                            >
                              Corregir información
                            </button>
                            <button
                              type="button"
                              className="btn btn-dark rounded-pill px-5 py-3 fw-bold text-uppercase shadow"
                              onClick={() => changeCheckoutStep(4)}
                            >
                              CONTINUAR ›
                            </button>
                          </div>
                        </div>
                      )}

                      {/* PASO 4: PAGO */}
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
                              onClick={() => changeCheckoutStep(3)}
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

                  {/* RESUMEN LATERAL DEL PEDIDO */}
                  <div className="col-lg-4">
                    <div className="bg-white p-4 rounded-4 border shadow-sm sticky-top" style={{ top: '20px' }}>
                      <div className="d-flex flex-column gap-3 mb-4 max-h-60 overflow-auto">
                        {cart.map((item, idx) => (
                          <div key={item.id} className="d-flex align-items-center justify-content-between pb-2 border-bottom">
                            <div className="d-flex align-items-center gap-3">
                              <span 
                                className="badge bg-dark rounded-circle d-flex align-items-center justify-content-center fw-bold fs-7"
                                style={{ minWidth: '28px', height: '28px' }}
                              >
                                {idx + 1}
                              </span>
                              <div className="position-relative">
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="rounded-3"
                                  style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                />
                                <span className="position-absolute top-0 start-100 translate-middle badge rounded-circle bg-secondary">
                                  {item.quantity}
                                </span>
                              </div>
                              <div>
                                <span className="fw-bold text-dark d-block text-truncate" style={{ maxWidth: '100px' }}>
                                  {item.name}
                                </span>
                                <small className="text-muted d-block">${item.price.toLocaleString('es-CO')}</small>
                              </div>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                              <span className="fw-bold text-dark">${(item.price * item.quantity).toLocaleString('es-CO')}</span>
                              <button
                                type="button"
                                className="btn btn-sm btn-link text-danger p-0 text-decoration-none fw-bold fs-5 ms-1"
                                onClick={() => removeFromCart(item.id)}
                                title="Quitar del pedido"
                              >
                                ✕
                              </button>
                            </div>
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
    </>
  );
}