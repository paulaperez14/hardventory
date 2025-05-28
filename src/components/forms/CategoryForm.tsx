// src/components/forms/CategoryForm.tsx
import React, { useState, useEffect } from 'react';
import { Category } from '../../types/firestore';
import { addCategory, updateCategory } from '../../lib/categories';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface CategoryFormProps {
  category?: Category; // Optional category for editing
  onSuccess?: () => void; // Optional callback on successful submission
}

const CategoryForm: React.FC<CategoryFormProps> = ({ category, onSuccess }) => {
  const [name, setName] = useState(category?.name || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(category?.name || '');
  }, [category]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('El nombre de la categoría no puede estar vacío.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (category?.id) {
        // Editing existing category
        await updateCategory(category.id, { name });
      } else {
        // Adding new category
        await addCategory({ name });
      }
      if (onSuccess) {
        onSuccess();
      }
      if (!category?.id) setName(''); // Clear form after successful submission if adding
    } catch (e: any) {
      setError(e.message || 'Ocurrió un error al guardar la categoría.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Nombre de Categoría</Label>
        <Input
          type="text"
          id="name"
          name="name"
          value={name}
          onChange={handleChange}
          required
          placeholder="Ej. Electrónicos"
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (category ? 'Editando...' : 'Añadiendo...') : (category ? 'Editar Categoría' : 'Añadir Categoría')}
      </Button>
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </form>
  );
};

export default CategoryForm;
