import { db } from '../config/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';

const ORDERS_COLLECTION = 'orders';

// Crear nuevo pedido en Firestore
export const createOrder = async (orderData) => {
  try {
    const docRef = await addDoc(collection(db, ORDERS_COLLECTION), {
      ...orderData,
      status: 'PENDIENTE_PREPARACION',
      createdAt: serverTimestamp()
    });
    return { id: docRef.id, ...orderData };
  } catch (error) {
    console.error("Error al crear pedido en Firestore:", error);
    throw error;
  }
};

// Escuchar cambios de pedidos en tiempo real
export const subscribeToOrders = (callback) => {
  const ordersRef = collection(db, ORDERS_COLLECTION);
  
  return onSnapshot(ordersRef, (snapshot) => {
    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Ordenar de más reciente a más antiguo evaluando Timestamp o fecha en cliente
    orders.sort((a, b) => {
      const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
      const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });
    
    callback(orders);
  }, (error) => {
    console.error("Error en la suscripción a Firestore:", error);
  });
};

// Actualizar el estado de un pedido
export const updateOrderStatus = async (orderId, newStatus) => {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(orderRef, { status: newStatus });
  } catch (error) {
    console.error("Error al actualizar estado del pedido:", error);
    throw error;
  }
};

// Escuchar catálogo de productos en tiempo real (o fallback)
export const subscribeToProducts = (callback) => {
  const productsRef = collection(db, 'products');
  return onSnapshot(productsRef, (snapshot) => {
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(products);
  }, (error) => {
    console.error("Error al obtener productos de Firestore:", error);
    callback([]);
  });
};