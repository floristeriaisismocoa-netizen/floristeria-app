// src/pages/KitchenView.jsx
import React, { useEffect, useState, useRef } from 'react';
import { subscribeToOrders, updateOrderStatus } from '../services/ordersService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const numberToWords = (num) => {
  const words = ['UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE', 'DIEZ'];
  return num >= 1 && num <= 10 ? words[num - 1] : String(num);
};

// Extractor robusto de nombres de productos para el lector de voz
const buildOrderSpeechText = (order) => {
  if (!order || !order.items || !Array.isArray(order.items) || order.items.length === 0) {
    return 'NUEVO PEDIDO PARA ELABORAR';
  }

  const itemsFormatted = order.items.map((item) => {
    const qty = Number(item.quantity) || 1;
    const qtyWord = numberToWords(qty);
    const rawName = item.title || item.name || item.productName || 'ARREGLO FLORAL';
    return `${qtyWord} ${rawName.toUpperCase()}`;
  });

  let itemsText = '';
  if (itemsFormatted.length === 1) {
    itemsText = itemsFormatted[0];
  } else if (itemsFormatted.length === 2) {
    itemsText = itemsFormatted.join(' Y ');
  } else {
    itemsText = itemsFormatted.slice(0, -1).join(', ') + ' Y ' + itemsFormatted[itemsFormatted.length - 1];
  }

  return `NUEVO PEDIDO PARA ELABORAR ${itemsText}`;
};

