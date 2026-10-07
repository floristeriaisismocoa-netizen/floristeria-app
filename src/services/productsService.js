// src/services/productsService.js
import { db, storage } from '../config/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs,
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const PRODUCTS_COLLECTION = 'products';

// Escuchar productos en tiempo real
export const subscribeToProducts = (callback) => {
  const productsRef = collection(db, PRODUCTS_COLLECTION);
  return onSnapshot(productsRef, (snapshot) => {
    const products = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
    callback(products);
  });
};

// Obtener lista completa de productos (Promise para la vista Admin)
export const getProducts = async () => {
  const productsRef = collection(db, PRODUCTS_COLLECTION);
  const snapshot = await getDocs(productsRef);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data()
  }));
};

// Subir una lista de archivos de imagen a Firebase Storage
export const uploadProductImages = async (files) => {
  if (!files || files.length === 0) return [];
  const uploadPromises = Array.from(files).map(async (file) => {
    const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  });
  return await Promise.all(uploadPromises);
};

// Crear producto
export const createProduct = async (productData, imageFiles) => {
  let imageUrls = [];
  if (imageFiles && imageFiles.length > 0) {
    imageUrls = await uploadProductImages(imageFiles);
  }

  const finalImages = [...(productData.existingImages || []), ...imageUrls];

  const payload = { ...productData };
  delete payload.existingImages;

  return await addDoc(collection(db, PRODUCTS_COLLECTION), {
    ...payload,
    price: Number(productData.price),
    images: finalImages,
    createdAt: serverTimestamp()
  });
};

// Alias para compatibilidad con AdminProductsView
export const addProduct = createProduct;

// Actualizar producto
export const updateProduct = async (id, productData, newImageFiles = []) => {
  let newUrls = [];
  if (newImageFiles && newImageFiles.length > 0) {
    newUrls = await uploadProductImages(newImageFiles);
  }

  const existing = productData.existingImages || [];
  const finalImages = [...existing, ...newUrls];

  const payload = { ...productData };
  delete payload.existingImages;

  const productRef = doc(db, PRODUCTS_COLLECTION, id);
  return await updateDoc(productRef, {
    ...payload,
    price: Number(productData.price),
    images: finalImages,
    updatedAt: serverTimestamp()
  });
};

// Eliminar producto
export const deleteProduct = async (id) => {
  const productRef = doc(db, PRODUCTS_COLLECTION, id);
  return await deleteDoc(productRef);
};

// Crear pedido para Taller
export const createOrder = async (cartItems, total) => {
  return await addDoc(collection(db, 'orders'), {
    items: cartItems,
    total: total,
    status: 'EN_PREPARACION',
    createdAt: serverTimestamp()
  });
};