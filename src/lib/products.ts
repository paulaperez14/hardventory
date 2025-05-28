// src/lib/products.ts

import { collection, addDoc, getDocs, query, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase'; // Assuming you have initialized firebase and exported db
import { Product } from '../types/firestore';

const productsCollection = collection(db, 'products');

export const addProduct = async (product: Product) => {
  try {
    const docRef = await addDoc(productsCollection, product);
    console.log('Document written with ID: ', docRef.id);
    return docRef.id;
  } catch (e) {
    console.error('Error adding document: ', e);
    throw e; // Re-throw the error for handling in the component
  }
};

export const getProducts = async (): Promise<Product[]> => {
  try {
    const q = query(productsCollection);
    const querySnapshot = await getDocs(q);
    const products: Product[] = [];
    querySnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() } as Product);
    });
    return products;
  } catch (e) {
    console.error('Error getting products: ', e);
    throw e;
  }
};

// Get a single product by ID
export const getProduct = async (id: string): Promise<Product | null> => {
  try {
    const productDocRef = doc(db, 'products', id);
    const productDocSnap = await getDoc(productDocRef);

    if (productDocSnap.exists()) {
      return { id: productDocSnap.id, ...productDocSnap.data() } as Product;
    } else {
      console.log('No such product!');
      return null;
    }
  } catch (e) {
    console.error('Error getting product: ', e);
    throw e;
  }
};

// Update a product
export const updateProduct = async (id: string, newData: Partial<Product>) => {
  try {
    const productDocRef = doc(db, 'products', id);
    await updateDoc(productDocRef, newData);
    console.log('Product updated successfully!');
  } catch (e) {
    console.error('Error updating product: ', e);
    throw e;
  }
};

// Delete a product
export const deleteProduct = async (id: string) => {
  try {
    const productDocRef = doc(db, 'products', id);
    await deleteDoc(productDocRef);
    console.log('Product deleted successfully!');
  } catch (e) {
    console.error('Error deleting product: ', e);
    throw e;
  }
};