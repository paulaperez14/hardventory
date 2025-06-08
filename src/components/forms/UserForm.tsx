
// src/components/forms/UserForm.tsx
import React, { useState, useEffect } from 'react';
import type { User as FirestoreUser } from '../../types/firestore';
import type { UserRole } from '@/types';
import { updateUser } from '../../lib/users';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface UserFormProps {
  user: FirestoreUser; // User to edit, must be provided
  onSuccess?: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ user, onSuccess }) => {
  const [formData, setFormData] = useState<Partial<Pick<FirestoreUser, 'name' | 'role'>>>({
    name: '',
    role: 'vendedor', // Default role
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        role: user.role || 'vendedor',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleRoleChange = (value: UserRole) => {
    setFormData((prevData) => ({ ...prevData, role: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!user?.id) {
      setError("Falta el ID de usuario. No se puede actualizar el usuario.");
      setLoading(false);
      toast({ title: "Actualización fallida", description: "Falta el ID de usuario.", variant: "destructive" });
      return;
    }
    if (!formData.name?.trim()) {
        setError("El nombre no puede estar vacío.");
        setLoading(false);
        toast({ title: "Actualización fallida", description: "El nombre no puede estar vacío.", variant: "destructive" });
        return;
    }

    try {
      const dataToUpdate: Partial<Pick<FirestoreUser, 'name' | 'role' | 'avatar'>> = {
        name: formData.name,
        role: formData.role as UserRole,
      };
      
      await updateUser(user.id, dataToUpdate);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (e: any) {
      setError(e.message);
      toast({ title: "Actualización fallida", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      {error && <p className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">{error}</p>}
      
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="email-edit" className="text-right">Email</Label>
        <Input
          id="email-edit"
          type="email"
          value={user?.email || ''}
          readOnly
          className="col-span-3 bg-muted/50 cursor-not-allowed"
        />
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name-edit" className="text-right">Nombre</Label>
        <Input
          id="name-edit"
          name="name"
          value={formData.name || ''}
          onChange={handleChange}
          required
          className="col-span-3"
        />
      </div>
      
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="role-edit" className="text-right">Rol</Label>
        <Select value={formData.role} onValueChange={(value) => handleRoleChange(value as UserRole)}>
          <SelectTrigger className="col-span-3">
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="vendedor">Vendedor</SelectItem>
            <SelectItem value="bodega">Bodega</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" type="button" onClick={onSuccess} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Actualizando...' : 'Actualizar Usuario'}
        </Button>
      </div>
    </form>
  );
};

export default UserForm;
