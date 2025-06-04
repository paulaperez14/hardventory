// src/components/forms/ProductForm.tsx
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Product, Category, Supplier } from '../../types/firestore';
import { addProduct, updateProduct } from '../../lib/products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, XCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid'; // Genera un ID único para cada archivo

interface ProductFormProps {
  product?: Product;
  categories?: Category[];
  suppliers?: Supplier[];
  onSuccess?: () => void;
}

const initialFormData: Partial<Product> & { categoryId?: string; supplierId?: string } = {
  name: '',
  description: '',
  specifications: '',
  price: 0,
  categoryId: '', // Use empty string for unselected state
  supplierId: '', // Use empty string for unselected state
  quantity: 0,
  lowStockThreshold: 5,
  imageUrl: '',
};

const ProductForm: React.FC<ProductFormProps> = ({ product, categories = [], suppliers = [], onSuccess }) => {
  const [formData, setFormData] = useState<Partial<Product> & { categoryId?: string; supplierId?: string }>(initialFormData);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    // console.log('[ProductForm useEffect] Received product prop:', JSON.stringify(product));
    // console.log('[ProductForm useEffect] Received categories prop:', JSON.stringify(categories));
    // console.log('[ProductForm useEffect] Received suppliers prop:', JSON.stringify(suppliers));


    if (product && product.id) {
      const newFormData = {
        name: product.name ?? '',
        description: product.description ?? '',
        specifications: product.specifications ?? '',
        price: product.price ?? 0,
        categoryId: product.categoryId || '', // Ensure empty string if null/undefined
        supplierId: product.supplierId || '', // Ensure empty string if null/undefined
        quantity: product.quantity ?? 0,
        lowStockThreshold: product.lowStockThreshold ?? 5,
        imageUrl: product.imageUrl ?? '',
      };
      setFormData(newFormData);
      console.log('[ProductForm useEffect] Set formData for EDIT:', JSON.stringify(newFormData));
      setPreviewUrl(product.imageUrl || null);
    } else {
      setFormData(initialFormData);
      console.log('[ProductForm useEffect] Set formData to initialFormData for NEW product.');
      setPreviewUrl(null);
    }
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [product, categories, suppliers]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setFormData(prev => ({ ...prev, imageUrl: '' })); 
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setPreviewUrl(product?.imageUrl || null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevFormData => ({
      ...prevFormData,
      [name]: name === 'price' || name === 'quantity' || name === 'lowStockThreshold' ? parseFloat(value) || 0 : value,
    }));
    if (name === 'imageUrl') { 
        setSelectedFile(null); 
        setPreviewUrl(value || null);
        if (fileInputRef.current) {
          fileInputRef.current.value = ""; 
        }
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    console.log(`[ProductForm handleSelectChange] name: ${name}, value: "${value}"`);
    setFormData(prevFormData => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!formData.name || formData.price === undefined || !formData.categoryId) {
         setError('Por favor, rellene todos los campos obligatorios: Nombre del Producto, Precio, Categoría.');
         setLoading(false);
         toast({ variant: "destructive", title: "Error de Validación", description: "Nombre, precio y categoría son obligatorios." });
         return;
    }

    let finalImageUrl = formData.imageUrl || '';

    if (selectedFile) {
      setIsUploading(true);
      toast({ title: "Subiendo imagen...", description: "Por favor espere." });
      try {
        const uniqueFileName = `${uuidv4()}-${selectedFile.name.replace(/\s+/g, '_')}`;
        const presignedUrlResponse = await fetch('/api/s3-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: uniqueFileName, contentType: selectedFile.type }),
        });

        if (!presignedUrlResponse.ok) {
          const errorData = await presignedUrlResponse.json();
          throw new Error(errorData.error || 'Failed to get pre-signed URL from server.');
        }

        const { url, s3ObjectUrl } = await presignedUrlResponse.json();

        if (!url || !s3ObjectUrl) {
            throw new Error('Pre-signed URL or S3 Object URL not received from server.');
        }

        const uploadResponse = await fetch(url, {
            method: 'PUT',
            body: selectedFile,
            headers: { 'Content-Type': selectedFile.type }
        });

        if (!uploadResponse.ok) {
            let detailedMessage = `S3 Upload failed. Status: ${uploadResponse.status}.`;
            try {
                const s3ErrorText = await uploadResponse.text();
                if (s3ErrorText) {
                    detailedMessage += ` Response: ${s3ErrorText}`;
                }
            } catch (readError) {
                // Ignore if can't read text response from S3 error
            }
             if (uploadResponse.status === 403) {
                detailedMessage += " This could be a CORS issue on the S3 bucket or IAM permission problem.";
            }
            throw new Error(detailedMessage);
        }

        finalImageUrl = s3ObjectUrl;
        toast({ title: "Imagen Subida", description: "La imagen se ha subido correctamente a S3." });
      } catch (uploadError: any) {
        console.error('Error during image upload process:', uploadError);
        let detailedMessage = uploadError.message;
         if (uploadError instanceof TypeError && uploadError.message.toLowerCase().includes("failed to fetch")) {
          detailedMessage = "Failed to fetch. This might be due to network issues or CORS configuration on the S3 bucket. Please ensure the S3 bucket allows PUT requests from this origin and check browser console for more details.";
        }
        setError(`Error al subir imagen: ${detailedMessage}`);
        toast({ variant: "destructive", title: "Error de Subida", description: `Error al subir imagen: ${detailedMessage}`, duration: 9000 });
        setIsUploading(false);
        setLoading(false);
        return;
      }
      setIsUploading(false);
    }


    try {
      const dataToSave: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
        name: formData.name!,
        description: formData.description || '',
        specifications: formData.specifications || '',
        price: typeof formData.price === 'number' ? formData.price : 0,
        categoryId: formData.categoryId!,
        supplierId: formData.supplierId || '',
        quantity: typeof formData.quantity === 'number' ? formData.quantity : 0,
        lowStockThreshold: typeof formData.lowStockThreshold === 'number' ? formData.lowStockThreshold : 5,
        imageUrl: finalImageUrl,
      };

      if (product && product.id) {
        await updateProduct(product.id, dataToSave);
        toast({ title: "Producto Actualizado", description: `${dataToSave.name} ha sido actualizado.` });
      } else {
        await addProduct(dataToSave as Product);
        toast({ title: "Producto Añadido", description: `${dataToSave.name} ha sido añadido.` });
        setFormData(initialFormData);
        setPreviewUrl(null);
        setSelectedFile(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
      }
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Error saving product:', err);
      setError(err.message || 'Ocurrió un error al guardar el producto.');
      toast({ variant: "destructive", title: "Error al Guardar", description: err.message || 'Ocurrió un error al guardar el producto.' });
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
        <Label htmlFor="productImageFile" className={labelClassName}>Subir Imagen del Producto</Label>
        <Input 
          id="productImageFile" 
          name="productImageFile" 
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className={inputClassName + " file:mr-4 file:py-1 file:px-4 file:rounded-full file:font-semibold file:bg-primary file:text-primary-foreground"}
          ref={fileInputRef}
          disabled={isUploading}
        />
        {selectedFile && (
            <Button variant="ghost" size="sm" onClick={clearSelectedFile} className="mt-2 text-destructive hover:text-destructive">
                <XCircle className="mr-2 h-4 w-4" /> Quitar imagen seleccionada
            </Button>
        )}
         <p className="mt-1 text-xs text-muted-foreground">
          Alternativamente, puede pegar una URL de imagen pública a continuación. La imagen subida tendrá prioridad.
        </p>
      </div>

      <div>
        <Label htmlFor="imageUrl" className={labelClassName}>URL de la Imagen del Producto (si no sube una)</Label>
        <Input 
          id="imageUrl" 
          name="imageUrl" 
          placeholder="https://placehold.co/300x200.png" 
          value={formData.imageUrl || ''} 
          onChange={handleChange} 
          className={inputClassName}
          disabled={!!selectedFile || isUploading}
        />
      </div>

      {(previewUrl || formData.imageUrl) && (
        <div className="mt-4">
          <Label className={labelClassName}>Vista Previa de la Imagen:</Label>
          <div className="mt-2 relative w-32 h-32 border rounded-md flex items-center justify-center overflow-hidden">
            <Image 
                src={previewUrl || formData.imageUrl || "https://placehold.co/128x128.png"} 
                alt="Vista previa del producto" 
                fill
                style={{ objectFit: 'contain' }}
                className="rounded-md"
                onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://placehold.co/128x128.png?text=Error";
                    (e.target as HTMLImageElement).alt = "Error al cargar imagen";
                }}
                data-ai-hint="product image preview"
            />
          </div>
        </div>
      )}
      {!previewUrl && !formData.imageUrl && !selectedFile && (
        <div className="mt-2 p-4 border border-dashed rounded-md flex flex-col items-center justify-center text-muted-foreground h-28">
          <UploadCloud className="w-8 h-8 mb-1" />
          <span>No hay imagen seleccionada o URL proporcionada</span>
        </div>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Guardando...' : (product && product.id) ? 'Actualizar Producto' : 'Añadir Producto'}
      </Button>
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </form>
  );
};

export default ProductForm;
