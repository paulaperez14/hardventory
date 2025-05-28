// src/lib/suppliers.ts
import { collection, addDoc, getDocs, query, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase'; // Assuming your firebase.ts file is in the same directory
import { Supplier } from '../types/firestore'; // Assuming your firestore.ts file is in ../types

const suppliersCollectionRef = collection(db, 'suppliers');

export const addSupplier = async (supplier: Supplier) => {
  try {
    await addDoc(suppliersCollectionRef, supplier);
    console.log('Supplier added successfully!');
  } catch (e) {
    console.error('Error adding supplier: ', e);
  }
};

// Added getSuppliers function
export const getSuppliers = async (): Promise<Supplier[]> => {
  try {
    const q = query(suppliersCollectionRef);
    const querySnapshot = await getDocs(q);
    const suppliers: Supplier[] = [];
    querySnapshot.forEach((doc) => {
      suppliers.push({ id: doc.id, ...doc.data() } as Supplier);
    });
    return suppliers;
  } catch (e) {
    console.error('Error getting suppliers: ', e);
    return [];
  }
};

// Added getSupplier function
export const getSupplier = async (id: string): Promise<Supplier | null> => {
  try {
    const supplierDocRef = doc(db, 'suppliers', id);
    const supplierSnapshot = await getDoc(supplierDocRef);
    if (supplierSnapshot.exists()) {
      return { id: supplierSnapshot.id, ...supplierSnapshot.data() as Supplier };
    } else {
      console.log('No such supplier!');
      return null;
    }
  } catch (e) {
    console.error('Error getting supplier: ', e);
    return null;
  }
};

// Added updateSupplier function
export const updateSupplier = async (id: string, newData: Partial<Supplier>) => {
  try {
    const supplierDocRef = doc(db, 'suppliers', id);
    await updateDoc(supplierDocRef, newData);
    console.log('Supplier updated successfully!');
  } catch (e) {
    console.error('Error updating supplier: ', e);
  }
};

// Added deleteSupplier function
export const deleteSupplier = async (id: string) => {
  try {
    const supplierDocRef = doc(db, 'suppliers', id);
    await deleteDoc(supplierDocRef);
    console.log('Supplier deleted successfully!');
  } catch (e) {
    console.error('Error deleting supplier: ', e);
  }
};