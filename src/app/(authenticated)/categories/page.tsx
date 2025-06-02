'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { getCategories, deleteCategory } from '@/lib/categories';
import CategoryForm from '@/components/forms/CategoryForm';
import { Category } from '@/types/firestore';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'; 

export default function CategoriesPage() {
  const [showForm, setShowForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>(undefined);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [categoryToDeleteId, setCategoryToDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setSelectedCategory(undefined);
    setShowForm(true);
  };
  
  const handleEditClick = (category: Category) => {
    setSelectedCategory(category);
    setShowForm(true);
  };

  const handleDeleteClick = (id: string) => {
    setCategoryToDeleteId(id);
    setShowDeleteConfirmModal(true);
  };
  
  const confirmDeleteCategory = async () => {
    if (categoryToDeleteId) {
      try {
        await deleteCategory(categoryToDeleteId);
        fetchCategories(); // Refresh the list after deletion
      } catch (e: any)
      {
        setError(e.message);
      } finally {
        setShowDeleteConfirmModal(false);
        setCategoryToDeleteId(null);
      }
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedCategory(undefined); 
    fetchCategories(); 
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Gestión de Categorías">
         <Button onClick={handleAddClick}>
            <PlusCircle className="mr-2 h-4 w-4" /> Añadir Categoría
          </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Categorías</CardTitle>
          <CardDescription>Ver, editar, y gestionar todas las categorías de los productos.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center">Cargando categorías...</TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-destructive">Error cargando categorías: {error}</TableCell>
                </TableRow>
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center">No se encontraron categorías.</TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-right min-w-[100px]">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditClick(category)}>
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive focus:bg-destructive/10"
                          onClick={() => {
                            if (category.id) handleDeleteClick(category.id);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Category Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedCategory ? 'Editar Categoría' : 'Añadir Categoría'}</DialogTitle>
            <DialogDescription>
              {selectedCategory ? 'Actualice el nombre de la categoría.' : 'Introduzca los datos de la nueva categoría.'}
            </DialogDescription>
          </DialogHeader>
          <CategoryForm category={selectedCategory} onSuccess={handleFormSuccess} />
        </DialogContent>
      </Dialog>

      {/* Confirmation Delete Modal */}
      <Dialog open={showDeleteConfirmModal} onOpenChange={setShowDeleteConfirmModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>¿Está seguro de que desea eliminar esta categoría? Esta acción no se puede deshacer.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirmModal(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDeleteCategory}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
