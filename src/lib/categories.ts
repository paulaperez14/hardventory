// src/lib/categories.ts
import { collection, addDoc, getDocs, query, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase'; // Assuming your firebase.ts file is in the same directory
import { Category } from '../types/firestore'; // Assuming your firestore.ts file is in ../types

const categoriesCollectionRef = collection(db, 'categories');

export const addCategory = async (category: Category) => {
  try {
    await addDoc(categoriesCollectionRef, category);
    console.log('Category added successfully!');
  } catch (e) {
    console.error('Error adding category: ', e);
  }
};

// Added getCategories function
export const getCategories = async (): Promise<Category[]> => {
  try {
    const q = query(categoriesCollectionRef);
    const querySnapshot = await getDocs(q);
    const categories: Category[] = [];
    querySnapshot.forEach((doc) => {
      categories.push({ id: doc.id, ...doc.data() } as Category);
    });
    return categories;
  } catch (e) {
    console.error('Error getting categories: ', e);
    return [];
  }
};

// Added getCategory function
export const getCategory = async (id: string): Promise<Category | null> => {
  try {
    const categoryDocRef = doc(db, 'categories', id);
    const categorySnapshot = await getDoc(categoryDocRef);
    if (categorySnapshot.exists()) {
      return { id: categorySnapshot.id, ...categorySnapshot.data() as Category };
    } else {
      console.log('No such category!');
      return null;
    }
  } catch (e) {
    console.error('Error getting category: ', e);
    return null;
  }
};

// Added updateCategory function
export const updateCategory = async (id: string, newData: Partial<Category>) => {
  try {
    const categoryDocRef = doc(db, 'categories', id);
    await updateDoc(categoryDocRef, newData);
    console.log('Category updated successfully!');
  } catch (e) {
    console.error('Error updating category: ', e);
  }
};

// Added deleteCategory function
export const deleteCategory = async (id: string) => {
  try {
    const categoryDocRef = doc(db, 'categories', id);
 return await deleteDoc(categoryDocRef);
    console.log('Category deleted successfully!');
  } catch (e) {
    console.error('Error deleting category: ', e);
  }
};