export function KitchenView() {
  const [orders, setOrders] = useState([]);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [modalData, setModalData] = useState(null);
  const [wakeLockActive, setWakeLockActive] = useState(false);

  const previousOrdersRef = useRef([]);
  const wakeLockRef = useRef(null);
  const silentAudioRef = useRef(null);

  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        setWakeLockActive(true);

        wakeLockRef.current.addEventListener('release', () => {
          setWakeLockActive(false);
        });
      }
    } catch (err) {
      console.warn('Wake Lock no soportado o restringido:', err);
    }
  };

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && audioEnabled) {
        await requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [audioEnabled]);

  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    if (silentAudioRef.current) {
      silentAudioRef.current.play().catch(() => {});
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    requestWakeLock();

    const unsubscribe = subscribeToOrders((data) => {
      // Filtrar todas las órdenes activas en el taller
      const activeOrders = data.filter((o) => {
        const s = o.status ? o.status.toUpperCase() : '';
        return s === 'PENDIENTE_PREPARACION' || s === 'EN_PREPARACION';
      });

      const currentPendingOrders = activeOrders.filter((o) => {
        const s = o.status ? o.status.toUpperCase() : '';
        return s === 'PENDIENTE_PREPARACION';
      });

      const prevIds = previousOrdersRef.current.map((o) => o.id);
      const newOrders = currentPendingOrders.filter((o) => !prevIds.includes(o.id));

      if (previousOrdersRef.current.length >= 0 && newOrders.length > 0 && audioEnabled) {
        const latestOrder = newOrders[0];
        const speechMessage = buildOrderSpeechText(latestOrder);
        speakText(speechMessage);
      }

      previousOrdersRef.current = currentPendingOrders;
      setOrders(activeOrders);
    });

    return () => {
      unsubscribe();
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
      }
    };
  }, [audioEnabled]);

  const toggleAudioAndWakeLock = async () => {
    const newState = !audioEnabled;
    setAudioEnabled(newState);

    if (newState) {
      await requestWakeLock();
      speakText('ALERTA DE VOZ Y PANTALLA ACTIVA EN TALLER');
    } else {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
      }
    }
  };

  const openImageGallery = async (item) => {
    const title = item.title || item.name || 'Detalle del Arreglo';

    if (item.images && Array.isArray(item.images) && item.images.length > 1) {
      setModalData({
        images: item.images,
        title,
        activeIndex: 0
      });
      return;
    }

    let allImages = item.images && item.images.length > 0 ? [...item.images] : (item.image ? [item.image] : []);

    if (item.id) {
      try {
        const productRef = doc(db, 'products', item.id);
        const productSnap = await getDoc(productRef);
        if (productSnap.exists()) {
          const productData = productSnap.data();
          if (productData.images && Array.isArray(productData.images) && productData.images.length > 0) {
            allImages = productData.images;
          }
        }
      } catch (err) {
        console.error('Error al consultar imágenes:', err);
      }
    }

    setModalData({
      images: allImages.length > 0 ? allImages : ['https://via.placeholder.com/400?text=Sin+Imagen'],
      title,
      activeIndex: 0
    });
  };

  const handleNextImage = () => {
    if (!modalData) return;
    setModalData((prev) => ({
      ...prev,
      activeIndex: (prev.activeIndex + 1) % prev.images.length
    }));
  };

  const handlePrevImage = () => {
    if (!modalData) return;
    setModalData((prev) => ({
      ...prev,
      activeIndex: (prev.activeIndex - 1 + prev.images.length) % prev.images.length
    }));
  };

  const handleStartPreparation = async (orderId) => {
    try {
      await updateOrderStatus(orderId, 'EN_PREPARACION');
    } catch (error) {
      console.error('Error al iniciar elaboración:', error);
    }
  };

  const handleFinishPreparation = async (orderId) => {
    try {
      await updateOrderStatus(orderId, 'LISTO_PARA_ENTREGA');
    } catch (error) {
      console.error('Error al completar pedido en taller:', error);
    }
  };

  const handlePickupInStore = async (orderId) => {
    try {
      await updateOrderStatus(orderId, 'ENTREGADO');
    } catch (error) {
      console.error('Error al marcar retiro en tienda:', error);
    }
  };

  const formatOrderTime = (createdAt) => {
    if (!createdAt) return 'Reciente';
    try {
      if (typeof createdAt.toDate === 'function') {
        return createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (err) {
      return 'Reciente';
    }
  };

  return (
    <div className="container-fluid py-4 bg-light min-vh-100">
      <audio
        ref={silentAudioRef}
        loop
        src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA="
      />

      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center mb-4 pb-2 border-bottom container">
        <h2 className="fw-bold mb-2 mb-sm-0 text-dark">
          <i className="bi bi-flower1 text-danger me-2"></i>
          Taller de Arreglos - Pedidos Activos ({orders.length})
        </h2>

        <div className="d-flex align-items-center gap-2 bg-white p-2 px-3 rounded-pill shadow-sm border">
          <button
            className={`btn btn-sm rounded-circle ${audioEnabled ? 'btn-danger' : 'btn-outline-secondary'}`}
            style={{ width: '36px', height: '36px' }}
            onClick={toggleAudioAndWakeLock}
            title={audioEnabled ? 'Desactivar voz de alerta' : 'Activar voz de alerta'}
          >
            <i className={`bi ${audioEnabled ? 'bi-volume-up-fill' : 'bi-volume-mute-fill'}`}></i>
          </button>
          <div>
            <span className="small fw-bold d-block text-secondary lh-1">
              {audioEnabled ? 'Voz inteligente activa' : 'Voz silenciada'}
            </span>
            {audioEnabled && (
              <small className="text-success fw-semibold" style={{ fontSize: '0.7rem' }}>
                <i className="bi bi-brightness-high-fill me-1"></i>
                {wakeLockActive ? 'Pantalla Always-On' : 'Mantener navegador abierto'}
              </small>
            )}
          </div>
        </div>
      </div>

      <div className="container">
        <div className="row g-3">
          {orders.length === 0 ? (
            <div className="col-12 text-center py-5 text-muted">
              <i className="bi bi-check-all display-1 text-success d-block mb-3"></i>
              <h4>No hay pedidos pendientes por elaborar en el taller</h4>
            </div>
          ) : (
            orders.map((order) => {
              const isPreparing = order.status === 'EN_PREPARACION';

              return (
                <div key={order.id} className="col-12 col-md-6 col-lg-4">
                  <div className={`card h-100 shadow-sm ${isPreparing ? 'border-info' : 'border-warning'}`}>
                    <div className={`card-header fw-bold d-flex justify-content-between align-items-center ${isPreparing ? 'bg-info text-dark' : 'bg-warning text-dark'}`}>
                      <span>Pedido #{order.id.slice(-5).toUpperCase()}</span>
                      <small className="badge bg-dark text-white">
                        {formatOrderTime(order.createdAt)}
                      </small>
                    </div>

                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="fw-bold mb-0">Productos a preparar:</h6>
                        <span className={`badge ${isPreparing ? 'bg-info text-dark' : 'bg-secondary'}`}>
                          {isPreparing ? '✂️️ Realizando el Detalle' : '⏳ Pendiente Recibir'}
                        </span>
                      </div>

                      <ul className="list-group list-group-flush mb-3">
                        {order.items?.map((item, idx) => (
                          <li key={idx} className="list-group-item px-0 d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center gap-2">
                              <img
                                src={item.image || (item.images && item.images[0])}
                                alt={item.title || item.name}
                                className="rounded border"
                                style={{ width: '42px', height: '42px', objectFit: 'cover', cursor: 'pointer' }}
                                onClick={() => openImageGallery(item)}
                                title="Ver carrusel de imágenes"
                              />
                              <div>
                                <span className="fw-bold d-block text-dark">
                                  <strong className="text-danger me-1">{item.quantity}x</strong>
                                  {item.title || item.name}
                                </span>
                              </div>
                            </div>

                            <button
                              className="btn btn-sm btn-outline-danger rounded-circle"
                              onClick={() => openImageGallery(item)}
                              title="Ver imágenes"
                            >
                              <i className="bi bi-zoom-in"></i>
                            </button>
                          </li>
                        ))}
                      </ul>

                      {order.customNote && (
                        <div className="alert alert-info py-2 fs-7 mb-0">
                          <strong><i className="bi bi-card-text me-1"></i>Nota / Mensaje:</strong>
                          <p className="mb-0 fst-italic">"{order.customNote}"</p>
                        </div>
                      )}
                    </div>

                    <div className="card-footer bg-white border-0 p-3 d-flex flex-column gap-2">
                      {!isPreparing ? (
                        <button 
                          onClick={() => handleStartPreparation(order.id)}
                          className="btn btn-primary btn-lg w-100 fw-bold shadow-sm"
                        >
                          <i className="bi bi-hand-thumbs-up-fill me-2"></i>
                          Dar Recibido y Elaborar
                        </button>
                      ) : (
                        <div className="d-flex flex-column gap-2">
                          <button 
                            onClick={() => handleFinishPreparation(order.id)}
                            className="btn btn-success btn-lg w-100 fw-bold shadow-sm"
                          >
                            <i className="bi bi-truck me-2"></i>
                            Listo para Domicilio
                          </button>
                          <button 
                            onClick={() => handlePickupInStore(order.id)}
                            className="btn btn-outline-dark btn-md w-100 fw-bold"
                          >
                            <i className="bi bi-shop me-2"></i>
                            Retirado en Tienda / Taller
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {modalData && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.88)', zIndex: 1060 }}
          onClick={() => setModalData(null)}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content border-0 shadow-lg bg-dark text-white rounded-4 overflow-hidden">
              <div className="modal-header border-secondary d-flex justify-content-between align-items-center p-3">
                <div>
                  <h5 className="modal-title fw-bold text-white mb-0">
                    <i className="bi bi-flower2 me-2 text-danger"></i>
                    {modalData.title}
                  </h5>
                  {modalData.images.length > 1 && (
                    <small className="text-muted">
                      Foto {modalData.activeIndex + 1} de {modalData.images.length}
                    </small>
                  )}
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setModalData(null)}
                ></button>
              </div>

              <div className="modal-body text-center p-2 bg-black position-relative d-flex align-items-center justify-content-center" style={{ minHeight: '380px' }}>
                {modalData.images.length > 1 && (
                  <button
                    className="btn btn-dark bg-opacity-75 text-white position-absolute start-0 ms-3 rounded-circle p-2 fs-4 shadow border"
                    style={{ zIndex: 10 }}
                    onClick={handlePrevImage}
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                )}

                <img
                  src={modalData.images[modalData.activeIndex]}
                  alt={`${modalData.title} ${modalData.activeIndex + 1}`}
                  className="img-fluid rounded"
                  style={{ maxHeight: '70vh', objectFit: 'contain', width: '100%' }}
                />

                {modalData.images.length > 1 && (
                  <button
                    className="btn btn-dark bg-opacity-75 text-white position-absolute end-0 me-3 rounded-circle p-2 fs-4 shadow border"
                    style={{ zIndex: 10 }}
                    onClick={handleNextImage}
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>
                )}
              </div>

              {modalData.images.length > 1 && (
                <div className="bg-dark p-2 border-top border-secondary d-flex justify-content-center gap-2 overflow-auto">
                  {modalData.images.map((imgUrl, idx) => (
                    <img
                      key={idx}
                      src={imgUrl}
                      alt={`Miniatura ${idx + 1}`}
                      className={`rounded border ${modalData.activeIndex === idx ? 'border-danger border-3' : 'border-secondary opacity-50'}`}
                      style={{ width: '60px', height: '60px', objectFit: 'cover', cursor: 'pointer' }}
                      onClick={() => setModalData((prev) => ({ ...prev, activeIndex: idx }))}
                    />
                  ))}
                </div>
              )}

              <div className="modal-footer border-secondary justify-content-between">
                <span className="small text-muted">
                  Guía visual para confección en taller
                </span>
                <button
                  type="button"
                  className="btn btn-outline-light btn-sm rounded-pill px-4 fw-bold"
                  onClick={() => setModalData(null)}
                >
                  Cerrar Visor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}