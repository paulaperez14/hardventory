
'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { getSuppliers, deleteSupplier } from '@/lib/suppliers';
import { Supplier } from '@/types/firestore';
import SupplierForm from '@/components/forms/SupplierForm'; // Import the form

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [supplierToDeleteId, setSupplierToDeleteId] = useState<string | null>(null);

  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | undefined>(undefined);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSuppliers();
      setSuppliers(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setSelectedSupplier(undefined);
    setShowSupplierForm(true);
  };

  const handleEditClick = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowSupplierForm(true);
  };

  const handleFormSuccess = () => {
    setShowSupplierForm(false);
    setSelectedSupplier(undefined);
    fetchSuppliers(); // Refresh the list
  };

  const handleDeleteClick = (id: string) => {
    setSupplierToDeleteId(id);
    setShowDeleteConfirmModal(true);
  };

  const confirmDeleteSupplier = async () => {
    if (supplierToDeleteId) {
      try {
        await deleteSupplier(supplierToDeleteId);
        fetchSuppliers(); // Refresh the list
      } catch (e: any) {
        setError(`Failed to delete supplier: ${e.message}`);
      } finally {
        setShowDeleteConfirmModal(false);
        setSupplierToDeleteId(null);
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Supplier Management" description="Manage your product suppliers.">
        <Button onClick={handleAddClick}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Supplier
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Supplier List</CardTitle>
          <CardDescription>View, edit, and manage all product suppliers.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Loading suppliers...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-destructive">
                    Error loading suppliers: {error}
                  </TableCell>
                </TableRow>
              ) : suppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No suppliers found.
                  </TableCell>
                </TableRow>
              ) : (
                suppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>{supplier.contactName || 'N/A'}</TableCell>
                    <TableCell>{supplier.contactEmail || 'N/A'}</TableCell>
                    <TableCell>{supplier.contactPhone || 'N/A'}</TableCell>
                    <TableCell className="text-right min-w-[100px]">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditClick(supplier)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            onClick={() => {
                              if (supplier.id) {
                                handleDeleteClick(supplier.id);
                              }
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
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

      {/* Supplier Form Dialog */}
      <Dialog open={showSupplierForm} onOpenChange={setShowSupplierForm}>
        <DialogContent className="sm:max-w-lg"> {/* Increased width */}
          <DialogHeader>
            <DialogTitle>{selectedSupplier ? 'Editar Proveedor' : 'Añadir Proveedor'}</DialogTitle>
            <DialogDescription>
              {selectedSupplier ? 'Actualice los datos de este proveedor.' : 'Introduzca los datos del nuevo proveedor.'}
            </DialogDescription>
          </DialogHeader>
          {/* Removed top padding from this div wrapper, reduced DialogContent grid gap handles it */}
          <div className="pb-4 max-h-[70vh] overflow-y-auto pr-2"> 
            <SupplierForm supplier={selectedSupplier} onSuccess={handleFormSuccess} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Delete Modal */}
      <Dialog open={showDeleteConfirmModal} onOpenChange={setShowDeleteConfirmModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Está seguro de que desea eliminar este proveedor? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirmModal(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDeleteSupplier}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
