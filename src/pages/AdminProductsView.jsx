// src/pages/AdminProductsView.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  subscribeToProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} from '../services/productsService';

export function AdminProductsView() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Referencia para limpiar el input de tipo file
  const fileInputRef = useRef(null);

  // Campos del formulario
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Ramos');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  
  // Estado para imágenes existentes (URLs de Firebase) y nuevas imágenes seleccionadas (File objects)
  const [existingImages, setExistingImages] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeToProducts((data) => {
      setProducts(data);
    });
    return () => unsubscribe();
  }, []);

  // Manejar selección acumulativa de nuevas imágenes
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Combinar los archivos previamente seleccionados con los nuevos seleccionados
    const updatedFiles = [...selectedFiles, ...files];
    const totalCount = existingImages.length + updatedFiles.length;

    if (totalCount > 10) {
      alert('Solo se permite un máximo de 10 imágenes por producto.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFiles(updatedFiles);

    // Resetear el valor del input para permitir seleccionar más imágenes en un clic posterior
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Quitar una imagen de las guardadas previamente en Firebase
  const handleRemoveExistingImage = (indexToRemove) => {
    setExistingImages(existingImages.filter((_, idx) => idx !== indexToRemove));
  };

  // Quitar una imagen de las nuevas seleccionadas localmente
  const handleRemoveNewFile = (indexToRemove) => {
    setSelectedFiles(selectedFiles.filter((_, idx) => idx !== indexToRemove));
  };

  const resetForm = () => {
    setEditingId(null);
    setCode('');
    setTitle('');
    setCategory('Ramos');
    setPrice('');
    setDescription('');
    setExistingImages([]);
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setCode(product.code || '');
    setTitle(product.title || '');
    setCategory(product.category || 'Ramos');
    setPrice(product.price || '');
    setDescription(product.description || '');
    setExistingImages(product.images || []);
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      try {
        await deleteProduct(id);
      } catch (err) {
        console.error('Error al eliminar producto:', err);
        alert('Ocurrió un error al intentar eliminar el producto.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (existingImages.length + selectedFiles.length > 10) {
      alert('El producto no puede tener más de 10 imágenes.');
      return;
    }

    setLoading(true);
    try {
      const productData = { 
        code, 
        title, 
        category, 
        price: Number(price) || 0, 
        description 
      };

      if (editingId) {
        await updateProduct(editingId, productData, selectedFiles, existingImages);
      } else {
        await createProduct(productData, selectedFiles);
      }

      resetForm();
    } catch (err) {
      console.error('Error al guardar producto:', err);
      alert('Error al guardar el producto. Revisa la consola o las reglas de Firebase.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4" style={{ maxWidth: '900px' }}>
      <h2 className="fw-bold text-center mb-4">
        <i className="bi bi-box-seam me-2 text-danger"></i>
        Gestión de Productos (Admin)
      </h2>

      {/* Formulario de Creación / Edición */}
      <div className="card shadow-sm border-0 mb-5 p-4 rounded-3">
        <h4 className="fw-bold text-dark mb-3">
          {editingId ? '✏️ Editar Producto' : '➕ Agregar Nuevo Producto'}
        </h4>

        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label small fw-bold">Código / SKU</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej: ROS-001"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>

            <div className="col-md-8">
              <label className="form-label small fw-bold">Nombre del Producto</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej: Ramo Dubay"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label small fw-bold">Categoría</label>
              <select 
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Ramos">Ramos</option>
                <option value="Desayunos">Desayunos</option>
                <option value="Peluches">Peluches</option>
                <option value="Mensajes">Mensajes</option>
                <option value="Especiales">Especiales</option>
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label small fw-bold">Precio ($ COP)</label>
              <input
                type="number"
                className="form-control"
                placeholder="79000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>

            <div className="col-12">
              <label className="form-label small fw-bold">Descripción</label>
              <textarea
                className="form-control"
                rows="3"
                placeholder="Detalles sobre las flores, empaque, etc."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>
            </div>

            {/* Subida de Imágenes */}
            <div className="col-12">
              <label className="form-label small fw-bold">
                Imágenes del Producto (Máximo 10)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                className="form-control"
                accept="image/*"
                multiple
                onChange={handleFileChange}
              />
              <small className="text-muted d-block mt-1">
                Guardadas en BD: {existingImages.length} | Seleccionadas para subir: {selectedFiles.length} (Total máximo: 10)
              </small>
            </div>

            {/* Previsualización de Imágenes Guardadas en Firebase (modo edición) */}
            {existingImages.length > 0 && (
              <div className="col-12">
                <p className="small fw-bold mb-2">Imágenes guardadas actualmente:</p>
                <div className="d-flex flex-wrap gap-2">
                  {existingImages.map((imgUrl, idx) => (
                    <div key={`existing-${idx}`} className="position-relative">
                      <img 
                        src={imgUrl} 
                        alt="Preview de BD" 
                        className="rounded border" 
                        style={{ width: '75px', height: '75px', objectFit: 'cover' }} 
                      />
                      <button
                        type="button"
                        className="btn btn-danger btn-sm position-absolute p-0 rounded-circle"
                        style={{ width: '20px', height: '20px', fontSize: '10px', top: '-5px', right: '-5px' }}
                        onClick={() => handleRemoveExistingImage(idx)}
                        title="Eliminar imagen guardada"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Previsualización de Nuevas Imágenes Seleccionadas */}
            {selectedFiles.length > 0 && (
              <div className="col-12">
                <p className="small fw-bold mb-2 text-primary">Nuevas imágenes por agregar:</p>
                <div className="d-flex flex-wrap gap-2">
                  {selectedFiles.map((file, idx) => (
                    <div key={`new-${idx}`} className="position-relative">
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt={`Nuevas-${idx}`} 
                        className="rounded border border-primary" 
                        style={{ width: '75px', height: '75px', objectFit: 'cover' }} 
                      />
                      <button
                        type="button"
                        className="btn btn-danger btn-sm position-absolute p-0 rounded-circle"
                        style={{ width: '20px', height: '20px', fontSize: '10px', top: '-5px', right: '-5px' }}
                        onClick={() => handleRemoveNewFile(idx)}
                        title="Quitar esta imagen"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botones del Formulario */}
            <div className="col-12 d-flex gap-2 justify-content-end mt-4">
              {editingId && (
                <button
                  type="button"
                  className="btn btn-outline-secondary fw-bold"
                  onClick={resetForm}
                  disabled={loading}
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                className="btn btn-danger fw-bold px-4"
                disabled={loading}
              >
                {loading ? 'Guardando...' : editingId ? 'Actualizar Producto' : 'Guardar Producto'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Lista / Tabla de Productos */}
      <div className="card shadow-sm border-0 p-4 rounded-3">
        <h4 className="fw-bold mb-3">Catálogo en Inventario ({products.length})</h4>

        {products.length === 0 ? (
          <p className="text-muted text-center py-4">No hay productos registrados aún.</p>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>Imagen</th>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((prod) => (
                  <tr key={prod.id}>
                    <td>
                      {prod.images && prod.images.length > 0 ? (
                        <img 
                          src={prod.images[0]} 
                          alt={prod.title} 
                          className="rounded border" 
                          style={{ width: '50px', height: '50px', objectFit: 'cover' }} 
                        />
                      ) : (
                        <div className="bg-light rounded border text-center py-2" style={{ width: '50px', height: '50px' }}>
                          <i className="bi bi-image text-muted"></i>
                        </div>
                      )}
                    </td>
                    <td className="fw-bold">{prod.code}</td>
                    <td>{prod.title}</td>
                    <td><span className="badge bg-secondary">{prod.category}</span></td>
                    <td className="fw-bold text-success">${Number(prod.price).toLocaleString('es-CO')}</td>
                    <td className="text-end">
                      <button 
                        className="btn btn-sm btn-outline-primary me-2"
                        onClick={() => handleEdit(prod)}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(prod.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}