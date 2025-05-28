
// src/components/forms/SupplierForm.tsx
import React, { useState, useEffect } from 'react';
import { Supplier } from '../../types/firestore';
import { addSupplier, updateSupplier } from '../../lib/suppliers';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface SupplierFormProps {
  supplier?: Supplier; // Optional supplier for editing
  onSuccess?: () => void; // Optional callback on successful submission
}

const SupplierForm: React.FC<SupplierFormProps> = ({ supplier, onSuccess }) => {
  const initialFormData: Partial<Supplier> = {
    name: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
  };

  const [formData, setFormData] = useState<Partial<Supplier>>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || '',
        contactName: supplier.contactName || '',
        contactEmail: supplier.contactEmail || '',
        contactPhone: supplier.contactPhone || '',
      });
    } else {
      setFormData(initialFormData);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplier]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!formData.name?.trim()) {
      setError('El nombre del proveedor no puede estar vacío.');
      setLoading(false);
      return;
    }

    try {
      const dataToSave: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'> = {
        name: formData.name!,
        contactName: formData.contactName || undefined,
        contactEmail: formData.contactEmail || undefined,
        contactPhone: formData.contactPhone || undefined,
      };

      if (supplier?.id) {
        await updateSupplier(supplier.id, dataToSave);
      } else {
        await addSupplier(dataToSave as Supplier); // Firestore will generate ID
        setFormData(initialFormData); // Clear form after adding
      }
      if (onSuccess) {
        onSuccess();
      }
    } catch (e: any) {
      setError(e.message || 'Ocurrió un error al guardar el proveedor.');
    } finally {
      setLoading(false);
    }
  };

  const inputClassName = "mt-1 block w-full";
  const labelClassName = "block text-sm font-medium";

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 pt-2 pb-4"> {/* Reduced top padding */}
      <div className="grid gap-2">
        <Label htmlFor="name" className={labelClassName}>Nombre del Proveedor</Label>
        <Input
          type="text"
          id="name"
          name="name"
          value={formData.name || ''}
          onChange={handleChange}
          required
          placeholder="Ej. Proveedor Principal S.A."
          className={inputClassName}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="contactName" className={labelClassName}>Nombre de Contacto</Label>
        <Input
          type="text"
          id="contactName"
          name="contactName"
          value={formData.contactName || ''}
          onChange={handleChange}
          placeholder="Ej. Juan Pérez"
          className={inputClassName}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="contactEmail" className={labelClassName}>Email de Contacto</Label>
        <Input
          type="email"
          id="contactEmail"
          name="contactEmail"
          value={formData.contactEmail || ''}
          onChange={handleChange}
          placeholder="Ej. contacto@proveedor.com"
          className={inputClassName}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="contactPhone" className={labelClassName}>Teléfono de Contacto</Label>
        <Input
          type="tel"
          id="contactPhone"
          name="contactPhone"
          value={formData.contactPhone || ''}
          onChange={handleChange}
          placeholder="Ej. +1 234 567 890"
          className={inputClassName}
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full mt-2">
        {loading ? (supplier ? 'Actualizando...' : 'Añadiendo...') : (supplier ? 'Actualizar Proveedor' : 'Añadir Proveedor')}
      </Button>
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </form>
  );
};

export default SupplierForm;
