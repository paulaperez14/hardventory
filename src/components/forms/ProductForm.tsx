// src/components/forms/ProductForm.tsx
import React, { useState, useEffect } from 'react';
import { Product, Category, Supplier } from '../../types/firestore';
import { addProduct, updateProduct } from '../../lib/products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProductFormProps {
  product?: Product;
  categories?: Category[];
  suppliers?: Supplier[];
  onSuccess?: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ product, categories = [], suppliers = [], onSuccess }) => {
  const initialFormData: Partial<Product> = {
    name: '',
    description: '',
    specifications: '',
    price: 0,
    categoryId: '',
    supplierId: '',
    quantity: 0,
    lowStockThreshold: 5,
    imageUrl: '',
  };

  const [formData, setFormData] = useState<Partial<Product>>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        specifications: product.specifications || '',
        price: product.price || 0,
        categoryId: product.categoryId || '',
        supplierId: product.supplierId || '',
        quantity: product.quantity || 0,
        lowStockThreshold: product.lowStockThreshold || 5,
        imageUrl: product.imageUrl || '',
      });
    } else {
      setFormData(initialFormData);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'price' || name === 'quantity' || name === 'lowStockThreshold' ? parseFloat(value) || 0 : value,
    });
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!formData.name || formData.price === undefined || !formData.categoryId) {
         setError('Por favor, rellene todos los campos obligatorios: Nombre del Producto, Precio, Categoría.');
         setLoading(false);
         return;
    }

    try {
      // Construct the object for Firestore, ensuring all required fields are present
      // and optional fields are handled correctly.
      const dataToSave: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'sku'> = { 
        name: formData.name!, // Asserting because it's checked above
        description: formData.description || '', // Default to empty string if undefined
        specifications: formData.specifications || '', // Default to empty string
        price: formData.price!, // Asserting, checked
        categoryId: formData.categoryId!, // Asserting, checked
        supplierId: formData.supplierId! === '' ? undefined : formData.supplierId!, // Set to undefined if empty string, else use value
        quantity: formData.quantity === undefined ? 0 : formData.quantity, // Default to 0 if undefined
        lowStockThreshold: formData.lowStockThreshold === undefined ? 5 : formData.lowStockThreshold, // Default
        imageUrl: formData.imageUrl || '', // Default to empty string
      };


      if (product && product.id) {
        await updateProduct(product.id, dataToSave);
      } else {
        await addProduct(dataToSave as Product); // Cast as product for add (which expects all fields eventually)
        setFormData(initialFormData); 
      }
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Error saving product:', err);
      setError(err.message || 'Ocurrió un error al guardar el producto.');
    } finally {
      setLoading(false);
    }
  };

  const inputClassName = "w-full h-10 px-3 py-2 border rounded-md text-sm flex items-center justify-between"; 
  const labelClassName = "block text-sm font-medium"; 

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name" className={labelClassName}>Nombre del Producto</Label>
        <Input id="name" name="name" value={formData.name || ''} onChange={handleChange} required className={inputClassName} />
      </div>
      <div>
        <Label htmlFor="description" className={labelClassName}>Descripción</Label>
        <Textarea id="description" name="description" value={formData.description || ''} onChange={handleChange} className={inputClassName} />
      </div>
      <div>
        <Label htmlFor="specifications" className={labelClassName}>Especificaciones del Producto</Label>
        <Textarea 
          id="specifications" 
          name="specifications" 
          value={formData.specifications || ''} 
          onChange={handleChange} 
          placeholder="e.g., Material: Acero, Dimensiones: 10x5x2 cm, Peso: 0.5kg" 
          className={inputClassName} 
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price" className={labelClassName}>Precio</Label>
          <Input type="number" id="price" name="price" value={formData.price || 0} onChange={handleChange} required step="0.01" className={inputClassName} />
        </div>
        <div>
          <Label htmlFor="quantity" className={labelClassName}>Cantidad</Label>
          <Input type="number" id="quantity" name="quantity" value={formData.quantity || 0} onChange={handleChange} required className={inputClassName} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="categoryId" className={labelClassName}>Categoría</Label>
          <Select name="categoryId" value={formData.categoryId || ''} onValueChange={(value) => handleSelectChange('categoryId', value)} required>
            <SelectTrigger className={inputClassName} id="categoryId">
              <SelectValue placeholder="Seleccionar categoría" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => cat.id && cat.id.trim() !== '' && (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="supplierId" className={labelClassName}>Proveedor</Label>
          <Select name="supplierId" value={formData.supplierId || ''} onValueChange={(value) => handleSelectChange('supplierId', value)}>
            <SelectTrigger className={inputClassName} id="supplierId">
              <SelectValue placeholder="Sin Proveedor" />
            </SelectTrigger>
            <SelectContent>
              {/* Removed problematic <SelectItem value=""> for supplier */}
              {suppliers.map(sup => sup.id && sup.id.trim() !== '' && (
                <SelectItem key={sup.id} value={sup.id}>{sup.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="lowStockThreshold" className={labelClassName}>Cantidad Bajo Stock</Label>
        <Input type="number" id="lowStockThreshold" name="lowStockThreshold" value={formData.lowStockThreshold || 0} onChange={handleChange} required className={inputClassName} />
      </div>
      <div>
        <Label htmlFor="imageUrl" className={labelClassName}>URL de la Imagen del Producto</Label>
        <Input id="imageUrl" name="imageUrl" placeholder="https://placehold.co/300x200.png" value={formData.imageUrl || ''} onChange={handleChange} className={inputClassName} />
        <p className="mt-1 text-xs text-muted-foreground">
          Si no se carga ninguna imagen, se utilizará un marcador de posición predeterminado.
        </p>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Guardando...' : (product && product.id) ? 'Actualizar Producto' : 'Añadir Producto'}
      </Button>
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </form>
  );
};

export default ProductForm;
