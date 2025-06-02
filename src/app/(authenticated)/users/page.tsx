
'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Edit, Trash2, ShieldCheck, ShieldAlert, UserCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { UserRole } from '@/types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { getUsers, deleteUser, addUser, updateUser } from '@/lib/users';
import { Input } from '@/components/ui/input';
import type { User as FirestoreUser } from '@/types/firestore';
import { useToast } from '@/hooks/use-toast';
import UserForm from '@/components/forms/UserForm'; // For editing

const roleBadges: Record<UserRole, { text: string; icon: React.ElementType; variant: "default" | "secondary" | "outline" | "destructive" | null | undefined }> = {
  admin: { text: 'Admin', icon: ShieldCheck, variant: 'destructive' },
  bodega: { text: 'Bodega', icon: ShieldAlert, variant: 'default' },
  seller: { text: 'Seller', icon: UserCheck, variant: 'secondary' },
};

export default function UsersPage() {
  const { toast } = useToast();

  const getInitials = (name: string = '') => {
    const names = name.split(' ');
    let initials = names[0].substring(0, 1).toUpperCase();
    if (names.length > 1) {
      initials += names[names.length - 1].substring(0, 1).toUpperCase();
    }
    return initials;
  };

  const [users, setUsers] = useState<FirestoreUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [userToDeleteId, setUserToDeleteId] = useState<string | null>(null);
  
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('seller');

  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<FirestoreUser | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (e: any) {
      setError(e.message);
      toast({ title: "Error", description: `Failed to fetch users: ${e.message}`, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    setCreateError(null);
    if (newPassword.length < 6) {
      setCreateError("Password should be at least 6 characters long.");
      return;
    }
    try {
      const authInstance = getAuth();
      const userCredential = await createUserWithEmailAndPassword(authInstance, newEmail, newPassword);
      const uid = userCredential.user.uid;

      const newUserFirestore: FirestoreUser = { 
        id: uid, // Use Firebase Auth UID as Firestore document ID
        name: newName, 
        email: newEmail, 
        role: newUserRole,
        // avatar: can be set to a default or handled separately
      };
      await addUser(newUserFirestore);

      setShowAddUserModal(false);
      fetchUsers();
      toast({ title: "User Created", description: `${newName} has been successfully added.` });

      // Reset form fields
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewUserRole('seller');
    } catch (e: any) {
      setCreateError(e.message);
      toast({ title: "Creation Failed", description: e.message, variant: "destructive" });
    }
  };

  const handleDeleteClick = (userId: string) => {
    setUserToDeleteId(userId);
    setShowConfirmDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (userToDeleteId) {
      try {
        await deleteUser(userToDeleteId); // This only deletes from Firestore
        fetchUsers();
        toast({ title: "User Deleted", description: "User has been removed from the database." });
      } catch (e: any) {
        setError(`Error deleting user: ${e.message}`);
        toast({ title: "Deletion Failed", description: e.message, variant: "destructive" });
      } finally {
        setShowConfirmDeleteModal(false);
        setUserToDeleteId(null);
      }
    }
  };

  const handleEditClick = (user: FirestoreUser) => {
    setEditingUser(user);
    setShowEditUserModal(true);
  };

  const handleEditFormSuccess = () => {
    setShowEditUserModal(false);
    setEditingUser(null);
    fetchUsers();
    toast({ title: "User Updated", description: "User details have been successfully updated." });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="User Management" description="Manage user accounts and roles.">
        <Button onClick={() => setShowAddUserModal(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New User
        </Button>
      </PageHeader>

      {error && !loading && ( // Show general error if not loading and error exists
        <div className="mb-4 p-4 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>User List</CardTitle>
          <CardDescription>View, edit, and manage all user accounts.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Avatar</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">Loading users...</TableCell>
                </TableRow>
              ) : users.length === 0 && !error ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">No users found.</TableCell>
                </TableRow>
              ) : (
                users.map((user) => {
                  const roleInfo = roleBadges[user.role as UserRole];
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatar || `https://placehold.co/100x100.png?text=${getInitials(user.name)}`} alt={user.name} data-ai-hint="profile avatar small"/>
                          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {roleInfo ? (
                          <Badge variant={roleInfo.variant} className="capitalize flex items-center gap-1 w-fit">
                            <roleInfo.icon className="h-3.5 w-3.5" />
                            {roleInfo.text}
                          </Badge>
                        ) : (
                          <span className="capitalize">{user.role}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditClick(user)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                              onClick={() => {
                                if (user.id) {
                                  handleDeleteClick(user.id);
                                }
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add User Modal */}
      <Dialog open={showAddUserModal} onOpenChange={(isOpen) => { setShowAddUserModal(isOpen); if (!isOpen) setCreateError(null); }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Enter the details for the new user. A Firebase Auth account will also be created.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {createError && (
              <div className="text-destructive text-sm p-2 bg-destructive/10 rounded-md">{createError}</div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name-add" className="text-right">Name</Label>
              <Input id="name-add" value={newName} onChange={(e) => setNewName(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email-add" className="text-right">Email</Label>
              <Input id="email-add" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password-add" className="text-right">Password</Label>
              <Input id="password-add" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min. 6 characters" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role-add" className="text-right">Role</Label>
              <Select value={newUserRole} onValueChange={(value) => setNewUserRole(value as UserRole)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seller">Seller</SelectItem>
                  <SelectItem value="bodega">Bodega</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddUserModal(false); setCreateError(null); }}>Cancel</Button>
            <Button type="submit" onClick={handleCreateUser}>Add User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      {editingUser && (
        <Dialog open={showEditUserModal} onOpenChange={(isOpen) => { if (!isOpen) setEditingUser(null); setShowEditUserModal(isOpen); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User: {editingUser.name}</DialogTitle>
              <DialogDescription>Update the user's details below.</DialogDescription>
            </DialogHeader>
            <UserForm user={editingUser} onSuccess={handleEditFormSuccess} />
          </DialogContent>
        </Dialog>
      )}

      {/* Confirmation Delete Modal */}
      <Dialog open={showConfirmDeleteModal} onOpenChange={setShowConfirmDeleteModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>Are you sure you want to delete this user from the database? This action cannot be undone. Note: This does not delete their Firebase Auth account.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDeleteModal(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>Delete from Database</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
