// src/lib/users.ts
import { collection, doc, getDocs, query, setDoc, getDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { User } from '../types/firestore';
import type { UserRole } from '@/types'; // For validating role

const usersCollectionRef = collection(db, 'users');

export const addUser = async (user: User) => {
  try {
    if (!user.id) {
      throw new Error("User ID is required to add user to Firestore.");
    }
    const { id, ...userData } = user; // Separate id from the rest of the data

    // Ensure role is one of the allowed UserRole types, default if not.
    const validRoles: UserRole[] = ['admin', 'manager', 'seller'];
    const finalRole: UserRole = userData.role && validRoles.includes(userData.role as UserRole) ? userData.role as UserRole : 'seller';

    const dataToSet = {
      ...userData,
      role: finalRole,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };
    // Remove undefined fields to prevent Firestore errors
    Object.keys(dataToSet).forEach(key => dataToSet[key as keyof typeof dataToSet] === undefined && delete dataToSet[key as keyof typeof dataToSet]);


    await setDoc(doc(db, 'users', id), dataToSet);
    console.log('User added successfully to Firestore with ID: ', id);
  } catch (e) {
    console.error('Error adding user to Firestore: ', e);
    throw e; // Re-throw to be caught by caller
  }
};

export const getUsers = async (): Promise<User[]> => {
  try {
    const q = query(usersCollectionRef);
    const querySnapshot = await getDocs(q);
    const users: User[] = [];
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() } as User);
    });
    return users;
  } catch (e) {
    console.error('Error getting users: ', e);
    throw e; // Re-throw
  }
};

export const getUser = async (id: string): Promise<User | null> => {
  try {
    const userDocRef = doc(db, 'users', id);
    const userSnapshot = await getDoc(userDocRef);
    if (userSnapshot.exists()) {
      return { id: userSnapshot.id, ...userSnapshot.data() as User };
    } else {
      console.log('No such user!');
      return null;
    }
  } catch (e) {
    console.error('Error getting user: ', e);
    throw e; // Re-throw
  }
};

export const updateUser = async (id: string, newData: Partial<Omit<User, 'id' | 'email' | 'createdAt'>>) => {
  try {
    const userDocRef = doc(db, 'users', id);
    const dataToUpdate = {
        ...newData,
        updatedAt: serverTimestamp() as Timestamp,
    };
    // Remove undefined fields
    Object.keys(dataToUpdate).forEach(key => dataToUpdate[key as keyof typeof dataToUpdate] === undefined && delete dataToUpdate[key as keyof typeof dataToUpdate]);

    await updateDoc(userDocRef, dataToUpdate);
    console.log('User updated successfully!');
  } catch (e) {
    console.error('Error updating user: ', e);
    throw e; // Re-throw
  }
};

export const deleteUser = async (id: string) => {
  try {
    const userDocRef = doc(db, 'users', id);
    await deleteDoc(userDocRef);
    console.log('User deleted successfully from Firestore!');
  } catch (e) {
    console.error('Error deleting user from Firestore:', e);
    throw e; // Re-throw the error
  }
};
